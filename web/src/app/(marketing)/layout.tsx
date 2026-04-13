import Link from "next/link";

// LP・ブログ共通のマーケ用シェル（アプリ /app とは UI を分ける）。
export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="font-semibold text-cyan-400 hover:text-cyan-300">
            MIKATA
          </Link>
          <nav className="flex gap-6 text-sm text-slate-300">
            <Link href="/blog" className="hover:text-white">
              ブログ
            </Link>
            <Link href="/app" className="hover:text-white">
              アプリ
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
