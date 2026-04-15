"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collectAllInputWarnings } from "@/lib/input-sanitize";
import { GENERATE_CLIENT_TIMEOUT_MS } from "@/lib/generate-limits";
import { getFirebaseAuth } from "@/lib/firebase-client";

// 画面で扱うシーン型を固定する。
type SceneId = "forecast_meeting" | "ride_along_feedback" | "slack_callout";

// シーン選択肢を1か所で管理する（LPの①②③説明と揃える）。
const SCENES: Array<{ id: SceneId; title: string; description: string }> = [
  {
    id: "forecast_meeting",
    title: "① ヨミ会・進捗報告の前夜",
    description: "「で、根拠は？」に詰まらないための返しと根拠を用意する",
  },
  {
    id: "ride_along_feedback",
    title: "② 同行・商談後のフィードバック",
    description: "「何がダメだった？」に答えられるよう、自分なりの解釈を整理する",
  },
  {
    id: "slack_callout",
    title: "③ 「ちょっといい？」Slack呼び出し",
    description: "最初の一言で詰まらないための準備をする",
  },
];

// クイックタグ（クリックで状況メモに追記するだけ。APIは変更不要）。
const QUICK_TAGS: Record<SceneId, string[]> = {
  forecast_meeting: [
    "決裁者が不在で案件が止まっている",
    "いつ受注になるか言い切れない案件がある",
    "上司には「頑張ります」しか返せていない",
    "優先度が変わったが説明が弱かった",
    "パイプラインはあるが確度の言語化ができていない",
  ],
  ride_along_feedback: [
    "商談で詰まったポイントがある",
    "失注理由が言い訳に聞こえた",
    "次の打ち手が抽象的だった",
    "顧客の反応を取りこぼした気がする",
    "同行者の指摘がそのまま言えない",
  ],
  slack_callout: [
    "急な呼び出しで内容が読めない",
    "前回の宿題が未完了",
    "数字の説明を求められそう",
    "他部署案件のすれ違いがある",
    "通知が来ただけで身構えてしまう",
  ],
};

const RAW_NOTE_PLACEHOLDER = `例:
- 決裁者が不在で案件が止まっている
- いつ受注になるか言い切れない案件が2件ある
- 上司には「頑張ります」しか返せていない`;

// アプリ本体ページを描画する。
export default function AppPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authInitError, setAuthInitError] = useState<string | null>(null);
  const [sceneId, setSceneId] = useState<SceneId>("forecast_meeting");
  const [rawNote, setRawNote] = useState("");
  const [managerQuote, setManagerQuote] = useState("");
  const [selfResponse, setSelfResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const [inputWarnings, setInputWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<{
    situation_analysis: string;
    morning_action: string;
    copy_paste_text: string;
    empathy_line?: string;
    bad_news_first_line?: string;
    fallback_reply?: string;
  } | null>(null);

  const selectedScene = useMemo(
    () => SCENES.find((scene) => scene.id === sceneId),
    [sceneId]
  );

  const quickTagsForScene = QUICK_TAGS[sceneId];

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(auth, (nextUser) => setUser(nextUser));
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      const host = window.location.hostname;
      const isLocalDev =
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "[::1]";
      const tail = isLocalDev
        ? ".env.local を変えたあと必ず dev（npm run dev）を一度止めて再起動してください。"
        : "本番では Vercel の Environment Variables（Production）に NEXT_PUBLIC_FIREBASE_* 4つを入れ、Redeploy してください。.env.local はデプロイに含まれません。";
      setAuthInitError(`${detail} — ${tail}`);
    }
    return () => unsubscribe?.();
  }, []);

  const appendToRawNote = (line: string) => {
    setRawNote((prev) => {
      const t = prev.trim();
      if (!t) return line;
      return `${t}\n${line}`;
    });
  };

  const handleGoogleSignIn = async () => {
    setError("");
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Googleログインに失敗しました。"
      );
    }
  };

  const handleSignOut = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch {
      // 失敗しても致命的ではないため握りつぶす。
    }
  };

  const handleCopyReport = async () => {
    if (!result?.copy_paste_text) return;
    try {
      await navigator.clipboard.writeText(result.copy_paste_text);
      setCopyState("ok");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("fail");
      window.setTimeout(() => setCopyState("idle"), 4000);
    }
  };

  const handleGenerate = async () => {
    if (!rawNote.trim()) {
      setError("状況メモを入力してください。");
      return;
    }
    setError("");
    if (!user) {
      setError("先に Google でログインしてください。");
      return;
    }
    setLoading(true);
    setInputWarnings(
      collectAllInputWarnings({
        raw_note: rawNote,
        manager_quote: managerQuote,
        self_response: selfResponse,
      })
    );
    try {
      const idToken = await user.getIdToken();
      const controller = new AbortController();
      const timeoutMs = GENERATE_CLIENT_TIMEOUT_MS;
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            scene_id: sceneId,
            raw_note: rawNote,
            manager_quote: managerQuote,
            self_response: selfResponse,
          }),
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }
      if (!response.ok) {
        const text = await response.text();
        let msg = "生成に失敗しました。";
        try {
          const fail = JSON.parse(text) as { message?: string };
          if (typeof fail.message === "string" && fail.message.trim()) {
            msg = fail.message;
          }
        } catch {
          msg = `${msg}（HTTP ${response.status}）`;
        }
        throw new Error(msg);
      }
      const data = (await response.json()) as {
        ai_output: {
          situation_analysis: string;
          morning_action: string;
          copy_paste_text: string;
          empathy_line?: string;
          bad_news_first_line?: string;
          fallback_reply?: string;
        };
        input_warnings?: string[];
      };
      setResult(data.ai_output);
      if (Array.isArray(data.input_warnings) && data.input_warnings.length > 0) {
        setInputWarnings(data.input_warnings);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError(
          "応答に時間がかかりすぎたため中断しました。Vercel の関数タイムアウトや OpenAI の混雑の可能性があります。しばらくしてから再度お試しください。"
        );
      } else {
        setError(
          e instanceof Error ? e.message : "不明なエラーが発生しました。"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">
          <Link
            href="/"
            className="text-cyan-400 transition hover:text-cyan-300 hover:underline"
          >
            MIKATA
          </Link>
          <span className="text-slate-100"> | 今夜の準備</span>
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          シーン3択→状況入力→カンペ生成の順で進めます。
        </p>
        {authInitError ? (
          <p className="mt-4 rounded-xl border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
            {authInitError}
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-slate-300">
                  ログイン中: {user.email ?? user.uid}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
              >
                Googleでログイン
              </button>
            )}
          </div>
        )}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {SCENES.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => setSceneId(scene.id)}
              className={`rounded-xl border p-4 text-left ${
                scene.id === sceneId
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-slate-700 bg-slate-900/40"
              }`}
            >
              <p className="font-medium">{scene.title}</p>
              <p className="mt-1 text-xs text-slate-300">{scene.description}</p>
            </button>
          ))}
        </div>
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <p className="text-sm text-slate-300">
            選択中: {selectedScene?.title ?? "シーン未選択"}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            入力内容はAI生成のためOpenAI, LLC（米国）に送信されます。顧客名・企業名・金額などは
            <span className="text-slate-200">必ず伏せ字</span>
            で入力してください（例：A社、顧客X、〇万円）。
          </p>
          <p className="mt-4 text-sm font-medium">クイックタグ（タップで状況メモに追記）</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickTagsForScene.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => appendToRawNote(tag)}
                className="rounded-full border border-slate-600 bg-slate-950/60 px-3 py-1 text-xs text-slate-200 hover:border-cyan-500/60 hover:text-cyan-100"
              >
                {tag}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-sm font-medium">状況メモ（必須）</label>
          <textarea
            value={rawNote}
            onChange={(event) => setRawNote(event.target.value)}
            rows={6}
            placeholder={RAW_NOTE_PLACEHOLDER}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <label className="mt-4 block text-sm font-medium">上司のセリフ（任意）</label>
          <input
            value={managerQuote}
            onChange={(event) => setManagerQuote(event.target.value)}
            placeholder='例: 「で、根拠は？」「いつまでに挽回するの？」'
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <label className="mt-4 block text-sm font-medium">自分の返答（任意）</label>
          <input
            value={selfResponse}
            onChange={(event) => setSelfResponse(event.target.value)}
            placeholder='例: 「すみません、説明が足りませんでした。明日までに…」'
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <p className="mt-4 text-xs text-slate-400">
            顧客名・個人名・未公開数値は、顧客X / 上司A / ○万円 など伏せ字で入力してください。
          </p>
          {inputWarnings.length > 0 ? (
            <div
              className="mt-3 rounded-xl border border-amber-800/80 bg-amber-950/30 px-3 py-2 text-xs text-amber-100/95"
              role="status"
            >
              <p className="font-medium text-amber-100">入力内容の確認（そのまま生成できます）</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-100/85">
                {inputWarnings.map((w, i) => (
                  <li key={`${i}-${w}`}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !user || !!authInitError}
            className="mt-4 rounded-full bg-cyan-400 px-5 py-2 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? "生成中…" : "カンペを生成する（無料）"}
          </button>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>
        {result ? (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-lg font-semibold">生成結果</h2>
            <p className="mt-2 text-xs text-slate-500">
              ※実在の顧客名・会社名・未公開の数値を、そのまま他人に見せたくない場合は、コピペ前に自分で伏せ字に置き換えてください。
            </p>
            <div className="mt-4 border-b border-slate-800 pb-4">
              <p className="text-base font-medium text-slate-100">
                正直、こういう状況しんどいですよね。
              </p>
              <p className="mt-2 text-xs text-slate-400">
                MIKATAは業務上の準備を助けるツールです。
              </p>
              <p className="mt-1 text-xs text-slate-500">
                ※本サービスは医療・心理支援サービスではありません。
              </p>
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-xs text-slate-400">今の状況（何が起きてるか）</p>
                <p className="mt-1">{result.situation_analysis}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">明日やること（これで詰まない）</p>
                <p className="mt-1 font-semibold text-cyan-300">
                  {result.morning_action}
                </p>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">このまま送れる報告文</p>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    {copyState === "ok" ? "コピーしました" : "コピー"}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result.copy_paste_text}
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                />
                {copyState === "fail" ? (
                  <p className="mt-2 text-xs text-amber-200/90">
                    ブラウザがコピーを拒否しました。テキストを選択してコピーしてください。
                  </p>
                ) : null}
              </div>
              {result.bad_news_first_line ? (
                <div>
                  <p className="text-xs text-slate-400">最初にこれだけ言えばOK</p>
                  <p className="mt-1">{result.bad_news_first_line}</p>
                </div>
              ) : null}
              {result.fallback_reply ? (
                <div>
                  <p className="text-xs text-slate-400">詰められた時の返し</p>
                  <p className="mt-1">{result.fallback_reply}</p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
