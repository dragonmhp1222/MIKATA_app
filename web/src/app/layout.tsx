import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // サービス名を明示して検索結果で認識されやすくする。
  title: "MIKATA | 詰められる前に、返し方を作る",
  // SEO向けに、誰向けの何のサービスかを1文で伝える。
  description:
    "SaaS営業向けに、夜の状況入力から翌朝使える返し方を生成するWebアプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      // 言語を日本語にして検索エンジンとブラウザに適切な情報を渡す。
      lang="ja"
      // フォント変数と全高レイアウトを適用する。
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
