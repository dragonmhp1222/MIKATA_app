import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostHogCtaLink } from "@/components/analytics/PostHogCtaLink";
import { PostHogPageView } from "@/components/analytics/PostHogPageView";
import { LpResultPreview } from "@/components/lp/LpResultPreview";
import { LpWebPageJsonLd } from "@/components/lp/LpWebPageJsonLd";
import { AnalyticsEvents } from "@/lib/analytics-events";
import {
  isLpVariantId,
  LP_VARIANT_IDS,
  LP_VARIANTS,
  type LpVariantId,
} from "@/lib/lp-variants";

type PageProps = { params: Promise<{ variant: string }> };

const siteOrigin =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

const SHARED_OG_IMAGE = {
  url: "/api/og",
  width: 1200,
  height: 630,
  alt: 'MIKATA — 明日、上司に「で、根拠は？」と詰められるのが怖い夜に。',
} as const;

export function generateStaticParams() {
  return LP_VARIANT_IDS.map((variant) => ({ variant }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { variant } = await params;
  if (!isLpVariantId(variant)) return {};
  const v = LP_VARIANTS[variant];
  const canonicalPath = `/lp/${variant}`;
  const canonicalUrl = `${siteOrigin}${canonicalPath}`;
  return {
    title: v.metaTitle,
    description: v.metaDescription,
    keywords: v.seoKeywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: v.metaTitle,
      description: v.metaDescription,
      url: canonicalUrl,
      locale: "ja_JP",
      siteName: "MIKATA",
      type: "website",
      images: [SHARED_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: v.metaTitle,
      description: v.metaDescription,
      images: [SHARED_OG_IMAGE.url],
    },
    robots: {
      index: variant === "c",
      follow: true,
    },
  };
}

export default async function LpVariantPage({ params }: PageProps) {
  const { variant } = await params;
  if (!isLpVariantId(variant)) {
    notFound();
  }
  const v = LP_VARIANTS[variant];
  const appHref = `/app?scene=${encodeURIComponent(v.sceneQuery)}&lp_variant=${variant}`;
  const isPrimaryTestVariant = variant === "c";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12 text-slate-900 dark:text-slate-100 md:px-10 md:py-16">
      <PostHogPageView
        eventName={AnalyticsEvents.lpView}
        pageName={`lp_${variant}`}
        properties={{ lp_variant: variant, lp_path: `/lp/${variant}` }}
      />
      <LpWebPageJsonLd
        name={v.metaTitle}
        description={v.metaDescription}
        path={`/lp/${variant}`}
      />
      {v.badgeLabel.trim() || !isPrimaryTestVariant ? (
        <p className="mb-3 flex flex-wrap items-center gap-2">
          {v.badgeLabel.trim() ? (
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${v.badgeClassName}`}
            >
              {v.badgeLabel}
            </span>
          ) : null}
          {!isPrimaryTestVariant ? (
            <span className="inline-block rounded-full border border-slate-300 px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-300">
              noindex（ブログ転用待ち）
            </span>
          ) : null}
        </p>
      ) : null}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        MIKATA for SaaS Sales
      </p>
      <h1 className="mt-4 text-2xl font-bold leading-snug tracking-tight md:text-4xl md:leading-tight">
        {v.headlineLines.map((line, i) => (
          <span key={i}>
            {line}
            {i < v.headlineLines.length - 1 ? <br /> : null}
          </span>
        ))}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 md:text-base">
        {v.subcopy}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <PostHogCtaLink
          href={appHref}
          eventName={AnalyticsEvents.lpToAppClick}
          properties={{ lp_variant: variant, cta_position: "hero" }}
          className="inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 sm:w-auto sm:min-w-[240px]"
        >
          {v.ctaLabel}
        </PostHogCtaLink>
        <Link
          href="/#scenes"
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-6 py-3 text-center text-sm font-medium text-slate-800 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 sm:w-auto"
        >
          3つのシーンを見る
        </Link>
      </div>
      <p className="mt-3 text-sm">
        <Link
          href={v.blogLink.href}
          className="text-cyan-600 underline hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
        >
          {v.blogLink.label}
        </Link>
      </p>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        入力内容はAI生成のためOpenAI, LLC（米国）に送信されます。顧客名・企業名・金額などは
        <strong className="text-slate-800 dark:text-slate-200">必ず伏せ字</strong>
        で入力してください。
      </p>

      <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {v.disclaimerMain}
      </p>

      <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
        本サービスは医療・心理支援サービスではありません。
      </p>

      <div className="my-8 h-px bg-slate-200 dark:bg-slate-800" />

      {v.ngExample ? (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
          <p className="text-xs font-medium text-rose-800 dark:text-rose-200">
            {v.ngExample.title}
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {v.ngExample.body}
          </p>
        </div>
      ) : null}

      {v.okExample ? (
        <div className="mt-4 rounded-xl border border-cyan-200/80 bg-cyan-50/50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
          <p className="text-xs font-medium text-cyan-900 dark:text-cyan-200">
            {v.okExample.title}
          </p>
          <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">
            {v.okExample.body}
          </p>
        </div>
      ) : null}

      {v.additionalNgOkPairs?.map((pair, idx) => (
        <div key={idx} className="mt-4 space-y-4">
          <div className="rounded-xl border border-rose-200/80 bg-rose-50/80 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
            <p className="text-xs font-medium text-rose-800 dark:text-rose-200">
              {pair.ng.title}
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              {pair.ng.body}
            </p>
          </div>
          <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/50 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20">
            <p className="text-xs font-medium text-cyan-900 dark:text-cyan-200">
              {pair.ok.title}
            </p>
            <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">
              {pair.ok.body}
            </p>
          </div>
        </div>
      ))}

      {v.sceneHighlights ? (
        <div className="mt-6 space-y-4">
          {v.sceneHighlights.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/40"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {s.title}
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <LpResultPreview
        empathy={v.preview.empathy}
        cards={v.preview.cards}
        disclaimerPreview={v.disclaimerPreview}
      />

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          今夜の不安を、明日の具体的な一手に変える。
        </p>
        <PostHogCtaLink
          href={appHref}
          eventName={AnalyticsEvents.lpToAppClick}
          properties={{ lp_variant: variant, cta_position: "bottom" }}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 sm:w-auto"
        >
          MIKATAを無料で試す
        </PostHogCtaLink>
      </div>

      <p className="mt-10 text-center text-xs text-slate-500 dark:text-slate-500">
        <Link
          href="/"
          className="text-cyan-600 underline hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
        >
          トップ（通常LP）へ
        </Link>
        {" · "}
        <VariantNav current={v.id} />
      </p>
    </main>
  );
}

function VariantNav({ current }: { current: LpVariantId }) {
  const others = LP_VARIANT_IDS.filter((id) => id !== current && id === "c");
  if (others.length === 0) return null;
  return (
    <span>
      ABテストLP:{" "}
      {others.map((id, i) => (
        <span key={id}>
          {i > 0 ? " · " : null}
          <Link
            href={`/lp/${id}`}
            className="text-cyan-600 underline hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            {id.toUpperCase()}
          </Link>
        </span>
      ))}
    </span>
  );
}
