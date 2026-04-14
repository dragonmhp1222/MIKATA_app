import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

// リポジトリ直下の content/blog から MDX を読む（ビルド時・サーバーでのみ使用）。
const BLOG_DIR = path.join(process.cwd(), "content/blog");

// 記事 frontmatter の契約（不足時はページ側でフォールバックする）。
export type BlogFrontmatter = {
  title: string;
  slug: string;
  date: string;
  category?: string;
  tags?: string[];
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
};

// slug ごとに gray-matter を1回だけかけた結果（同一リクエスト・ビルド内は React cache で共有）。
type ParsedPost = { fm: BlogFrontmatter; body: string };

// 全記事をディスクから読み、slug キーの Map に載せる（一覧・個別でファイル走査を重ねない）。
const getPostsBySlug = cache((): Map<string, ParsedPost> => {
  const map = new Map<string, ParsedPost>();
  if (!fs.existsSync(BLOG_DIR)) return map;
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const fm = data as BlogFrontmatter;
    if (typeof fm.slug === "string" && fm.slug) {
      map.set(fm.slug, { fm, body: content });
    }
  }
  return map;
});

// 一覧用に全記事のメタだけを返す（新しい日付が先）。
export const getAllPostsMeta = cache((): BlogFrontmatter[] => {
  return Array.from(getPostsBySlug().values())
    .map((p) => p.fm)
    .filter((d) => typeof d.title === "string")
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
});

// slug に一致する記事の frontmatter と本文（frontmatter 除去済み）を返す。
export const getPostParsedBySlug = cache(
  (slug: string): ParsedPost | null => getPostsBySlug().get(slug) ?? null
);
