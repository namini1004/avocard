import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CardVisual } from "@/components/CardVisual";
import { cards } from "@/data/cards";
import { analyzeCard, defaultProfile, formatWon } from "@/lib/calculate";

export function generateStaticParams() {
  return cards.map((card) => ({ slug: card.slug }));
}

export default async function CardDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = cards.find((item) => item.slug === slug);
  if (!card) notFound();

  const analysis = analyzeCard(card, defaultProfile);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <CardVisual card={card} />
          <section className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <p className="whitespace-nowrap text-sm font-black text-avocado-700">{card.issuer}</p>
              <span className="whitespace-nowrap rounded-full bg-avocado-100 px-3 py-1 text-xs font-black text-avocado-800">
                공식 출처 연결
              </span>
              <span className="whitespace-nowrap rounded-full bg-cream px-3 py-1 text-xs font-black text-ink/60">
                {card.lastVerifiedAt} 기준
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-black leading-tight text-ink">{card.name}</h1>
            <p className="mt-4 text-base leading-8 text-ink/68 md:text-lg">{card.summary}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["월 순혜택", formatWon(analysis.monthlySaving)],
                ["피킹률", `${analysis.pickingRate.toFixed(2)}%`],
                ["전월실적", formatWon(card.previousSpend)],
                ["통합 월 한도", formatWon(analysis.effectiveMonthlyCap)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-cream p-4">
                  <p className="whitespace-nowrap text-xs font-bold text-ink/50">{label}</p>
                  <p className="mt-1 whitespace-nowrap text-xl font-black text-ink">{value}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <h2 className="whitespace-nowrap text-2xl font-black text-ink">영역별 혜택 조건</h2>
            <div className="mt-6 space-y-4">
              {card.benefitRules.map((benefit) => {
                const applied = analysis.ruleSavings.find((item) => item.id === benefit.id);
                return (
                  <div key={benefit.id} className="rounded-3xl border border-avocado-900/10 p-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p className="text-lg font-black text-ink">{benefit.label}</p>
                        <p className="mt-1 text-sm leading-6 text-ink/58">{benefit.note}</p>
                        <p className="mt-2 text-xs font-bold leading-5 text-ink/45">
                          최소 조건 {benefit.performanceBand} · 적용처 {benefit.merchantScope.join(", ")}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center md:min-w-[260px]">
                        <div className="rounded-2xl bg-cream px-3 py-2">
                          <p className="whitespace-nowrap text-[11px] font-black text-ink/45">할인율</p>
                          <p className="whitespace-nowrap text-sm font-black text-ink">
                            {((benefit.rate ?? 0) * 100).toFixed(benefit.rate && benefit.rate < 0.01 ? 1 : 0)}%
                          </p>
                        </div>
                        <div className="rounded-2xl bg-cream px-3 py-2">
                          <p className="whitespace-nowrap text-[11px] font-black text-ink/45">월 한도</p>
                          <p className="whitespace-nowrap text-sm font-black text-ink">{formatWon(benefit.monthlyCap)}</p>
                        </div>
                        <div className="rounded-2xl bg-avocado-100 px-3 py-2">
                          <p className="whitespace-nowrap text-[11px] font-black text-ink/45">예상</p>
                          <p className="whitespace-nowrap text-sm font-black text-avocado-800">
                            {formatWon(applied?.saving ?? 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] bg-ink p-6 text-white shadow-soft md:p-7">
            <h2 className="text-2xl font-black">피킹률 계산 이유</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="whitespace-nowrap text-sm font-bold text-white/60">광고 문구</p>
                <p className="mt-2 text-2xl font-black leading-tight">{card.advertisedBenefit}</p>
              </div>
              <div className="rounded-3xl bg-avocado-300 p-5 text-ink">
                <p className="whitespace-nowrap text-sm font-bold text-ink/60">월 70만원 소비 기준</p>
                <p className="mt-2 text-3xl font-black">{formatWon(analysis.monthlySaving)} 순혜택</p>
                <p className="mt-1 font-black">피킹률 {analysis.pickingRate.toFixed(2)}%</p>
              </div>
              <p className="leading-7 text-white/72">{analysis.reason}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <h2 className="whitespace-nowrap text-2xl font-black">실적/비용</h2>
            <dl className="mt-5 space-y-4">
              <div className="flex justify-between gap-4">
                <dt className="whitespace-nowrap font-bold text-ink/56">연회비</dt>
                <dd className="whitespace-nowrap font-black">{formatWon(card.annualFee)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="whitespace-nowrap font-bold text-ink/56">연회비 월할</dt>
                <dd className="whitespace-nowrap font-black">{formatWon(analysis.monthlyFee)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="whitespace-nowrap font-bold text-ink/56">통합 할인한도</dt>
                <dd className="whitespace-nowrap font-black">{formatWon(analysis.effectiveMonthlyCap)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <h2 className="whitespace-nowrap text-2xl font-black">추천 사용자</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {card.bestFor.map((item) => (
                <span key={item} className="whitespace-nowrap rounded-full bg-avocado-100 px-3 py-2 text-sm font-black text-avocado-800">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <h2 className="whitespace-nowrap text-2xl font-black">실적 제외 항목</h2>
            <p className="mt-4 leading-7 text-ink/64">{card.excluded.join(", ")}</p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
          <h2 className="whitespace-nowrap text-2xl font-black">데이터 출처</h2>
          <p className="mt-3 leading-7 text-ink/64">
            현재 MVP 데이터는 공식 상품 페이지, 여신금융협회 공시실, 인기 카드 랭킹 출처를 연결해 검수 흐름을 만들었습니다. 약관 PDF 단위의 세부 검증은 카드별로 계속 보강합니다.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {card.sourceUrls.map((source) => (
              <a
                key={`${source.type}-${source.url}`}
                href={source.url}
                className="rounded-3xl border border-avocado-900/10 p-5 transition hover:border-avocado-500"
              >
                <p className="whitespace-nowrap text-xs font-black uppercase text-avocado-700">{source.type}</p>
                <p className="mt-2 font-black text-ink">{source.title}</p>
                <p className="mt-1 break-all text-sm text-ink/52">{source.url}</p>
              </a>
            ))}
          </div>
        </section>

        <Link
          href="/cards"
          className="focus-ring mt-8 inline-flex whitespace-nowrap rounded-full bg-ink px-6 py-4 text-sm font-black text-white"
        >
          랭킹보드로 돌아가기
        </Link>
      </main>
    </>
  );
}
