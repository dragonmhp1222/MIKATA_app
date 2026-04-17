// A/B 検証用 LP（/lp/c）。訴求別の長文はブログへ寄せ、メンテは main + 本ページに集約する。

export const LP_VARIANT_IDS = ["c"] as const;
export type LpVariantId = (typeof LP_VARIANT_IDS)[number];

export function isLpVariantId(s: string): s is LpVariantId {
  return (LP_VARIANT_IDS as readonly string[]).includes(s);
}

export type LpPreviewCard = {
  label: string;
  /** 本文（**強調** でシアン強調） */
  content: string;
};

export type LpVariantContent = {
  id: LpVariantId;
  badgeLabel: string;
  badgeClassName: string;
  metaTitle: string;
  metaDescription: string;
  /** ヒーロー見出し（改行は配列の要素で区切る） */
  headlineLines: string[];
  subcopy: string;
  ctaLabel: string;
  /** アプリ初期シーン（URL ?scene= と一致） */
  sceneQuery: "forecast_meeting" | "ride_along_feedback" | "slack_callout";
  ngExample?: { title: string; body: string };
  okExample?: { title: string; body: string };
  /** Claude 原案のように NG/改善を複数並べる場合 */
  additionalNgOkPairs?: Array<{
    ng: { title: string; body: string };
    ok: { title: string; body: string };
  }>;
  sceneHighlights?: Array<{ title: string; body: string }>;
  preview: {
    empathy: string;
    cards: LpPreviewCard[];
  };
  /** メイン免責（CTA 近く） */
  disclaimerMain: string;
  /** プレビュー直下のミニ免責 */
  disclaimerPreview: string;
  /** 検索・SNS向け（meta keywords。本文にも自然に使うならサブコピー側で調整） */
  seoKeywords: string[];
  /** Claude 原案同様のサブ導線 */
  blogLink: { href: string; label: string };
};

export const LP_VARIANTS: Record<LpVariantId, LpVariantContent> = {
  c: {
    id: "c",
    /** ヒーロー直上のバッジは出さない（見出しで訴求する） */
    badgeLabel: "",
    badgeClassName: "bg-lime-100 text-lime-900 dark:bg-lime-950/50 dark:text-lime-100",
    metaTitle: "MIKATA | Slack呼び出しの夜に",
    metaDescription:
      "「ちょっといい？」の前に一次回答のたたき台を。冷静な返しの例を準備。SaaS営業向け。",
    headlineLines: [
      "「ちょっといい？」の通知で",
      "言葉が止まる前に、今夜「一次回答」のたたき台を。",
    ],
    subcopy:
      "理由のわからない呼び出し、KPIの詰め。慌てて返す前に、状況を整理して「冷静な一次回答」と「予備返答」の例を用意します（※心理療法・医学的アドバイスではありません）。",
    ctaLabel: "一次回答のたたき台を準備する（無料）",
    sceneQuery: "slack_callout",
    sceneHighlights: [
      {
        title: "① ヨミ会・進捗報告の前夜",
        body: "「で、根拠は？」に詰まらないための返しと根拠を用意する（方針の整理）。",
      },
      {
        title: "② 同行・商談後のフィードバック",
        body: "「何がダメだった？」に答えられるよう、自分なりの解釈を整理する。",
      },
      {
        title: "③ 「ちょっといい？」Slack呼び出し",
        body: "最初の一言で詰まらないための準備をする。",
      },
    ],
    preview: {
      empathy: "意図が読みにくい呼び出しは、誰でも身構えてしまうものです。",
      cards: [
        {
          label: "冷静な一次回答（例）",
          content:
            "「承知しました。いま手元の資料を直しているので、**15分後にそちらに伺ってもよいでしょうか。**」のような、時間を確保する一言のたたき台。",
        },
        {
          label: "予備返答（例）",
          content:
            "追加で聞かれた場合に、**前提（いつ・誰・何が）を一文で揃えてから**答える、という返し方の例。",
        },
      ],
    },
    disclaimerMain:
      "本サービスは生成AIによる下書き作成の支援であり、医療・心理支援サービスではありません。送信内容は自己責任で調整し、機密は必ず伏せ字で入力してください。",
    disclaimerPreview:
      "※生成例であり効果を保証しません。OpenAIのAPIを利用しています。",
    seoKeywords: [
      "Slack 上司 怖い",
      "ちょっといい 上司",
      "営業 呼び出し 準備",
      "SaaS 営業",
      "MIKATA",
    ],
    blogLink: {
      href: "/blog/slack-callout-first-response",
      label: "ブログでSlack呼び出しの準備を読む",
    },
  },
};
