import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import { getLegalParsedBySlug, getLegalSlugs } from "@/lib/legal";
import { mdxRemoteCompileOptions } from "@/lib/mdx-remote-options";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getLegalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = getLegalParsedBySlug(slug);
  if (!parsed) return {};
  return {
    title: `${parsed.fm.title} | MIKATA`,
    description: `${parsed.fm.title}（${parsed.fm.effectiveDate ?? ""}）`,
    robots: { index: false, follow: false },
  };
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = getLegalParsedBySlug(slug);
  if (!parsed) notFound();

  const { content } = await compileMDX({
    source: parsed.body,
    options: mdxRemoteCompileOptions,
  });

  const fm = parsed.fm;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-6 text-slate-900 dark:text-slate-100 sm:px-6">
      <nav
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-500"
        aria-label="パンくず"
      >
        <Link
          href="/"
          className="hover:text-cyan-600 dark:hover:text-cyan-400"
        >
          トップ
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-slate-600 dark:text-slate-600">
          {fm.title}
        </span>
      </nav>

      <header className="mt-8 border-b border-slate-200 pb-8 dark:border-slate-800/90">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          {fm.title}
        </h1>
        {fm.effectiveDate ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-500">
            施行・改定の基準日: {fm.effectiveDate}
          </p>
        ) : null}
      </header>

      <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-10 shadow-inner shadow-slate-200/50 dark:border-slate-800/80 dark:from-slate-900/50 dark:to-slate-950/40 dark:shadow-slate-950/30 sm:px-8 sm:py-12 md:px-12 md:py-14">
        <article
          className="prose prose-sm prose-slate mx-auto min-w-0 max-w-none sm:prose-base dark:prose-invert [&_table]:min-w-0 [&_table]:rounded-lg [&_table]:ring-1 [&_table]:ring-slate-200 dark:[&_table]:ring-slate-700/50 [&_tbody_tr:nth-child(even)]:bg-slate-50 dark:[&_tbody_tr:nth-child(even)]:bg-slate-900/25 [&_td:first-child]:w-[min(32\%,11rem)] [&_td:first-child]:text-slate-800 dark:[&_td:first-child]:text-slate-200/95 [&_td:first-child]:text-xs sm:[&_td:first-child]:w-[min(30\%,13rem)] sm:[&_td:first-child]:text-sm [&_th:first-child]:w-[min(32\%,11rem)] sm:[&_th:first-child]:w-[min(30\%,13rem)] prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight prose-h2:mb-4 prose-h2:mt-12 prose-h2:first:mt-0 prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-2 prose-h2:text-lg prose-h2:font-semibold prose-h2:text-slate-900 dark:prose-h2:border-slate-700/80 dark:prose-h2:text-slate-50 sm:prose-h2:text-xl prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-base prose-h3:text-slate-800 sm:prose-h3:text-lg dark:prose-h3:text-slate-200 prose-p:mb-4 prose-p:leading-relaxed prose-p:text-slate-700 dark:prose-p:text-slate-300/95 prose-li:my-1 prose-li:leading-relaxed prose-li:text-slate-700 dark:prose-li:text-slate-300/95 prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-semibold prose-a:font-medium prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-hr:my-10 prose-hr:border-slate-200 dark:prose-hr:border-slate-800 prose-ol:my-5 prose-ul:my-5 prose-table:my-8 prose-table:w-full prose-table:border-collapse prose-table:text-left prose-table:text-[0.8125rem] sm:prose-table:text-sm prose-thead:border-b prose-thead:border-slate-300 dark:prose-thead:border-slate-600/80 prose-th:border prose-th:border-slate-200 prose-th:bg-slate-100 prose-th:px-3 prose-th:py-2.5 prose-th:text-left prose-th:align-top prose-th:text-xs prose-th:font-semibold prose-th:text-slate-900 dark:prose-th:border-slate-600/50 dark:prose-th:bg-slate-800/90 dark:prose-th:text-slate-100 sm:prose-th:px-4 sm:prose-th:text-sm prose-td:border prose-td:border-slate-200 prose-td:px-3 prose-td:py-2.5 prose-td:align-top prose-td:break-words prose-td:text-slate-800 dark:prose-td:border-slate-700/60 dark:prose-td:text-slate-300/95 sm:prose-td:px-4 prose-tr:even:bg-slate-50 dark:prose-tr:even:bg-slate-900/35"
        >
          {content}
        </article>
      </div>
    </main>
  );
}
