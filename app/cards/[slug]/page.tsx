import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CardVisual } from "@/components/CardVisual";
import { MetricCard } from "@/components/MetricCard";
import { BenefitBar } from "@/components/BenefitBar";
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
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <CardVisual card={card} />
          <section className="rounded-[2rem] bg-white p-7 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black text-avocado-700">{card.issuer}</p>
              <span className="rounded-full bg-avocado-100 px-3 py-1 text-xs font-black text-avocado-800">
                {card.reviewStatus === "verified" ? "검수 완료" : "검수 필요"}
              </span>
              <span className="rounded-full bg-cream px-3 py-1 text-xs font-black text-ink/60">
                마지막 확인 {card.lastVerifiedAt}
              </span>
            </div>
            <h1 className="mt-2 text-4xl font-black text-ink">{card.name}</h1>
            <p className="mt-4 text-lg leading-8 text-ink/68">{card.summary}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <MetricCard label="순 월혜택" value={formatWon(analysis.monthlySaving)} />
              <MetricCard label="순 피킹률" value={`${analysis.pickingRate.toFixed(2)}%`} />
              <MetricCard label="전월실적" value={formatWon(card.previousSpend)} />
            </div>
          </section>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-7 shadow-soft">
            <h2 className="text-2xl font-black text-ink">주요 혜택 구조</h2>
            <div className="mt-6 space-y-5">
              {card.benefitRules.map((benefit) => (
                <div key={benefit.id} className="rounded-3xl border border-avocado-900/10 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-ink">{benefit.label}</p>
                      <p className="mt-1 text-sm text-ink/58">{benefit.note}</p>
                      <p className="mt-2 text-xs font-bold text-ink/45">
                        적용처: {benefit.merchantScope.join(", ")} · 실적 {benefit.performanceBand}
                      </p>
                    </div>
                    <span className="rounded-full bg-avocado-100 px-3 py-1 text-sm font-black text-avocado-800">
                      {((benefit.rate ?? 0) * 100).toFixed(0)}% · 월 {formatWon(benefit.monthlyCap)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] bg-ink p-7 text-white shadow-soft">
            <h2 className="text-2xl font-black">광고상 혜택 vs 현실적 혜택</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm font-bold text-white/60">광고 문구</p>
                <p className="mt-2 text-2xl font-black">{card.advertisedBenefit}</p>
              </div>
              <div className="rounded-3xl bg-avocado-300 p-5 text-ink">
                <p className="text-sm font-bold text-ink/60">월 70만원 소비 기준</p>
                <p className="mt-2 text-3xl font-black">{formatWon(analysis.monthlySaving)} 순혜택</p>
                <p className="mt-1 font-black">순피킹률 {analysis.pickingRate.toFixed(2)}%</p>
              </div>
              <p className="leading-7 text-white/72">{analysis.reason}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-7 shadow-soft">
            <h2 className="text-2xl font-black">실적/비용</h2>
            <dl className="mt-5 space-y-4">
              <div className="flex justify-between gap-4">
                <dt className="font-bold text-ink/56">연회비</dt>
                <dd className="font-black">{formatWon(card.annualFee)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-bold text-ink/56">연회비 월할</dt>
                <dd className="font-black">{formatWon(analysis.monthlyFee)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="font-bold text-ink/56">통합 월 할인한도</dt>
                <dd className="font-black">{formatWon(analysis.effectiveMonthlyCap)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-[2rem] bg-white p-7 shadow-soft">
            <h2 className="text-2xl font-black">추천 사용자</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {card.bestFor.map((item) => (
                <span key={item} className="rounded-full bg-avocado-100 px-3 py-2 text-sm font-black text-avocado-800">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-7 shadow-soft">
            <h2 className="text-2xl font-black">실적 제외 항목</h2>
            <p className="mt-4 leading-7 text-ink/64">{card.excluded.join(", ")}</p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-7 shadow-soft">
          <h2 className="text-2xl font-black">데이터 출처와 검수 상태</h2>
          <p className="mt-3 leading-7 text-ink/64">
            아보카드는 광고 문구와 계산 가능한 혜택 규칙을 분리해서 관리합니다. 아래 출처는 실제 서비스에서 공식
            카드사 페이지와 상품설명서 PDF로 교체됩니다.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {card.sourceUrls.map((source) => (
              <a
                key={`${source.type}-${source.url}`}
                href={source.url}
                className="rounded-3xl border border-avocado-900/10 p-5 transition hover:border-avocado-500"
              >
                <p className="text-xs font-black uppercase text-avocado-700">{source.type}</p>
                <p className="mt-2 font-black text-ink">{source.title}</p>
                <p className="mt-1 break-all text-sm text-ink/52">{source.url}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-7 shadow-soft">
            <h2 className="text-2xl font-black">장점</h2>
            <ul className="mt-4 space-y-3">
              {card.strengths.map((item) => (
                <li key={item} className="font-bold leading-7 text-ink/70">+ {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] bg-white p-7 shadow-soft">
            <h2 className="text-2xl font-black">주의할 점</h2>
            <ul className="mt-4 space-y-3">
              {[...card.weaknesses, ...card.cautions].map((item) => (
                <li key={item} className="font-bold leading-7 text-ink/70">- {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-7 shadow-soft">
          <h2 className="text-2xl font-black">순혜택 계산 내역</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-cream p-4">
              <p className="text-xs font-bold text-ink/50">혜택 합계</p>
              <p className="mt-1 text-xl font-black text-ink">{formatWon(analysis.matchedBenefit)}</p>
            </div>
            <div className="rounded-2xl bg-cream p-4">
              <p className="text-xs font-bold text-ink/50">통합한도 적용</p>
              <p className="mt-1 text-xl font-black text-ink">{formatWon(analysis.grossMonthlySaving)}</p>
            </div>
            <div className="rounded-2xl bg-cream p-4">
              <p className="text-xs font-bold text-ink/50">월할 연회비</p>
              <p className="mt-1 text-xl font-black text-ink">-{formatWon(analysis.monthlyFee)}</p>
            </div>
            <div className="rounded-2xl bg-avocado-100 p-4">
              <p className="text-xs font-bold text-ink/50">최종 순혜택</p>
              <p className="mt-1 text-xl font-black text-avocado-800">{formatWon(analysis.monthlySaving)}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {analysis.ruleSavings.map((benefit) => (
              <BenefitBar
                key={benefit.id}
                label={`${benefit.label} · ${formatWon(defaultProfile[benefit.category])} 사용 · ${(benefit.rate * 100).toFixed(0)}%`}
                value={benefit.saving}
                max={benefit.cap}
              />
            ))}
          </div>
          <Link
            href="/cards"
            className="focus-ring mt-8 inline-flex rounded-full bg-ink px-6 py-4 text-sm font-black text-white"
          >
            랭킹보드로 돌아가기
          </Link>
        </section>
      </main>
    </>
  );
}
