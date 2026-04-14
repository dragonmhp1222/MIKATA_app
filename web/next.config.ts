import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // レスポンスから X-Powered-By を外す（軽い情報露出の抑制）。
  poweredByHeader: false,
};

export default nextConfig;
