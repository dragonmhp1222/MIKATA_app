import Link from "next/link";
import { getAllPostsMeta } from "@/lib/blog";

// 記事一覧。カードの階層と余白でスキャンしやすくする。
export default function BlogIndexPage() {
  const posts = getAllPostsMeta();
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:max-w-4xl">
      <header className="border-b border-slate-800 pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
          Blog
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          ブログ
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-400">
          SaaS営業の夜のストレスと、翌朝のアクションに関する記事です。ヨミ会・上司との対話・Slack
          など、現場に寄り添った内容を載せていきます。
        </p>
      </header>

      <ul className="mt-12 space-y-5">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-slate-800 bg-slate-900/35 p-6 transition hover:border-cyan-900/50 hover:bg-slate-900/55 sm:p-7"
            >
              <p className="text-xs text-slate-500">
                <time dateTime={post.date}>{post.date}</time>
                {post.category ? (
                  <>
                    <span className="mx-2 text-slate-600">·</span>
                    <span className="text-slate-400">{post.category}</span>
                  </>
                ) : null}
              </p>
              <h2 className="mt-2 text-lg font-semibold leading-snug text-slate-100 group-hover:text-cyan-300 sm:text-xl">
                {post.title}
              </h2>
              {post.excerpt ? (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400 sm:line-clamp-3">
                  {post.excerpt}
                </p>
              ) : null}
              <p className="mt-4 text-sm font-medium text-cyan-400/90 group-hover:text-cyan-300">
                続きを読む →
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {posts.length === 0 ? (
        <p className="mt-12 text-center text-sm text-slate-500">
          まだ記事がありません。
        </p>
      ) : null}
    </main>
  );
}
