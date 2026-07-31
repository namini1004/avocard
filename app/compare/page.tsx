import Link from "next/link";
import { CardVisual } from "@/components/CardVisual";
import { Header } from "@/components/Header";
import { verifiedCards } from "@/data/verified-cards";
import {
  defaultProfile,
  formatPercent,
  formatWon,
  rankVerifiedCards
} from "@/lib/calculate-v2";

export default function ComparePage() {
  const analyses = rankVerifiedCards(verifiedCards, defaultProfile);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="whitespace-nowrap text-sm font-black text-avocado-700">공식 검증 카드 비교</p>
            <h1 className="mt-3 text-5xl font-black text-ink">카드 비교</h1>
            <p className="mt-4 max-w-3xl keep-all text-lg leading-8 text-ink/68">
              월 70만원 대표 소비를 같은 방식으로 계산했습니다. 잠재 피킹률과 지속 피킹률의 차이가 클수록
              다음 달 실적 유지에 주의해야 합니다.
            </p>
          </div>
          <Link className="focus-ring rounded-full bg-ink px-6 py-4 text-sm font-black text-white" href="/recommend">
            내 소비로 다시 계산
          </Link>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {analyses.map((analysis) => (
            <article
              key={analysis.card.slug}
              className="rounded-[2rem] bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
            >
              <CardVisual card={analysis.card} compact />
              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="whitespace-nowrap text-sm font-black text-avocado-700">{analysis.card.issuer}</p>
                  <span className="whitespace-nowrap rounded-full bg-avocado-100 px-3 py-1 text-[11px] font-black text-avocado-800">
                    공식 검증
                  </span>
                </div>
                <h2 className="mt-1 text-2xl font-black text-ink">{analysis.card.name}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-cream p-4">
                    <p className="whitespace-nowrap text-xs font-bold text-ink/50">지속 순혜택</p>
                    <p className="mt-1 whitespace-nowrap text-xl font-black text-ink">
                      {formatWon(analysis.sustainable.netBenefit)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-avocado-100 p-4">
                    <p className="whitespace-nowrap text-xs font-bold text-ink/50">지속 피킹률</p>
                    <p className="mt-1 whitespace-nowrap text-xl font-black text-avocado-800">
                      {formatPercent(analysis.pickingRate)}
                    </p>
                  </div>
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="whitespace-nowrap font-bold text-ink/54">전월 충족 시</dt>
                    <dd className="whitespace-nowrap font-black">{formatPercent(analysis.potential.pickingRate)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="whitespace-nowrap font-bold text-ink/54">다음 달 인정실적</dt>
                    <dd className="whitespace-nowrap font-black">{formatWon(analysis.nextQualifyingSpend)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="whitespace-nowrap font-bold text-ink/54">연회비</dt>
                    <dd className="whitespace-nowrap font-black">{formatWon(analysis.card.annualFee)}</dd>
                  </div>
                </dl>
                <Link
                  href={`/cards/${analysis.card.slug}`}
                  className="focus-ring mt-5 inline-flex w-full justify-center rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
                >
                  상세 분석
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
