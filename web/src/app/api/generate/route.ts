import { NextResponse } from "next/server";
import OpenAI, { APIError } from "openai";
import { z } from "zod";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { checkAndConsumeFreeQuota } from "@/lib/free-limit";
import {
  collectAllInputWarnings,
  lightSanitizeTextField,
} from "@/lib/input-sanitize";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt";
import { aiOutputSchema, generateInputSchema } from "@/lib/schema";

// 秒数はリテラル必須（Next の静的解析）。`@/lib/generate-limits` の GENERATE_SERVER_MAX_DURATION_SEC と同じにすること。
// クライアントの fetch タイムアウトより長くする（短いと 504 HTML が先に返る）。
export const maxDuration = 120;

// 応答のばらつきを抑えつつ、コピペ文の具体性を優先する温度。
const GENERATION_TEMPERATURE = 0.3;
// JSON/Zod 失敗時は同じ入力でもう1回だけ再試行する。
const MAX_GENERATION_ATTEMPTS = 2;

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

// AI出力JSONのトップレベルキー（ここに紐づくZodエラーは「ユーザーの入力が長い」ではなくモデル側の不整合として扱う）。
const AI_OUTPUT_TOP_KEYS = new Set([
  "situation_analysis",
  "morning_action",
  "copy_paste_text",
  "empathy_line",
  "bad_news_first_line",
  "fallback_reply",
]);

// ZodのパスがAI出力フィールドかどうかを判定する（Zodの path は PropertyKey[] になるため先頭だけ string か確認する）。
function isAiOutputZodPath(path: ReadonlyArray<PropertyKey>): boolean {
  const top = path[0];
  return typeof top === "string" && AI_OUTPUT_TOP_KEYS.has(top);
}

// Zodエラーを入力用とAI出力用に分け、クライアントが表示する短文メッセージを返す。
function zodErrorResponse(error: z.ZodError): NextResponse {
  const aiSide = error.issues.some((issue) => isAiOutputZodPath(issue.path));
  if (aiSide) {
    return NextResponse.json(
      {
        error: "AI_OUTPUT_VALIDATION",
        message:
          "AIが返した内容が想定の形式（文字数など）を満たさなかったため保存できませんでした。同じ内容のまま「カンペを生成」をもう一度押してください。",
        details: error.flatten(),
      },
      { status: 502 }
    );
  }
  const first = error.issues[0];
  const hint = first
    ? `${String(first.path[0] ?? "入力")}: ${first.message}`
    : "入力内容を確認してください。";
  return NextResponse.json(
    {
      error: "INVALID_INPUT",
      message: `入力内容を確認してください（${hint}）。`,
      details: error.flatten(),
    },
    { status: 400 }
  );
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

    // 利用規約・プライバシー同意（クライアントでチェック済みでもサーバーで必ず検証する）。
    const db = getAdminDb();
    const consentSnap = await db.collection("users").doc(uid).get();
    const consentAt = consentSnap.data()?.legal_consent_at;
    if (consentAt == null) {
      return NextResponse.json(
        {
          error: "LEGAL_CONSENT_REQUIRED",
          message:
            "利用規約・プライバシーポリシーへの同意が必要です。各文書を開いて確認し、同意にチェックを入れてから再度お試しください。",
        },
        { status: 403 }
      );
    }

    // リクエストJSONを読む。
    const body = await req.json();
    // 入力をスキーマ検証して型安全にする。
    const input = generateInputSchema.parse(body);

    // クライアントに見せる注意（送信前の原文に対するヒューリスティック）。
    const inputWarnings = [
      ...new Set(
        collectAllInputWarnings({
          raw_note: input.raw_note,
          manager_quote: input.manager_quote,
          self_response: input.self_response,
        })
      ),
    ];

    // 保存・モデル送信前の最低限の伏せ字置換（完璧ではない）。
    const sanitizedParse = generateInputSchema.safeParse({
      scene_id: input.scene_id,
      raw_note: lightSanitizeTextField(input.raw_note),
      manager_quote: lightSanitizeTextField(input.manager_quote),
      self_response: lightSanitizeTextField(input.self_response),
    });
    if (!sanitizedParse.success) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message:
            "入力の整形後に必須欄が空になりました。状況メモに、伏せ字で短い説明を入れてください。",
          details: sanitizedParse.error.flatten(),
        },
        { status: 400 }
      );
    }
    const sanitizedInput = sanitizedParse.data;

    // 無料枠をチェックする（1日1回制限。利用時は消費を記録）。
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
    // ユーザープロンプトを作る（サニタイズ済み入力）。
    const userPrompt = buildUserPrompt(sanitizedInput);
    // OpenAIクライアントを取得する。
    const client = getOpenAiClient();

    // OpenAI を最大2回まで呼び、空・JSON 崩れ・Zod 不一致のときだけ再試行する。
    let output: z.infer<typeof aiOutputSchema> | null = null;
    let lastFailureResponse: NextResponse | null = null;

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: GENERATION_TEMPERATURE,
        text: { format: { type: "json_object" } },
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
      });

      const rawText = response.output_text;
      if (!rawText?.trim()) {
        lastFailureResponse = NextResponse.json(
          {
            error: "EMPTY_AI_OUTPUT",
            message:
              "AIからの応答が空でした。しばらく待ってから再度お試しください。",
          },
          { status: 502 }
        );
        continue;
      }

      let rawJson: unknown;
      try {
        rawJson = JSON.parse(rawText);
      } catch {
        lastFailureResponse = NextResponse.json(
          {
            error: "AI_OUTPUT_NOT_JSON",
            message:
              "AIの応答をJSONとして解釈できませんでした。入力が短くても起こり得ます。しばらくしてから同じ内容でもう一度お試しください。",
          },
          { status: 502 }
        );
        continue;
      }

      const outputParse = aiOutputSchema.safeParse(rawJson);
      if (!outputParse.success) {
        lastFailureResponse = zodErrorResponse(outputParse.error);
        continue;
      }

      output = outputParse.data;
      break;
    }

    if (!output) {
      return (
        lastFailureResponse ??
        NextResponse.json(
          {
            error: "AI_GENERATION_FAILED",
            message:
              "AIの応答を確定できませんでした。しばらくしてから再度お試しください。",
          },
          { status: 502 }
        )
      );
    }

    // セッションを保存する。
    const sessionRef = db.collection("sessions").doc();
    // Firestoreに保存する。
    await sessionRef.set({
      // セッションIDを保存する。
      session_id: sessionRef.id,
      // ユーザーIDを保存する。
      user_id: uid,
      // シーンIDを保存する。
      scene_id: sanitizedInput.scene_id,
      // 入力データを保存する（保存はサニタイズ後）。
      input_payload: {
        raw_note: sanitizedInput.raw_note,
        manager_quote: sanitizedInput.manager_quote,
        self_response: sanitizedInput.self_response,
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
      input_warnings: inputWarnings,
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
    // Zod検証エラー（主にリクエスト入力）はメッセージ付きで返す。
    if (error instanceof z.ZodError) {
      return zodErrorResponse(error);
    }
    // OpenAI SDK が投げるHTTP系エラーをユーザー向けに要約する（キー不正・レート制限など）。
    if (error instanceof APIError) {
      const status = error.status ?? 502;
      if (status === 429) {
        return NextResponse.json(
          {
            error: "OPENAI_RATE_LIMIT",
            message:
              "AIサービスが混雑しています。1〜2分待ってから再度お試しください。",
          },
          { status: 429 }
        );
      }
      if (status === 401) {
        return NextResponse.json(
          {
            error: "OPENAI_AUTH",
            message:
              "OpenAI の認証に失敗しました。OPENAI_API_KEY（Vercel の Production 含む）を確認してください。",
          },
          { status: 503 }
        );
      }
      return NextResponse.json(
        {
          error: "OPENAI_ERROR",
          message:
            "AIサービス側でエラーが発生しました。しばらくしてから再度お試しください。",
        },
        { status: 502 }
      );
    }
    // 予期しないエラーは500で返す（入力の長さと結びつけない）。
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message:
          "生成処理で予期しないエラーが発生しました。しばらくしてから再度お試しください。繰り返す場合はサーバー側のログ（例: Vercel の Functions ログの [api/generate]）を確認してください。",
      },
      { status: 500 }
    );
  }
}

