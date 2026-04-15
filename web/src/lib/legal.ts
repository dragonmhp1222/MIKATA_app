import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

const LEGAL_DIR = path.join(process.cwd(), "content/legal");

export type LegalFrontmatter = {
  title: string;
  slug: string;
  effectiveDate?: string;
};

type ParsedLegal = { fm: LegalFrontmatter; body: string };

const getLegalBySlug = cache((): Map<string, ParsedLegal> => {
  const map = new Map<string, ParsedLegal>();
  if (!fs.existsSync(LEGAL_DIR)) return map;
  const files = fs
    .readdirSync(LEGAL_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(LEGAL_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const fm = data as LegalFrontmatter;
    if (typeof fm.slug === "string" && fm.slug) {
      map.set(fm.slug, { fm, body: content });
    }
  }
  return map;
});

export const getLegalSlugs = cache((): string[] =>
  Array.from(getLegalBySlug().keys())
);

export const getLegalParsedBySlug = cache(
  (slug: string): ParsedLegal | null => getLegalBySlug().get(slug) ?? null
);
