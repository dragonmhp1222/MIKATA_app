"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "mikata-theme";

// ヘッダー等に置くライト／ダーク切り替え（html[data-theme] をトグル。Tailwind dark: は data-theme=dark に対応）。
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(
      document.documentElement.getAttribute("data-theme") === "dark"
    );
  }, []);

  const toggle = () => {
    const nextDark =
      document.documentElement.getAttribute("data-theme") !== "dark";
    document.documentElement.setAttribute(
      "data-theme",
      nextDark ? "dark" : "light"
    );
    localStorage.setItem(STORAGE_KEY, nextDark ? "dark" : "light");
    setIsDark(nextDark);
  };

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
