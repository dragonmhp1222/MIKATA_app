"use client";

import { useLayoutEffect } from "react";

const STORAGE_KEY = "mikata-theme";

// ハイドレーション後に html[data-theme] を再適用する（React との差分を吸収）。
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      document.documentElement.setAttribute(
        "data-theme",
        s === "light" ? "light" : "dark"
      );
    } catch {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  return children;
}
