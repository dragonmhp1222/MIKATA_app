// A/B 検証用 LP（/lp/b|c|d）の文言・メタ情報。AGENTS の禁止（成果保証等）に合わせて「たたき台」「例」を明示する。

export const LP_VARIANT_IDS = ["b", "c", "d"] as const;
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
  b: {
    id: "b",
    badgeLabel: "B案 — 報告・ヨミ会",
    badgeClassName: "bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-100",
    metaTitle: "MIKATA | ヨミ・進捗報告の夜に（検証LP B）",
    metaDescription:
      "目標未達・ヨミのズレの夜、報告のたたき台と明日の初手の例を整理。SaaS営業向け。",
    headlineLines: [
      "「頑張ります」の精神論を捨て、",
      "論理的な「挽回計画」のたたき台を30秒で用意する。",
    ],
    subcopy:
      "目標未達、ヨミのズレ。胃が痛い夜の状況を整理し、上司に説明しやすい報告文と明日の初手の例を生成します（※相手の反応や成果を保証するものではありません）。",
    ctaLabel: "1営業日1回、無料で試す（JST 4:00リセット）",
    sceneQuery: "forecast_meeting",
    ngExample: {
      title: "NG（現場でありがち）",
      body: "「行動量を増やして頑張ります」だけで、数字の根拠と期限がない。",
    },
    okExample: {
      title: "生成例（イメージ）",
      body: "ヨミとの乖離に対し、明日10時までに過去失注分の再架電リストを作成し、不足分を補填する案を提示する、という説明のたたき台。",
    },
    preview: {
      empathy: "正直、進捗報告が重なる時期はしんどいですよね。",
      cards: [
        {
          label: "今の詰まりどころ（例）",
          content:
            "目標達成率の見込みが厳しい。**ヨミと実績のズレを指摘されるリスク**が高い状態、という整理の例。",
        },
        {
          label: "明日の初手（例）",
          content:
            "**09:30に上司AへSlack。**失注分の補填として「Cランク層への再架電計画」を一文で共有する、という行動の例。",
        },
      ],
    },
    disclaimerMain:
      "本サービスは実務上の文章作成を支援するツールであり、成果・評価・人間関係の改善を保証するものではありません。AIの出力は叩き台として、最終的な判断・送信内容はご自身で行ってください。",
    disclaimerPreview:
      "※上記は生成例です。効果を保証するものではありません。入力は顧客名・金額など必ず伏せ字にしてください。外部AI（OpenAI）に送信されます。",
    seoKeywords: [
      "営業 報告 詰められる",
      "進捗報告 例文",
      "ヨミ会 対策",
      "SaaS 営業",
      "MIKATA",
    ],
    blogLink: {
      href: "/blog/yomikai-junbi-ai-taisaku",
      label: "ブログでヨミ会・報告の準備を読む",
    },
  },
  c: {
    id: "c",
    /** ヒーロー直上のバッジは出さない（見出しで訴求する） */
    badgeLabel: "",
    badgeClassName: "bg-lime-100 text-lime-900 dark:bg-lime-950/50 dark:text-lime-100",
    metaTitle: "MIKATA | Slack呼び出しの夜に（検証LP C）",
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
      href: "/blog/slack-chotto-ii-junbi",
      label: "ブログでSlack呼び出しの準備を読む",
    },
  },
  d: {
    id: "d",
    badgeLabel: "D案 — 同行・フィードバック",
    badgeClassName: "bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100",
    metaTitle: "MIKATA | 同行後のフィードバックに（検証LP D）",
    metaDescription:
      "「何がダメだった？」に答えるたたき台と、明日試せる具体アクションの例。SaaS営業向け。",
    headlineLines: [
      "同行後の「何がダメだった？」に、",
      "自分の言葉で答えるためのたたき台を。",
    ],
    subcopy:
      "上司の指摘を自分の言葉で整理し、抽象的なダメ出しを、明日の商談で試せる具体アクションに落とし込む手助けをします（※スキル向上や評価を保証するものではありません）。",
    ctaLabel: "フィードバックを次の一手に変える（無料）",
    sceneQuery: "ride_along_feedback",
    ngExample: {
      title: "NG（若手でありがち）",
      body: "「すみません、次は気をつけます」だけで、何をどう変えるかが伝わらない。",
    },
    okExample: {
      title: "生成例（イメージ）",
      body: "「課題の深掘りが手前で止まっていたと理解しています。明日の商談では、確認の順番を変えてヒアリングを一段深める、という宣言のたたき台。",
    },
    additionalNgOkPairs: [
      {
        ng: {
          title: "NG（進捗報告）",
          body: "理由が曖昧で「様子見」に見える。いつ動くかが書けていない。",
        },
        ok: {
          title: "改善の方向（例）",
          body: "事実で障害を切り分け、フォロー日時と担当を宣言する。",
        },
      },
    ],
    preview: {
      empathy: "指摘を受けた直後は言葉が出にくい時間です。まずは事実と解釈を分けて整理しましょう。",
      cards: [
        {
          label: "振り返りの一文（例）",
          content:
            "「先ほどはありがとうございました。**顧客の課題の仮説が浅いまま次に進んでいた**と理解しました。」のような、認識の言語化の例。",
        },
        {
          label: "明日の商談での修正（例）",
          content:
            "ヒアリングを切り上げる前に、**予算の出所が腹落ちするまで**確認する、という次の打ち手の例。",
        },
      ],
    },
    disclaimerMain:
      "本サービスは業務上の文章作成を支援するツールです。教育効果やスキル向上を保証するものではありません。出力は必ずご自身で確認し、機密は伏せ字で入力してください。",
    disclaimerPreview:
      "※生成例です。実在の顧客・会社名は伏せ字（例：A社、上司B）で入力してください。",
    seoKeywords: [
      "営業 フィードバック 返し方",
      "同行 上司 指摘",
      "若手営業",
      "SaaS 営業",
      "MIKATA",
    ],
    blogLink: {
      href: "/blog",
      label: "ブログで営業の準備術を読む",
    },
  },
};
