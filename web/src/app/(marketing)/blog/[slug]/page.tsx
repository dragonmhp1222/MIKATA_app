import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { compileMDX } from "next-mdx-remote/rsc";
import { getAllPostsMeta, getPostParsedBySlug } from "@/lib/blog";

type PageProps = { params: Promise<{ slug: string }> };

// 静的パスを事前生成する。
export function generateStaticParams() {
  return getAllPostsMeta().map((p) => ({ slug: p.slug }));
}

// frontmatter からメタタグを組み立てる。
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = getPostParsedBySlug(slug);
  if (!parsed) return {};
  const fm = parsed.fm;
  const title = fm.metaTitle ?? fm.title;
  const description = fm.metaDescription ?? fm.excerpt ?? "";
  return {
    title,
    description,
    alternates: fm.canonical ? { canonical: fm.canonical } : undefined,
    openGraph: {
      title: fm.ogTitle ?? title,
      description: fm.ogDescription ?? description,
      type: "article",
      publishedTime: fm.date,
    },
  };
}

// 単一記事ページ。読みやすい段組・余白・タイポグラフィで本文を包む。
export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const parsed = getPostParsedBySlug(slug);
  if (!parsed) notFound();

  const { content } = await compileMDX({
    source: parsed.body,
    options: { parseFrontmatter: false },
  });

  const fm = parsed.fm;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6 sm:px-6 lg:max-w-4xl">
      <nav
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500"
        aria-label="パンくず"
      >
        <Link href="/" className="hover:text-cyan-400">
          トップ
        </Link>
        <span aria-hidden>/</span>
        <Link href="/blog" className="hover:text-cyan-400">
          ブログ
        </Link>
        <span aria-hidden>/</span>
        <span className="truncate text-slate-600">{fm.title}</span>
      </nav>

      <header className="mt-8 rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950/40 px-6 py-8 shadow-lg shadow-slate-950/40 sm:px-8 sm:py-10">
        <p className="text-xs font-medium uppercase tracking-widest text-cyan-400/90">
          {fm.category ?? "記事"}
        </p>
        <h1 className="mt-3 text-balance text-2xl font-bold leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl lg:leading-tight">
          {fm.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
          <time dateTime={fm.date}>{fm.date}</time>
          {fm.category ? (
            <>
              <span className="text-slate-600" aria-hidden>
                ·
              </span>
              <span>{fm.category}</span>
            </>
          ) : null}
        </div>
        {fm.tags && fm.tags.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {fm.tags.map((t) => (
              <li key={t}>
                <span className="inline-block rounded-full border border-slate-700/80 bg-slate-950/50 px-3 py-1 text-xs text-slate-300">
                  {t}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="mt-10 rounded-2xl border border-slate-800/70 bg-slate-900/25 px-5 py-9 sm:px-8 sm:py-11 md:px-10 md:py-12">
        <article
          className="prose prose-lg prose-invert prose-slate mx-auto max-w-prose
          prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:mb-4 prose-h2:mt-12 prose-h2:border-b prose-h2:border-slate-800 prose-h2:pb-3 prose-h2:text-xl prose-h2:font-semibold prose-h2:text-slate-100
          prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-lg prose-h3:text-slate-200
          prose-p:mb-5 prose-p:leading-[1.85] prose-p:text-slate-300
          prose-li:my-2 prose-li:leading-relaxed prose-li:text-slate-300
          prose-strong:text-slate-100 prose-strong:font-semibold
          prose-a:font-medium prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
          prose-hr:my-12 prose-hr:border-slate-800
          prose-ol:my-6 prose-ul:my-6
          prose-blockquote:border-l-cyan-500/60 prose-blockquote:text-slate-400
          prose-pre:rounded-xl prose-pre:border prose-pre:border-slate-800 prose-pre:bg-slate-950 prose-pre:shadow-inner
          prose-code:rounded prose-code:bg-slate-800/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-cyan-200/90 prose-code:before:content-none prose-code:after:content-none"
        >
          {content}
        </article>
      </div>

      <aside className="mt-12 rounded-2xl border border-cyan-900/40 bg-cyan-950/20 px-6 py-8 text-center sm:px-8">
        <p className="text-sm text-slate-300">
          状況を入力するだけで、返し方・報告文のたたきを短時間で出せます。
        </p>
        <Link
          href="/app"
          className="mt-4 inline-flex rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          MIKATA で無料で準備する
        </Link>
      </aside>
    </main>
  );
}
