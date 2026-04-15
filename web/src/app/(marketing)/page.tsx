import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 md:px-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 md:p-12">
        <p className="mb-4 inline-block rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          MIKATA for SaaS Sales
        </p>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
          明日、上司に「で、根拠は？」と詰められるのが怖い夜へ。
        </h1>
        <p className="mt-4 text-sm text-slate-300 md:text-base">
          SaaS営業の「怖い明日」を、今夜整理する。
        </p>
        <p className="mt-6 max-w-2xl text-slate-200">
          MIKATAは、そのまま送れる報告文と明日やるべき行動を、今この場で作ります。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            className="rounded-full bg-cyan-400 px-6 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-300"
            href="/app"
          >
            1営業日1回、無料で試す（JST 4:00リセット）
          </a>
          <a
            className="rounded-full border border-slate-700 px-6 py-3 text-center text-slate-200 hover:bg-slate-800"
            href="#scenes"
          >
            3つのシーンを見る
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          <Link href="/blog" className="text-cyan-400/90 hover:underline">
            ブログでヨミ会の準備術を読む
          </Link>
        </p>
        <p className="mt-6 text-xs text-slate-400">
          入力内容はAI生成のためOpenAI, LLC（米国）に送信されます。顧客名・企業名・金額などは<strong className="text-slate-200">必ず伏せ字</strong>
          で入力してください（例：A社、顧客X、〇万円）。
        </p>
      </section>
      <section id="scenes" className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="font-semibold">① ヨミ会・進捗報告の前夜</h2>
          <p className="mt-2 text-sm text-slate-300">
            「で、根拠は？」に詰まらないための返しと根拠を用意する。
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="font-semibold">② 同行・商談後のフィードバック</h2>
          <p className="mt-2 text-sm text-slate-300">
            「何がダメだった？」に答えられるよう、自分なりの解釈を整理する。
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="font-semibold">③ 「ちょっといい？」Slack呼び出し</h2>
          <p className="mt-2 text-sm text-slate-300">
            最初の一言で詰まらないための準備をする。
          </p>
        </article>
      </section>
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold">
          よくあるNG報告と、MIKATAが生成する改善例
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          断定はしません。実務の「言い方」だけを比べる例です。
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              進捗報告
            </p>
            <p className="mt-2 text-xs text-rose-300/90">NG</p>
            <p className="mt-1 text-sm text-slate-300">
              「頑張ります」「なんとかします」だけで数字と次の一手がない。
            </p>
            <p className="mt-3 text-xs text-cyan-300/90">改善の方向</p>
            <p className="mt-1 text-sm text-slate-200">
              現状数値・障害・期限・次アクションが一文で分かる報告にする。
            </p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              停滞・未達
            </p>
            <p className="mt-2 text-xs text-rose-300/90">NG</p>
            <p className="mt-1 text-sm text-slate-300">
              理由が曖昧で「様子見」に見える。いつ動くかが書けていない。
            </p>
            <p className="mt-3 text-xs text-cyan-300/90">改善の方向</p>
            <p className="mt-1 text-sm text-slate-200">
              事実で障害を切り分け、フォロー日時と担当を宣言する。
            </p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Slack呼び出し
            </p>
            <p className="mt-2 text-xs text-rose-300/90">NG</p>
            <p className="mt-1 text-sm text-slate-300">
              呼ばれた瞬間に「はい？」だけ。用件と自分の次の一手が伝わらない。
            </p>
            <p className="mt-3 text-xs text-cyan-300/90">改善の方向</p>
            <p className="mt-1 text-sm text-slate-200">
              用件確認＋いま取れる一手を一言で返す。
            </p>
          </article>
        </div>
      </section>
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h3 className="text-lg font-semibold">
          過去の詰められパターンから、先手を打つ
        </h3>
        <p className="mt-2 text-slate-300">
          Slackの通知音に怯えなくなる、その日まで。
        </p>
        <p className="mt-4 text-xs text-slate-500">
          本サービスは医療・心理支援サービスではありません。
        </p>
      </section>
    </main>
  );
}
