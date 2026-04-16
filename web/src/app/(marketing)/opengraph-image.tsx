import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// OGP / X カード用 1200×630。LP ヒーローと同じコピーで統一する。
export const alt =
  "MIKATA — 明日、上司に「で、根拠は？」と詰められるのが怖い夜に。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // @fontsource の日本語ウェイト（ビルド時もネット不要・リポジトリに巨大フォントを置かない）。
  const fontData = await readFile(
    join(
      process.cwd(),
      "node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff"
    )
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: "linear-gradient(145deg, #0f172a 0%, #020617 55%, #0c4a6e 100%)",
          color: "#f8fafc",
          fontFamily: "NotoSansJP",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 16px",
              borderRadius: 9999,
              border: "1px solid rgba(148,163,184,0.45)",
              fontSize: 22,
              color: "#cbd5e1",
            }}
          >
            MIKATA for SaaS Sales
          </span>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.25,
              maxWidth: 1040,
              letterSpacing: "-0.02em",
            }}
          >
            明日、上司に「で、根拠は？」と詰められるのが怖い夜に。
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.45,
              color: "#cbd5e1",
              maxWidth: 920,
            }}
          >
            SaaS営業の「怖い明日」を、今夜整理する。
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 700, color: "#22d3ee" }}>
            MIKATA
          </span>
          <span style={{ fontSize: 22, color: "#94a3b8" }}>
            報告文と明日の一手を、今夜つくる
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "NotoSansJP",
          data: fontData.buffer.slice(
            fontData.byteOffset,
            fontData.byteOffset + fontData.byteLength
          ),
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
