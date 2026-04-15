import Link from "next/link";
import { LegalFooter } from "@/components/LegalFooter";
import { ThemeToggle } from "@/components/ThemeToggle";

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
