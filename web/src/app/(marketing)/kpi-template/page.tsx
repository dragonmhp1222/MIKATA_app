import Link from "next/link";

export const metadata = {
  title: "MIKATA | 初月KPIテンプレ",
  description: "PostHogでABテストと初月KPIを確認するためのテンプレート。",
  robots: { index: false, follow: false },
};

export default function KpiTemplatePage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-12 md:px-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        初月KPIダッシュボード テンプレ
      </h1>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        PostHog未作成でも、先にイベント実装は完了しています。アカウント作成後にこの順でダッシュボードを作れば、ABテストの判断に必要な指標をすぐ確認できます。
      </p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold">1. 先に環境変数を設定</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>
            <code>NEXT_PUBLIC_POSTHOG_KEY</code>
          </li>
          <li>
            <code>NEXT_PUBLIC_POSTHOG_HOST</code>
            （通常は <code>https://us.i.posthog.com</code>）
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold">2. 実装済みイベント名</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[
            "lp_view",
            "lp_to_app_click",
            "app_view",
            "generate_click",
            "generate_success",
            "generate_failure",
            "next_day_return",
          ].map((name) => (
            <code
              key={name}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950/50"
            >
              {name}
            </code>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold">3. 最低限見る3指標</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>LP→App遷移率 = lp_to_app_click / lp_view</li>
          <li>生成率 = generate_success / app_view</li>
          <li>翌日再訪率 = next_day_return / generate_success</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          比較軸は <code>lp_variant</code>（main / c）です。
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <h2 className="text-lg font-semibold">4. URL運用（X向け）</h2>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          メインLP: <code>/</code>
          <br />
          ABテストLP（Slack特化）: <code>/lp/c</code>
        </p>
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          X投稿に貼るURLは <code>/lp/c</code> を推奨。CTA押下時に
          <code>lp_variant=c</code> が引き継がれます。
        </p>
      </section>

      <p className="mt-8 text-sm text-slate-600 dark:text-slate-300">
        <Link href="/" className="text-cyan-600 underline dark:text-cyan-400">
          トップへ戻る
        </Link>
      </p>
    </main>
  );
}
