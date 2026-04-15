"use client";

import Link from "next/link";

// LP・ブログ共通の控えめフッター（法務リンクは小さめ・低コントラスト）。
export function LegalFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200/90 px-4 py-6 text-center text-[11px] leading-relaxed text-slate-500 dark:border-slate-800/50 sm:px-6">
      <nav
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5"
        aria-label="法務・ポリシー"
      >
        <Link
          href="/legal/privacy"
          className="hover:text-slate-700 dark:hover:text-slate-400"
        >
          プライバシーポリシー
        </Link>
        <span className="text-slate-300 dark:text-slate-700" aria-hidden>
          |
        </span>
        <Link
          href="/legal/terms"
          className="hover:text-slate-700 dark:hover:text-slate-400"
        >
          利用規約
        </Link>
        <span className="text-slate-300 dark:text-slate-700" aria-hidden>
          |
        </span>
        <Link
          href="/legal/tokushoho"
          className="hover:text-slate-700 dark:hover:text-slate-400"
        >
          特定商取引法に基づく表記
        </Link>
      </nav>
    </footer>
  );
}
