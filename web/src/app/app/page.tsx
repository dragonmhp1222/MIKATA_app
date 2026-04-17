"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import posthog from "posthog-js";
import { collectAllInputWarnings } from "@/lib/input-sanitize";
import { GENERATE_CLIENT_TIMEOUT_MS } from "@/lib/generate-limits";
import { getFirebaseAuth } from "@/lib/firebase-client";
import { LegalConsentSection } from "@/components/LegalConsentSection";
import { LegalFooter } from "@/components/LegalFooter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnalyticsEvents } from "@/lib/analytics-events";
import {
  readStoredLpVariant,
  writeStoredLpVariant,
  type LpVariantSource,
} from "@/lib/lp-variant-session";

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
  const [lpVariant, setLpVariant] = useState("direct");
  const [lpVariantSource, setLpVariantSource] =
    useState<LpVariantSource>("default");
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [rawNote, setRawNote] = useState("");
  const [managerQuote, setManagerQuote] = useState("");
  const [selfResponse, setSelfResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const [entryUrlCopied, setEntryUrlCopied] = useState<"idle" | "ok" | "fail">("idle");
  const [inputWarnings, setInputWarnings] = useState<string[]>([]);
  const [legalGateOk, setLegalGateOk] = useState(false);
  const [browserContext, setBrowserContext] = useState<{
    isXInAppBrowser: boolean;
    currentUrl: string;
  }>({
    isXInAppBrowser: false,
    currentUrl: "",
  });
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

  const handleLegalGateChange = useCallback((ok: boolean) => {
    setLegalGateOk(ok);
  }, []);

  // 直前の uid（初回は undefined）。未ログイン→初ログインではフォームを消さず、ログアウト／アカウント切替だけ消す。
  const prevAuthUidRef = useRef<string | null | undefined>(undefined);

  const resetSessionFormForNewViewer = useCallback(() => {
    setSceneId("forecast_meeting");
    setRawNote("");
    setManagerQuote("");
    setSelfResponse("");
    setLoading(false);
    setError("");
    setCopyState("idle");
    setInputWarnings([]);
    setLegalGateOk(false);
    setResult(null);
  }, []);

  // LP からの流入情報（scene / lp_variant）を初期値に反映する。URL優先、なければ同一タブ内の直近LP閲覧（sessionStorage）。
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("scene");
    if (
      s === "forecast_meeting" ||
      s === "ride_along_feedback" ||
      s === "slack_callout"
    ) {
      setSceneId(s);
    }
    const variant = params.get("lp_variant")?.trim().toLowerCase();
    if (variant) {
      writeStoredLpVariant(variant);
      setLpVariant(variant);
      setLpVariantSource("url");
    } else {
      const stored = readStoredLpVariant();
      if (stored) {
        setLpVariant(stored);
        setLpVariantSource("session");
      } else {
        setLpVariant("direct");
        setLpVariantSource("default");
      }
    }
    setAnalyticsReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // X アプリ内ブラウザは Google ログインのポリシーで弾かれやすいため先に検知する。
    const ua = window.navigator.userAgent;
    const isXInAppBrowser = /Twitter|X-Client|x-app/i.test(ua);
    setBrowserContext({
      isXInAppBrowser,
      currentUrl: window.location.href,
    });
  }, []);

  // 初月検証用: app閲覧と翌日再訪（同一ブラウザ内）を PostHog に送る。
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || typeof window === "undefined") {
      return;
    }
    if (!analyticsReady) return;
    const uid = user?.uid ?? "anon";
    const keySeen = `mikata-last-seen-${uid}`;
    const keyGenerated = `mikata-last-generate-${uid}`;
    const today = new Date().toISOString().slice(0, 10);
    const lastSeen = localStorage.getItem(keySeen);
    const lastGenerated = localStorage.getItem(keyGenerated);

    const isXInAppBrowser = /Twitter|X-Client|x-app/i.test(
      window.navigator.userAgent
    );

    posthog.capture(AnalyticsEvents.appView, {
      lp_variant: lpVariant,
      lp_variant_source: lpVariantSource,
      url_had_lp_variant: lpVariantSource === "url",
      scene_id: sceneId,
      is_logged_in: Boolean(user),
      is_x_in_app_browser: isXInAppBrowser,
    });

    if (lastSeen && lastSeen !== today && lastGenerated === lastSeen) {
      posthog.capture(AnalyticsEvents.nextDayReturn, {
        lp_variant: lpVariant,
        lp_variant_source: lpVariantSource,
        days_since_last_seen: 1,
      });
    }

    localStorage.setItem(keySeen, today);
  }, [analyticsReady, user?.uid, lpVariant, lpVariantSource, sceneId, user]);

  useEffect(() => {
    const uid = user?.uid ?? null;
    const prev = prevAuthUidRef.current;

    if (prev === undefined) {
      prevAuthUidRef.current = uid;
      return;
    }
    if (prev === uid) {
      return;
    }

    const wasLoggedIn = prev !== null;
    const isLoggedIn = uid !== null;
    const isAccountSwitch = wasLoggedIn && isLoggedIn && prev !== uid;

    if ((wasLoggedIn && !isLoggedIn) || isAccountSwitch) {
      resetSessionFormForNewViewer();
    }

    prevAuthUidRef.current = uid;
  }, [user?.uid, resetSessionFormForNewViewer]);

  const resultSectionRef = useRef<HTMLElement | null>(null);

  // 生成完了後、結果ブロックが画面外だと気づかれないためスムーズスクロールする。
  useEffect(() => {
    if (!result) return;
    const id = window.requestAnimationFrame(() => {
      resultSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [result]);

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
    if (browserContext.isXInAppBrowser) {
      setError(
        "Xアプリ内ブラウザではGoogleログインがブロックされる場合があります。右上メニューからSafari/Chromeで開いてからログインしてください。"
      );
      return;
    }
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

  const handleCopyEntryUrl = async () => {
    if (!browserContext.currentUrl) return;
    try {
      await navigator.clipboard.writeText(browserContext.currentUrl);
      setEntryUrlCopied("ok");
      window.setTimeout(() => setEntryUrlCopied("idle"), 2000);
    } catch {
      setEntryUrlCopied("fail");
      window.setTimeout(() => setEntryUrlCopied("idle"), 4000);
    }
  };

  const handleGenerate = async () => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.capture(AnalyticsEvents.generateClick, {
        lp_variant: lpVariant,
        lp_variant_source: lpVariantSource,
        scene_id: sceneId,
        has_raw_note: Boolean(rawNote.trim()),
        is_logged_in: Boolean(user),
        legal_gate_ok: legalGateOk,
      });
    }
    if (!rawNote.trim()) {
      setError("状況メモを入力してください。");
      return;
    }
    setError("");
    if (!user) {
      setError("先に Google でログインしてください。");
      return;
    }
    if (!legalGateOk) {
      setError(
        "プライバシーポリシーと利用規約を表示して確認し、同意にチェックを入れてください。"
      );
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
          const fail = JSON.parse(text) as {
            message?: string;
            error?: string;
          };
          if (typeof fail.message === "string" && fail.message.trim()) {
            msg = fail.message;
          }
          if (response.status === 403 && fail.error === "LEGAL_CONSENT_REQUIRED") {
            setLegalGateOk(false);
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
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.capture(AnalyticsEvents.generateSuccess, {
          lp_variant: lpVariant,
          lp_variant_source: lpVariantSource,
          scene_id: sceneId,
        });
        const uid = user?.uid ?? "anon";
        const keyGenerated = `mikata-last-generate-${uid}`;
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem(keyGenerated, today);
      }
      if (Array.isArray(data.input_warnings) && data.input_warnings.length > 0) {
        setInputWarnings(data.input_warnings);
      }
    } catch (e) {
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.capture(AnalyticsEvents.generateFailure, {
          lp_variant: lpVariant,
          lp_variant_source: lpVariantSource,
          scene_id: sceneId,
          error_name: e instanceof Error ? e.name : "unknown",
        });
      }
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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            <Link
              href="/"
              className="text-cyan-600 transition hover:text-cyan-700 hover:underline dark:text-cyan-400 dark:hover:text-cyan-300"
            >
              MIKATA
            </Link>
            <span className="text-slate-900 dark:text-slate-100">
              {" "}
              | 今夜の準備
            </span>
          </h1>
          <ThemeToggle />
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          シーン3択→状況入力→カンペ生成の順で進めます。
        </p>
        {authInitError ? (
          <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            {authInitError}
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    ログイン中: {user.email ?? user.uid}
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="cursor-pointer select-none rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-800 shadow-sm transition-shadow duration-150 hover:bg-slate-100 hover:shadow active:translate-y-px active:shadow-inner dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    ログアウト
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="cursor-pointer select-none rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-md transition-shadow duration-150 hover:bg-slate-800 hover:shadow-lg active:translate-y-px active:shadow-inner dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Googleでログイン
                </button>
              )}
            </div>
            {browserContext.isXInAppBrowser && !user ? (
              <div className="mt-3 rounded-2xl border border-amber-300/90 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/30 dark:text-amber-100/95">
                <p className="font-semibold">
                  Xアプリ内ブラウザでは、Googleログインがブロックされる場合があります。
                </p>
                <p className="mt-2 leading-relaxed">
                  お手数ですが、右上メニューから
                  <span className="font-semibold"> Safari / Chromeで開く </span>
                  を選んでからログインしてください。
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEntryUrl}
                    className="cursor-pointer select-none rounded-full border border-amber-400/80 bg-white px-4 py-2 text-xs font-medium text-amber-950 shadow-sm transition-all duration-150 hover:shadow-md active:translate-y-px active:shadow-inner dark:bg-amber-950/20 dark:text-amber-100"
                  >
                    このページURLをコピー
                  </button>
                  <span className="text-xs text-amber-900/90 dark:text-amber-100/80">
                    {entryUrlCopied === "ok"
                      ? "URLをコピーしました。"
                      : entryUrlCopied === "fail"
                        ? "コピーできなかったため、URL欄から共有してください。"
                        : "外部ブラウザに貼り付けて開けます。"}
                  </span>
                </div>
              </div>
            ) : null}
          </>
        )}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {SCENES.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => setSceneId(scene.id)}
              className={`cursor-pointer select-none rounded-xl border p-4 text-left shadow-sm transition-all duration-150 hover:shadow-md active:translate-y-px active:shadow-inner ${
                scene.id === sceneId
                  ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-400/30 dark:border-cyan-400 dark:bg-cyan-400/10"
                  : "border-slate-200 bg-white/80 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-slate-600"
              }`}
            >
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {scene.title}
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {scene.description}
              </p>
            </button>
          ))}
        </div>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            選択中: {selectedScene?.title ?? "シーン未選択"}
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            入力内容はAI生成のためOpenAI, LLC（米国）に送信されます。顧客名・企業名・金額などは
            <span className="font-medium text-slate-800 dark:text-slate-200">
              必ず伏せ字
            </span>
            で入力してください（例：A社、顧客X、〇万円）。
          </p>
          <p className="mt-4 text-sm font-medium">クイックタグ（タップで状況メモに追記）</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {quickTagsForScene.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => appendToRawNote(tag)}
                className="cursor-pointer select-none rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-800 shadow-sm transition-transform duration-150 hover:border-cyan-500 hover:text-cyan-800 hover:shadow-md active:scale-95 active:shadow-inner dark:border-slate-600 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-cyan-500/60 dark:hover:text-cyan-100"
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
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <label className="mt-4 block text-sm font-medium">上司のセリフ（任意）</label>
          <input
            value={managerQuote}
            onChange={(event) => setManagerQuote(event.target.value)}
            placeholder='例: 「で、根拠は？」「いつまでに挽回するの？」'
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <label className="mt-4 block text-sm font-medium">自分の返答（任意）</label>
          <input
            value={selfResponse}
            onChange={(event) => setSelfResponse(event.target.value)}
            placeholder='例: 「すみません、説明が足りませんでした。明日までに…」'
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            顧客名・個人名・未公開数値は、顧客X / 上司A / ○万円 など伏せ字で入力してください。
          </p>
          {inputWarnings.length > 0 ? (
            <div
              className="mt-3 rounded-xl border border-amber-300/90 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/30 dark:text-amber-100/95"
              role="status"
            >
              <p className="font-medium text-amber-900 dark:text-amber-100">
                入力内容の確認（そのまま生成できます）
              </p>
              <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-900/90 dark:text-amber-100/85">
                {inputWarnings.map((w, i) => (
                  <li key={`${i}-${w}`}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <LegalConsentSection
            user={user}
            authBlocked={!!authInitError}
            onGateChange={handleLegalGateChange}
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={
              loading ||
              !user ||
              !!authInitError ||
              (Boolean(user) && !legalGateOk)
            }
            className="mt-4 cursor-pointer select-none rounded-full bg-cyan-400 px-5 py-2 font-semibold text-slate-950 shadow-md transition-all duration-150 hover:bg-cyan-300 hover:shadow-lg enabled:active:translate-y-px enabled:active:shadow-inner disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "生成中…" : "カンペを生成する（無料）"}
          </button>
          {error ? (
            <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>
          ) : null}
        </section>
        {result ? (
          <section
            ref={resultSectionRef}
            className="mt-6 scroll-mt-6 rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/40"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              生成結果
            </h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
              ※実在の顧客名・会社名・未公開の数値を、そのまま他人に見せたくない場合は、コピペ前に自分で伏せ字に置き換えてください。
            </p>
            <div className="mt-4 border-b border-slate-200 pb-4 dark:border-slate-800">
              <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                正直、こういう状況しんどいですよね。
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                MIKATAは業務上の準備を助けるツールです。
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                ※本サービスは医療・心理支援サービスではありません。
              </p>
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  今の状況（何が起きてるか）
                </p>
                <p className="mt-1 text-slate-800 dark:text-slate-100">
                  {result.situation_analysis}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  明日やること（これで詰まない）
                </p>
                <p className="mt-1 font-semibold text-cyan-700 dark:text-cyan-300">
                  {result.morning_action}
                </p>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    このまま送れる報告文
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="cursor-pointer select-none rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-800 shadow-sm transition-all duration-150 hover:bg-slate-100 hover:shadow active:translate-y-px active:shadow-inner dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {copyState === "ok" ? "コピーしました" : "コピー"}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={result.copy_paste_text}
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                {copyState === "fail" ? (
                  <p className="mt-2 text-xs text-amber-800 dark:text-amber-200/90">
                    ブラウザがコピーを拒否しました。テキストを選択してコピーしてください。
                  </p>
                ) : null}
              </div>
              {result.bad_news_first_line ? (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    最初にこれだけ言えばOK
                  </p>
                  <p className="mt-1 text-slate-800 dark:text-slate-100">
                    {result.bad_news_first_line}
                  </p>
                </div>
              ) : null}
              {result.fallback_reply ? (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    詰められた時の返し
                  </p>
                  <p className="mt-1 text-slate-800 dark:text-slate-100">
                    {result.fallback_reply}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
      <LegalFooter />
    </div>
  );
}
