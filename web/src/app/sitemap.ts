import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/blog";

/** OGP・canonical と同じベースURL（未設定時は本番ドメイン）。 */
function getSiteBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://bemikata.com";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteBase();
  const posts = getAllPostsMeta();
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/app`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${base}/lp/c`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // /legal/* は robots noindex のためサイトマップから除外
  ];

  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => {
    let lastModified = new Date();
    if (p.date) {
      const t = new Date(p.date).getTime();
      if (!Number.isNaN(t)) lastModified = new Date(t);
    }
    return {
      url: `${base}/blog/${p.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    };
  });

  return [...staticEntries, ...blogEntries];
}
