import { CardAnalysis, formatWon } from "@/lib/calculate";
import { CardVisual } from "./CardVisual";
import { ButtonLink } from "./ButtonLink";

export function RecommendationCard({ analysis, rank }: { analysis: CardAnalysis; rank: number }) {
  return (
    <article className="grid gap-5 rounded-[2rem] border border-avocado-900/10 bg-white p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-lift lg:grid-cols-[240px_1fr]">
      <CardVisual card={analysis.card} compact />
      <div className="flex flex-col justify-between gap-5 p-1">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-avocado-100 px-3 py-1 text-xs font-black text-avocado-800">TOP {rank}</span>
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-black text-ink/70">
              {analysis.card.bestFor[0]}
            </span>
          </div>
          <h3 className="mt-3 text-2xl font-black text-ink">{analysis.card.name}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/66">{analysis.reason}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold text-ink/50">순 월혜택</p>
            <p className="text-xl font-black text-avocado-700">{formatWon(analysis.monthlySaving)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-ink/50">순 연혜택</p>
            <p className="text-xl font-black text-ink">{formatWon(analysis.annualSaving)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-ink/50">순피킹률</p>
            <p className="text-xl font-black text-ink">{analysis.pickingRate.toFixed(2)}%</p>
          </div>
        </div>
        <ButtonLink href={`/cards/${analysis.card.slug}`} tone="secondary">
          상세 분석 보기
        </ButtonLink>
      </div>
    </article>
  );
}
