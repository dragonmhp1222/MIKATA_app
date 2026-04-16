// 検証LP用 WebPage 構造化データ（重複コンテンツは canonical で抑制しつつページ単位の意味づけ用）。
type Props = {
  name: string;
  description: string;
  path: string;
};

export function LpWebPageJsonLd({ name, description, path }: Props) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const payload = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url,
    inLanguage: "ja-JP",
    isPartOf: {
      "@type": "WebSite",
      name: "MIKATA",
      url: base,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
