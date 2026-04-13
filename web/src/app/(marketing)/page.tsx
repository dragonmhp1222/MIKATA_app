import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 md:px-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 md:p-12">
        <p className="mb-4 inline-block rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          MIKATA for SaaS Sales
        </p>
        <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-5xl">
          数字報告で詰められる前に、明日の返し方を準備する
        </h1>
        <p className="mt-4 text-sm text-slate-300 md:text-base">
          SaaS営業でよくある「ヨミ会（進捗会議）」の不安に対応。
        </p>
        <p className="mt-6 max-w-2xl text-slate-200">
          SaaS営業の「怖い明日」を、今夜30秒で整理する。
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            className="rounded-full bg-cyan-400 px-6 py-3 text-center font-semibold text-slate-950 hover:bg-cyan-300"
            href="/app"
          >
            詰められる前に、返し方を作る（無料）
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
          入力内容は生成処理のため外部AI APIに送信されます。機密情報は伏せ字で入力してください。
        </p>
      </section>
      <section id="scenes" className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="font-semibold">① ヨミ会・進捗報告の前夜</h2>
          <p className="mt-2 text-sm text-slate-300">
            「数字が足りない」と詰められる前に、明日の返しと根拠を用意する。
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="font-semibold">② 同行・商談後のフィードバック</h2>
          <p className="mt-2 text-sm text-slate-300">
            「あの場面、どうすべきだった？」に答える前に、自分なりの解釈を整理する。
          </p>
        </article>
        <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="font-semibold">③ 「ちょっといい？」Slack呼び出し</h2>
          <p className="mt-2 text-sm text-slate-300">
            何を言われるか分からない呼び出しで、最初の一言と答え方を決めておく。
          </p>
        </article>
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
