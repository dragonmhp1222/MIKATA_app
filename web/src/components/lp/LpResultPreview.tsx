import type { LpPreviewCard } from "@/lib/lp-variants";
import { LpInlineText } from "@/components/lp/LpInlineText";

type Props = {
  empathy: string;
  cards: LpPreviewCard[];
  disclaimerPreview: string;
};

// アプリの生成結果に近い見た目で「チラ見せ」。生成例である旨は必ず親で併記する。
export function LpResultPreview({ empathy, cards, disclaimerPreview }: Props) {
  return (
    <div className="mt-8">
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100/80 p-5 dark:border-slate-600 dark:bg-slate-950/50">
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span
            className="inline-block size-1.5 rounded-full bg-cyan-500"
            aria-hidden
          />
          生成結果のイメージ（例）
        </p>
        <p className="mt-4 text-sm font-medium text-slate-800 dark:text-slate-100">
          {empathy}
        </p>
        <div className="mt-4 space-y-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/80"
            >
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                <LpInlineText text={card.content} />
              </p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-slate-500 dark:text-slate-500">
        {disclaimerPreview}
      </p>
    </div>
  );
}
