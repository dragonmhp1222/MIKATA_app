import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { ThemeToggle } from "@/components/ThemeToggle";

// SNS・検索向け（`opengraph-image.tsx` と文言を揃える）。
export const metadata: Metadata = {
  openGraph: {
    title: "MIKATA | 詰められる前に、返し方を作る",
    description:
      "SaaS営業向けに、夜の状況入力から翌朝使える返し方を生成するWebアプリ。",
    siteName: "MIKATA",
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MIKATA | 詰められる前に、返し方を作る",
    description:
      "SaaS営業向けに、夜の状況入力から翌朝使える返し方を生成するWebアプリ。",
    images: ["/api/og"],
  },
};

// LP・ブログ共通のマーケ用シェル（アプリ /app とは UI を分ける）。
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/"
            className="font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            MIKATA
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex gap-6 text-sm text-slate-600 dark:text-slate-300">
              <Link
                href="/blog"
                className="hover:text-slate-900 dark:hover:text-white"
              >
                ブログ
              </Link>
              <Link
                href="/app"
                className="hover:text-slate-900 dark:hover:text-white"
              >
                アプリ
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      {children}
      <LegalFooter />
    </div>
  );
}
