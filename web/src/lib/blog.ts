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

// 一覧用に全記事のメタだけを返す（新しい日付が先）。
export const getAllPostsMeta = cache((): BlogFrontmatter[] => {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
      const { data } = matter(raw);
      return data as BlogFrontmatter;
    })
    .filter((d) => typeof d.slug === "string" && typeof d.title === "string")
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
});

// slug に一致する記事のソース全文（frontmatter 付き）を返す。
export const getPostRawBySlug = cache((slug: string): string | null => {
  if (!fs.existsSync(BLOG_DIR)) return null;
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data } = matter(raw);
    if ((data as BlogFrontmatter).slug === slug) return raw;
  }
  return null;
});
