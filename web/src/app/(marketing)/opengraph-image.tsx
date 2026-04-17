import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// OGP / X カード用 1200×630。LP ヒーローと同じコピーで統一する。
export const alt =
  "MIKATA — 夜に整理して、翌朝そのまま使える返し方を作る。";
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
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 56,
          background: "linear-gradient(145deg, #0f172a 0%, #020617 55%, #0c4a6e 100%)",
          color: "#f8fafc",
          fontFamily: "NotoSansJP",
          gap: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "62%",
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
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.2,
              maxWidth: 700,
              letterSpacing: "-0.02em",
            }}
          >
            夜に整理して、
            <br />
            翌朝そのまま使える返し方を。
          </div>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.45,
              color: "#cbd5e1",
              maxWidth: 680,
            }}
          >
            シーン3択 → 状況入力 → カンペ生成
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          <span style={{ fontSize: 38, fontWeight: 700, color: "#22d3ee" }}>
            MIKATA
          </span>
          <span style={{ fontSize: 22, color: "#94a3b8" }}>SaaS営業向け</span>
        </div>
        </div>
        <div
          style={{
            width: "38%",
            borderRadius: 28,
            border: "1px solid rgba(148,163,184,0.35)",
            background: "rgba(15,23,42,0.65)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 22, color: "#e2e8f0", fontWeight: 700 }}>
              画面イメージ
            </div>
            <div style={{ fontSize: 18, color: "#94a3b8" }}>
              入力して、明日の一手と報告文を作成
            </div>
          </div>
          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(148,163,184,0.35)",
              background: "rgba(2,6,23,0.75)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14, color: "#94a3b8" }}>選択中</div>
            <div style={{ fontSize: 18, color: "#f8fafc" }}>
              ③ 「ちょっといい？」Slack呼び出し
            </div>
            <div style={{ fontSize: 14, color: "#94a3b8" }}>出力されるもの</div>
            <div style={{ fontSize: 16, color: "#f8fafc" }}>
              ・今の状況
              <br />
              ・明日やること
              <br />
              ・そのまま送れる報告文
            </div>
          </div>
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
