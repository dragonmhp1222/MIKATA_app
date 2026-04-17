import Link from "next/link";
import { PostHogCtaLink } from "@/components/analytics/PostHogCtaLink";
import { PostHogPageView } from "@/components/analytics/PostHogPageView";
import { AnalyticsEvents } from "@/lib/analytics-events";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 text-slate-900 dark:text-slate-100 md:px-10">
      <PostHogPageView
        eventName={AnalyticsEvents.lpView}
        pageName="lp_main"
        properties={{ lp_variant: "main", lp_path: "/" }}
      />
      <section className="rounded-3xl border border-slate-200 bg-slate-100/90 p-8 dark:border-slate-800 dark:bg-slate-900/60 md:p-12">
        <p className="mb-4 inline-block rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
          MIKATA for SaaS Sales
        </p>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
          明日、上司に「で、根拠は？」と詰められるのが怖い夜に。
        </h1>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 md:text-base">
          SaaS営業の「怖い明日」を、今夜整理する。
        </p>
        <p className="mt-6 max-w-2xl text-slate-800 dark:text-slate-200">
          MIKATAは、そのまま送れる報告文と明日やるべき行動を、今この場で作ります。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <PostHogCtaLink
            href="/app?lp_variant=main"
            eventName={AnalyticsEvents.lpToAppClick}
            properties={{ lp_variant: "main", cta_position: "hero" }}
            className="rounded-full bg-cyan-400 px-6 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-300"
          >
            1営業日1回、無料で試す（JST 4:00リセット）
          </PostHogCtaLink>
          <a
            className="rounded-full border border-slate-300 px-6 py-3 text-center text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            href="#scenes"
          >
            3つのシーンを見る
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/blog"
            className="text-cyan-600 hover:underline dark:text-cyan-400/90"
          >
            ブログでヨミ会の準備術を読む
          </Link>
        </p>
        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          入力内容はAI生成のためOpenAI, LLC（米国）に送信されます。顧客名・企業名・金額などは
          <strong className="text-slate-900 dark:text-slate-200">必ず伏せ字</strong>
          で入力してください（例：A社、顧客X、〇万円）。
        </p>
      </section>
      <section id="scenes" className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="font-semibold">① ヨミ会・進捗報告の前夜</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            「で、根拠は？」に詰まらないための返しと根拠を用意する。
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="font-semibold">② 同行・商談後のフィードバック</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            「何がダメだった？」に答えられるよう、自分なりの解釈を整理する。
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="font-semibold">③ 「ちょっといい？」Slack呼び出し</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            最初の一言で詰まらないための準備をする。
          </p>
        </article>
      </section>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h3 className="text-lg font-semibold">MIKATAの使い方ガイド（30秒）</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-xs text-slate-500">STEP 1</p>
            <p className="mt-1 text-sm font-medium">シーンを1つ選ぶ</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              ヨミ会/同行/Slackの3択。迷ったらSlackを推奨。
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-xs text-slate-500">STEP 2</p>
            <p className="mt-1 text-sm font-medium">タグを2つ押して補足</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              0→1入力より、タグ起点の方が早くて精度が安定。
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-xs text-slate-500">STEP 3</p>
            <p className="mt-1 text-sm font-medium">生成してそのまま送る</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              翌朝の最初の一言と報告文をその場で準備。
            </p>
          </article>
        </div>
      </section>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h3 className="text-lg font-semibold">
          よくあるNG報告と、MIKATAが生成する改善例
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          断定はしません。実務の「言い方」だけを比べる例です。
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              進捗報告
            </p>
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-300/90">NG</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              「頑張ります」「なんとかします」だけで数字と次の一手がない。
            </p>
            <p className="mt-3 text-xs text-cyan-700 dark:text-cyan-300/90">改善の方向</p>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              現状数値・障害・期限・次アクションが一文で分かる報告にする。
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              停滞・未達
            </p>
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-300/90">NG</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              理由が曖昧で「様子見」に見える。いつ動くかが書けていない。
            </p>
            <p className="mt-3 text-xs text-cyan-700 dark:text-cyan-300/90">改善の方向</p>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              事実で障害を切り分け、フォロー日時と担当を宣言する。
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Slack呼び出し
            </p>
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-300/90">NG</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              呼ばれた瞬間に「はい？」だけ。用件と自分の次の一手が伝わらない。
            </p>
            <p className="mt-3 text-xs text-cyan-700 dark:text-cyan-300/90">改善の方向</p>
            <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
              用件確認＋いま取れる一手を一言で返す。
            </p>
          </article>
        </div>
      </section>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h3 className="text-lg font-semibold">
          過去の詰められパターンから、先手を打つ
        </h3>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Slackの通知音に怯えなくなる、その日まで。
        </p>
        <PostHogCtaLink
          href="/app?lp_variant=main"
          eventName={AnalyticsEvents.lpToAppClick}
          properties={{ lp_variant: "main", cta_position: "bottom" }}
          className="mt-6 inline-flex w-full max-w-sm items-center justify-center rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 sm:w-auto"
        >
          MIKATAを無料で試す
        </PostHogCtaLink>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
          本サービスは医療・心理支援サービスではありません。
        </p>
      </section>
      <p className="mt-12 border-t border-slate-200 pt-8 text-center text-xs text-slate-500 dark:border-slate-800">
        検証用LP（Slack訴求）:{" "}
        <Link
          href="/lp/c"
          className="text-cyan-600 underline hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
        >
          /lp/c
        </Link>
        <span className="ml-2 text-[11px] text-slate-400 dark:text-slate-500">
          ※ヨミ会・同行フィードバックの詳細は
          <Link
            href="/blog"
            className="text-cyan-600 underline hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
          >
            ブログ
          </Link>
          へ
        </span>
      </p>
    </main>
  );
}
