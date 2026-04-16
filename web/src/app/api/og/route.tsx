import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 58, fontWeight: 700 }}>
              明日、上司に詰められるのが
            </p>
            <p style={{ margin: 0, fontSize: 58, fontWeight: 700, color: "#22d3ee" }}>
              怖い夜に。
            </p>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 30, color: "#cbd5e1" }}>
          夜に入力 → 朝にそのまま使える返し方を生成
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
