import type { MetadataRoute } from "next";

function getSiteBase(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://bemikata.com";
}

export default function robots(): MetadataRoute.Robots {
  const base = getSiteBase();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
