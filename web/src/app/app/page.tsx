"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";

// 画面で扱うシーン型を固定する。
type SceneId = "forecast_meeting" | "ride_along_feedback" | "slack_callout";

// シーン選択肢を1か所で管理する。
const SCENES: Array<{ id: SceneId; title: string; description: string }> = [
  // ①ヨミ会向けの選択肢を定義する。
  {
    id: "forecast_meeting",
    title: "① ヨミ会・進捗報告の前夜",
    description: "明日の返しと根拠を整理する",
  },
  // ②同行フィードバック向けの選択肢を定義する。
  {
    id: "ride_along_feedback",
    title: "② 同行・商談後のフィードバック",
    description: "自分なりの解釈を整理する",
  },
  // ③Slack呼び出し向けの選択肢を定義する。
  {
    id: "slack_callout",
    title: "③ 「ちょっといい？」Slack呼び出し",
    description: "最初の一言と答え方を決める",
  },
];

// アプリ本体ページを描画する。
export default function AppPage() {
  // ログインユーザーを保持する。
  const [user, setUser] = useState<User | null>(null);
  // Firebase 初期化エラーを保持する。
  const [authInitError, setAuthInitError] = useState<string | null>(null);
  // 選択中シーンを保持する。
  const [sceneId, setSceneId] = useState<SceneId>("forecast_meeting");
  // 生入力メモを保持する。
  const [rawNote, setRawNote] = useState("");
  // 上司のセリフを保持する。
  const [managerQuote, setManagerQuote] = useState("");
  // 自分の返答を保持する。
  const [selfResponse, setSelfResponse] = useState("");
  // 送信中フラグを保持する。
  const [loading, setLoading] = useState(false);
  // エラーメッセージを保持する。
  const [error, setError] = useState("");
  // AI結果を保持する。
  const [result, setResult] = useState<{
    situation_analysis: string;
    morning_action: string;
    copy_paste_text: string;
    empathy_line?: string;
    bad_news_first_line?: string;
    fallback_reply?: string;
  } | null>(null);

  // 選択シーン情報を引き当てる。
  const selectedScene = useMemo(
    () => SCENES.find((scene) => scene.id === sceneId),
    [sceneId]
  );

  // Firebase Auth の状態を購読する。
  useEffect(() => {
    // 購読解除関数を保持する。
    let unsubscribe: (() => void) | undefined;
    try {
      // Auth インスタンスを取得する。
      const auth = getFirebaseAuth();
      // ログイン状態の変化を監視する。
      unsubscribe = onAuthStateChanged(auth, (nextUser) => setUser(nextUser));
    } catch (e) {
      // 実際のエラー内容を出す（NEXT_PUBLIC が未反映のときは再起動で直ることが多い）。
      const detail = e instanceof Error ? e.message : String(e);
      setAuthInitError(
        `${detail} — .env.local を変えたあと必ず dev サーバー（npm run dev）を一度止めて再起動してください。`
      );
    }
    // アンマウント時に購読を解除する。
    return () => unsubscribe?.();
  }, []);

  // Google でサインインする。
  const handleGoogleSignIn = async () => {
    setError("");
    try {
      // Auth とプロバイダを用意する。
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      // ポップアップで Google ログインする。
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Googleログインに失敗しました。"
      );
    }
  };

  // サインアウトする。
  const handleSignOut = async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch {
      // 失敗しても致命的ではないため握りつぶす。
    }
  };

  // 生成APIを呼び出す。
  const handleGenerate = async () => {
    // 空入力を防ぐ。
    if (!rawNote.trim()) {
      setError("状況メモを入力してください。");
      return;
    }
    // エラーを初期化する。
    setError("");
    // 未ログインなら案内する。
    if (!user) {
      setError("先に Google でログインしてください。");
      return;
    }
    // 送信中へ切り替える。
    setLoading(true);
    try {
      // 最新の ID トークンを取得する。
      const idToken = await user.getIdToken();
      // APIへPOST送信する。
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          // シーンIDを送る。
          scene_id: sceneId,
          // 生入力メモを送る。
          raw_note: rawNote,
          // 上司セリフを送る。
          manager_quote: managerQuote,
          // 自分返答を送る。
          self_response: selfResponse,
        }),
      });
      // エラーレスポンス時は内容を表示する。
      if (!response.ok) {
        const fail = (await response.json()) as { message?: string };
        throw new Error(fail.message ?? "生成に失敗しました。");
      }
      // 正常レスポンスを読む。
      const data = (await response.json()) as {
        ai_output: {
          situation_analysis: string;
          morning_action: string;
          copy_paste_text: string;
          empathy_line?: string;
          bad_news_first_line?: string;
          fallback_reply?: string;
        };
      };
      // 結果を画面へ反映する。
      setResult(data.ai_output);
    } catch (e) {
      // 例外時の表示文を整える。
      setError(e instanceof Error ? e.message : "不明なエラーが発生しました。");
    } finally {
      // 送信中を解除する。
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">MIKATA | 今夜の準備</h1>
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
          <label className="mt-4 block text-sm font-medium">状況メモ（必須）</label>
          <textarea
            value={rawNote}
            onChange={(event) => setRawNote(event.target.value)}
            rows={5}
            placeholder="例: 進捗遅いと詰められた。理由は優先度変更だが説明が弱かった。"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <label className="mt-4 block text-sm font-medium">上司のセリフ（任意）</label>
          <input
            value={managerQuote}
            onChange={(event) => setManagerQuote(event.target.value)}
            placeholder="例: 根拠は？いつまでに挽回するの？"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <label className="mt-4 block text-sm font-medium">自分の返答（任意）</label>
          <input
            value={selfResponse}
            onChange={(event) => setSelfResponse(event.target.value)}
            placeholder="例: すみません、頑張ります..."
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <p className="mt-4 text-xs text-slate-400">
            顧客名・個人名・未公開数値は、顧客X / 上司A / ○万円 など伏せ字で入力してください。
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !user || !!authInitError}
            className="mt-4 rounded-full bg-cyan-400 px-5 py-2 font-semibold text-slate-950 disabled:opacity-60"
          >
            {loading ? "生成中..." : "カンペを生成する（無料）"}
          </button>
          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>
        {result ? (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-lg font-semibold">生成結果</h2>
            {result.empathy_line ? (
              <p className="mt-3 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-200">
                {result.empathy_line}
              </p>
            ) : null}
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-xs text-slate-400">状況分析</p>
                <p className="mt-1">{result.situation_analysis}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">明日の1アクション</p>
                <p className="mt-1 font-semibold text-cyan-300">
                  {result.morning_action}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">コピペ文</p>
                <textarea
                  readOnly
                  value={result.copy_paste_text}
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
                />
              </div>
              {result.bad_news_first_line ? (
                <div>
                  <p className="text-xs text-slate-400">
                    バッドニュースファースト
                  </p>
                  <p className="mt-1">{result.bad_news_first_line}</p>
                </div>
              ) : null}
              {result.fallback_reply ? (
                <div>
                  <p className="text-xs text-slate-400">予備返答</p>
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

