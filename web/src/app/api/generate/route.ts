import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { checkAndConsumeFreeQuota } from "@/lib/free-limit";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { aiOutputSchema, generateInputSchema } from "@/lib/schema";

// 秒数はリテラル必須（Next の静的解析）。`@/lib/generate-limits` の GENERATE_SERVER_MAX_DURATION_SEC と同じにすること。
// クライアントの fetch タイムアウトより長くする（短いと 504 HTML が先に返る）。
export const maxDuration = 120;

// OpenAIクライアントを必要時に生成してビルド時評価を避ける。
function getOpenAiClient() {
  // APIキーを読む。
  const apiKey = process.env.OPENAI_API_KEY;
  // 未設定なら明確なエラーにする。
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }
  // クライアントを返す。
  return new OpenAI({ apiKey });
}

// Authorization ヘッダーから Bearer トークンを取り出す。
function getBearerToken(req: Request): string | null {
  // ヘッダー文字列を取得する。
  const header = req.headers.get("authorization");
  // 形式が Bearer でなければ null を返す。
  if (!header?.startsWith("Bearer ")) return null;
  // プレフィックスを除いたトークンを返す。
  return header.slice(7).trim() || null;
}

// 生成APIのPOSTハンドラ。
export async function POST(req: Request) {
  try {
    // 本番で未設定だと OpenAI 呼び出しで落ちるため、早めに明示的に返す。
    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        {
          error: "OPENAI_NOT_CONFIGURED",
          message:
            "OPENAI_API_KEY が設定されていません。Vercel の Environment Variables（Production）を確認してください。",
        },
        { status: 503 }
      );
    }

    // IDトークンを取得する。
    const idToken = getBearerToken(req);
    // 無ければ未認証として拒否する。
    if (!idToken) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "ログインが必要です。Googleでサインインしてください。",
        },
        { status: 401 }
      );
    }
    // Admin Auth でトークンを検証して UID を得る。
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // リクエストJSONを読む。
    const body = await req.json();
    // 入力をスキーマ検証して型安全にする。
    const input = generateInputSchema.parse(body);

    // Firestoreを取得して無料枠をチェックする。
    const db = getAdminDb();
    // 1日1回制限を判定して、利用時は消費を記録する。
    const quota = await checkAndConsumeFreeQuota(db, uid);
    // 利用不可なら429で返す。
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "FREE_LIMIT_REACHED",
          message:
            "本日の無料生成上限に達しました。JST 04:00以降に再度お試しください。",
          next_reset_at: quota.nextResetJstIso,
        },
        { status: 429 }
      );
    }

    // システムプロンプトを作る。
    const systemPrompt = buildSystemPrompt();
    // ユーザープロンプトを作る。
    const userPrompt = buildUserPrompt(input);
    // OpenAIクライアントを取得する。
    const client = getOpenAiClient();

    // OpenAIを呼び出してJSON形式で受け取る。
    const response = await client.responses.create({
      // モデルは環境変数で切り替え可能にする。
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      // テキスト出力形式をJSONへ固定する。
      text: { format: { type: "json_object" } },
      // 会話入力を渡す。
      input: [
        {
          // システムメッセージを渡す。
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          // ユーザーメッセージを渡す。
          role: "user",
          content: [{ type: "input_text", text: userPrompt }],
        },
      ],
    });

    // 文字列出力を取得する。
    const rawText = response.output_text;
    if (!rawText?.trim()) {
      return NextResponse.json(
        {
          error: "EMPTY_AI_OUTPUT",
          message:
            "AIからの応答が空でした。しばらく待ってから再度お試しください。",
        },
        { status: 502 }
      );
    }
    // JSONとして解析する。
    const rawJson = JSON.parse(rawText);
    // 出力契約を検証する。
    const output = aiOutputSchema.parse(rawJson);

    // セッションを保存する。
    const sessionRef = db.collection("sessions").doc();
    // Firestoreに保存する。
    await sessionRef.set({
      // セッションIDを保存する。
      session_id: sessionRef.id,
      // ユーザーIDを保存する。
      user_id: uid,
      // シーンIDを保存する。
      scene_id: input.scene_id,
      // 入力データを保存する。
      input_payload: {
        raw_note: input.raw_note,
        manager_quote: input.manager_quote,
        self_response: input.self_response,
      },
      // AI出力を保存する。
      ai_output: output,
      // 初期状態では未実行にする。
      execution_result: { is_executed: false },
      // 作成時刻を保存する。
      created_at: new Date(),
      // 更新時刻を保存する。
      updated_at: new Date(),
    });

    // 正常レスポンスを返す。
    return NextResponse.json({
      session_id: sessionRef.id,
      ai_output: output,
    });
  } catch (error) {
    // ユーザー文面はログに出さず、原因調査用にメッセージのみ（Vercel の Functions ログで確認可能）。
    console.error(
      "[api/generate]",
      error instanceof Error ? error.message : String(error)
    );
    // Firebase のトークン不正は 401 で返す。
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code.startsWith("auth/")) {
      return NextResponse.json(
        {
          error: "INVALID_TOKEN",
          message: "セッションの有効期限が切れた可能性があります。再度ログインしてください。",
        },
        { status: 401 }
      );
    }
    // Zod検証エラーは400で返す。
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: error.flatten() },
        { status: 400 }
      );
    }
    // 予期しないエラーは500で返す。
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message:
          "生成処理でエラーが発生しました。入力内容を短くして再実行してください。",
      },
      { status: 500 }
    );
  }
}

