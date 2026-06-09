import Link from "next/link";
import { Header } from "@/components/Header";
import { CardVisual } from "@/components/CardVisual";
import { cards } from "@/data/cards";
import { analyzeCard, defaultProfile, formatWon } from "@/lib/calculate";

export default function ComparePage() {
  const analyses = cards.map((card) => analyzeCard(card, defaultProfile));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black text-avocado-700">CARD COMPARISON</p>
            <h1 className="mt-3 text-5xl font-black text-ink">카드 비교</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/68">
              같은 월 70만원 소비라도 카드마다 실제로 남는 금액은 다릅니다. 광고 문구, 전월실적, 한도, 피킹률을
              한 화면에서 비교하세요.
            </p>
          </div>
          <Link className="focus-ring rounded-full bg-ink px-6 py-4 text-sm font-black text-white" href="/recommend">
            내 소비로 다시 계산
          </Link>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {analyses.map((analysis) => (
            <article key={analysis.card.slug} className="rounded-[2rem] bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
              <CardVisual card={analysis.card} compact />
              <div className="mt-5">
                <p className="text-sm font-black text-avocado-700">{analysis.card.issuer}</p>
                <h2 className="mt-1 text-2xl font-black text-ink">{analysis.card.name}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-cream p-4">
                    <p className="text-xs font-bold text-ink/50">월 절감액</p>
                    <p className="mt-1 text-xl font-black text-ink">{formatWon(analysis.monthlySaving)}</p>
                  </div>
                  <div className="rounded-2xl bg-avocado-100 p-4">
                    <p className="text-xs font-bold text-ink/50">피킹률</p>
                    <p className="mt-1 text-xl font-black text-avocado-800">{analysis.pickingRate.toFixed(2)}%</p>
                  </div>
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-ink/54">광고 문구</dt>
                    <dd className="text-right font-black">{analysis.card.advertisedBenefit}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-ink/54">전월실적</dt>
                    <dd className="font-black">{formatWon(analysis.card.previousSpend)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-bold text-ink/54">월 한도</dt>
                    <dd className="font-black">{formatWon(analysis.card.monthlyCap)}</dd>
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
