"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "mikata-theme";

// html[data-theme] の変化を購読する（トグルや ThemeProvider の同期で UI を更新するため）。
function subscribe(onStoreChange: () => void) {
  const el = document.documentElement;
  const obs = new MutationObserver(onStoreChange);
  obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

// クライアントでは実際の DOM を読む（ハイドレーション後も正しい表示になる）。
function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

// SSR 時は layout のデフォルト（data-theme=dark）と揃える。水合わせのズレを減らす。
function getServerSnapshot() {
  return true;
}

// ヘッダー等に置くライト／ダーク切り替え（html[data-theme] をトグル。Tailwind dark: は data-theme=dark に対応）。
export function ThemeToggle() {
  const isDark = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const toggle = useCallback(() => {
    const nextDark =
      document.documentElement.getAttribute("data-theme") !== "dark";
    document.documentElement.setAttribute(
      "data-theme",
      nextDark ? "dark" : "light"
    );
    localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-slate-300 bg-white/90 px-3 py-1.5 text-xs text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-label={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
    >
      {isDark ? "ダーク" : "ライト"}
    </button>
  );
}
