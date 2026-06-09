import Link from "next/link";
import { Header } from "@/components/Header";
import { CardVisual } from "@/components/CardVisual";
import { cards, categoryLabels } from "@/data/cards";
import { analyzeCard, defaultProfile, formatWon } from "@/lib/calculate";
import { minimumPopularCardCoverage, popularCoverageTargets } from "@/data/official-sources";

const analyses = cards.map((card) => analyzeCard(card, defaultProfile));
const analyzedCount = analyses.length;
const averagePickingRate =
  analyses.length > 0 ? analyses.reduce((sum, analysis) => sum + analysis.pickingRate, 0) / analyses.length : 0;

export default function CardsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="rounded-[2.5rem] bg-ink p-8 text-white shadow-lift md:p-10">
          <p className="text-sm font-black text-avocado-200">CARD ANALYSIS</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight">카드별 혜택, 연회비, 실제 피킹률</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            현재 화면은 분석 가능한 카드 데이터만 보여줍니다. 100개는 공식 출처 수집 목표이며, 카드별 상품설명서 검수가 끝난 카드부터 이 목록에 추가됩니다.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-avocado-700">분석 가능 카드</p>
            <p className="mt-2 text-4xl font-black text-ink">{analyzedCount}</p>
            <p className="mt-2 text-sm font-bold text-ink/54">현재 화면에 표시 중</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-avocado-700">100개 수집 목표</p>
            <p className="mt-2 text-4xl font-black text-ink">{popularCoverageTargets.length}</p>
            <p className="mt-2 text-sm font-bold text-ink/54">공식 출처 검수 대기</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-avocado-700">평균 피킹률</p>
            <p className="mt-2 text-4xl font-black text-ink">{averagePickingRate.toFixed(2)}%</p>
            <p className="mt-2 text-sm font-bold text-ink/54">월 70만원 예시 기준</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-avocado-700">검증 기준</p>
            <p className="mt-2 text-4xl font-black text-ink">2</p>
            <p className="mt-2 text-sm font-bold text-ink/54">상품 페이지 + PDF</p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-5 shadow-soft md:p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-black text-ink">분석 가능한 카드</h2>
              <p className="mt-2 text-sm leading-6 text-ink/58">
                각 카드의 혜택 규칙에 월 70만원 예시 소비 패턴을 적용해 예상 절감액과 피킹률을 계산했습니다.
              </p>
            </div>
            <Link href="/sources" className="focus-ring rounded-full bg-avocado-700 px-5 py-3 text-sm font-black text-white">
              100개 수집 현황 보기
            </Link>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {analyses.map((analysis) => {
              const topRules = analysis.card.benefitRules.slice(0, 3);
              return (
                <article
                  key={analysis.card.slug}
                  className="grid gap-5 rounded-[2rem] border border-avocado-900/10 p-4 transition hover:-translate-y-1 hover:border-avocado-500 hover:shadow-lift md:grid-cols-[220px_1fr]"
                >
                  <CardVisual card={analysis.card} compact />
                  <div className="flex flex-col justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-avocado-100 px-3 py-1 text-xs font-black text-avocado-800">
                          {analysis.card.issuer}
                        </span>
                        <span className="rounded-full bg-cream px-3 py-1 text-xs font-black text-ink/60">
                          {analysis.card.reviewStatus === "verified" ? "검수 완료" : "샘플 데이터"}
                        </span>
                      </div>
                      <h3 className="mt-3 text-2xl font-black text-ink">{analysis.card.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-ink/62">{analysis.card.summary}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-cream p-3">
                        <p className="text-xs font-bold text-ink/50">연회비</p>
                        <p className="mt-1 font-black text-ink">{formatWon(analysis.card.annualFee)}</p>
                      </div>
                      <div className="rounded-2xl bg-cream p-3">
                        <p className="text-xs font-bold text-ink/50">전월실적</p>
                        <p className="mt-1 font-black text-ink">{formatWon(analysis.card.previousSpend)}</p>
                      </div>
                      <div className="rounded-2xl bg-avocado-100 p-3">
                        <p className="text-xs font-bold text-ink/50">월 절감액</p>
                        <p className="mt-1 font-black text-avocado-800">{formatWon(analysis.monthlySaving)}</p>
                      </div>
                      <div className="rounded-2xl bg-avocado-100 p-3">
                        <p className="text-xs font-bold text-ink/50">피킹률</p>
                        <p className="mt-1 font-black text-avocado-800">{analysis.pickingRate.toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {topRules.map((rule) => (
                        <span key={rule.id} className="rounded-full border border-avocado-900/10 px-3 py-1 text-xs font-black text-ink/64">
                          {categoryLabels[rule.category]} {(rule.rate ? rule.rate * 100 : 0).toFixed(0)}%
                        </span>
                      ))}
                    </div>

                    <Link
                      href={`/cards/${analysis.card.slug}`}
                      className="focus-ring inline-flex w-fit rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
                    >
                      상세 분석 보기
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-avocado-900/10 bg-cream p-6">
          <h2 className="text-2xl font-black text-ink">100개 카드는 어디에서 확인하나요?</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-ink/64">
            현재 100개는 카드사별·혜택목적별 수집 타깃입니다. 실제 카드명, 연회비, 혜택, 피킹률은 공식 상품 페이지와 상품설명서 PDF 검수가 끝난 뒤 이 목록에 순차적으로 추가됩니다. 수집 타깃은 데이터 현황 페이지에서 확인할 수 있습니다.
          </p>
          <Link href="/sources" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-ink shadow-soft">
            데이터 현황으로 이동
          </Link>
        </section>
      </main>
    </>
  );
}
