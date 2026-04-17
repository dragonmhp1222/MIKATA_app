import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // レスポンスから X-Powered-By を外す（軽い情報露出の抑制）。
  poweredByHeader: false,
  // 旧 LP（B/D）はブログへ統合。301 でブックマーク・旧リンクを維持。
  async redirects() {
    return [
      {
        source: "/lp/b",
        destination: "/blog/yomikai-junbi-ai-taisaku",
        permanent: true,
      },
      {
        source: "/lp/d",
        destination: "/blog/boss-scary-sales-response",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
