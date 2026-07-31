import Link from "next/link";
import { notFound } from "next/navigation";
import { CardVisual } from "@/components/CardVisual";
import { Header } from "@/components/Header";
import { verifiedCardBySlug, verifiedCards } from "@/data/verified-cards";
import type { VerifiedBenefitRule } from "@/data/verified-card-types";
import {
  analyzeVerifiedCard,
  defaultProfile,
  formatPercent,
  formatWon
} from "@/lib/calculate-v2";

export function generateStaticParams() {
  return verifiedCards.map((card) => ({ slug: card.slug }));
}

function rewardLabel(rule: VerifiedBenefitRule) {
  return rule.rewardBands
    .map((band) => {
      const min =
        band.minTransactionAmount !== undefined
          ? `건당 ${formatWon(band.minTransactionAmount)} 이상 `
          : "";
      if (band.formula.kind === "rate") {
        return `${min}${Number((band.formula.rate * 100).toFixed(2))}%`;
      }
      if (band.formula.kind === "fixed") return `${min}${formatWon(band.formula.amount)}`;
      return `리터당 ${formatWon(band.formula.wonPerLiter)}`;
    })
    .join(" · ");
}

export default async function CardDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = verifiedCardBySlug.get(slug);
  if (!card) notFound();

  const analysis = analyzeVerifiedCard(card, defaultProfile);
  const { sustainable, potential } = analysis;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <CardVisual card={card} />
          <section className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <p className="whitespace-nowrap text-sm font-black text-avocado-700">{card.issuer}</p>
              <span className="whitespace-nowrap rounded-full bg-avocado-100 px-3 py-1 text-xs font-black text-avocado-800">
                공식 검증
              </span>
              <span className="whitespace-nowrap rounded-full bg-cream px-3 py-1 text-xs font-black text-ink/60">
                {card.verification.verifiedAt} 기준
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-black leading-tight text-ink">{card.name}</h1>
            <p className="mt-4 keep-all text-base leading-8 text-ink/68 md:text-lg">{card.summary}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                ["지속 순혜택", formatWon(sustainable.netBenefit)],
                ["지속 피킹률", formatPercent(sustainable.pickingRate)],
                ["전월 충족 시", formatPercent(potential.pickingRate)],
                ["다음 달 인정실적", formatWon(analysis.nextQualifyingSpend)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-cream p-4">
                  <p className="whitespace-nowrap text-xs font-bold text-ink/50">{label}</p>
                  <p className="mt-1 whitespace-nowrap text-xl font-black text-ink">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 keep-all rounded-2xl bg-avocado-100 p-4 text-sm font-bold leading-6 text-ink/68">
              {analysis.reason}
            </p>
          </section>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <h2 className="whitespace-nowrap text-2xl font-black text-ink">혜택별 실제 조건</h2>
            <div className="mt-6 space-y-4">
              {card.benefitRules.map((rule) => {
                const applied = sustainable.ruleSavings.find((item) => item.id === rule.id);
                return (
                  <div key={rule.id} className="rounded-3xl border border-avocado-900/10 p-5">
                    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                      <div>
                        <p className="text-lg font-black text-ink">{rule.label}</p>
                        <p className="mt-1 keep-all text-sm leading-6 text-ink/58">{rule.note}</p>
                        <p className="mt-2 keep-all text-xs font-bold leading-5 text-ink/45">
                          {rewardLabel(rule)} · {rule.merchantScope.join(", ")}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center xl:min-w-[300px]">
                        <div className="rounded-2xl bg-cream px-3 py-2">
                          <p className="whitespace-nowrap text-[11px] font-black text-ink/45">인정 사용액</p>
                          <p className="whitespace-nowrap text-sm font-black text-ink">
                            {formatWon(applied?.spend ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-cream px-3 py-2">
                          <p className="whitespace-nowrap text-[11px] font-black text-ink/45">한도 전 혜택</p>
                          <p className="whitespace-nowrap text-sm font-black text-ink">
                            {formatWon(applied?.savingBeforeCaps ?? 0)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-avocado-100 px-3 py-2">
                          <p className="whitespace-nowrap text-[11px] font-black text-ink/45">최종 혜택</p>
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
            <h2 className="whitespace-nowrap text-2xl font-black">피킹률 계산서</h2>
            <div className="mt-6 grid gap-4">
              {[
                ["월 카드 사용액", sustainable.currentSpend],
                ["영역별 총혜택", sustainable.grossBenefit],
                ["연회비 월할", -sustainable.monthlyFee],
                ["지속 순혜택", sustainable.netBenefit]
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-white/12 pb-4">
                  <p className="whitespace-nowrap text-sm font-bold text-white/60">{label}</p>
                  <p className="whitespace-nowrap text-xl font-black">{formatWon(Number(value))}</p>
                </div>
              ))}
              <div className="rounded-3xl bg-avocado-300 p-5 text-ink">
                <p className="whitespace-nowrap text-sm font-bold text-ink/60">지속 피킹률</p>
                <p className="mt-2 text-4xl font-black">{formatPercent(sustainable.pickingRate)}</p>
                <p className="mt-2 keep-all text-sm font-bold leading-6 text-ink/62">
                  순혜택 {formatWon(sustainable.netBenefit)} ÷ 실제 사용액{" "}
                  {formatWon(sustainable.currentSpend)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <h2 className="whitespace-nowrap text-2xl font-black">실적과 한도</h2>
            <p className="mt-4 keep-all text-sm leading-7 text-ink/62">{card.performance.description}</p>
            <div className="mt-4 space-y-2">
              {card.capTiers.map((tier) => (
                <div key={tier.id} className="flex justify-between gap-3 rounded-2xl bg-cream px-4 py-3 text-sm">
                  <span className="whitespace-nowrap font-black">{tier.label}</span>
                  <span className="truncate text-right font-black text-avocado-700">
                    {tier.totalCap !== undefined
                      ? `통합 ${formatWon(tier.totalCap)}`
                      : Object.values(tier.groupCaps ?? {}).length > 0
                        ? Object.values(tier.groupCaps ?? {})
                            .map(formatWon)
                            .join(" · ")
                        : "한도 없음"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <h2 className="whitespace-nowrap text-2xl font-black">꼭 지킬 조건</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink/64">
              {card.cautions.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
            <h2 className="whitespace-nowrap text-2xl font-black">계산 범위</h2>
            <p className="mt-4 keep-all text-sm leading-7 text-ink/64">
              {card.calculationCoverage === "full_monetary"
                ? "공식 페이지에서 확인한 금전 혜택 전체를 계산합니다."
                : "소비 입력으로 재현할 수 있는 핵심 금전 혜택만 보수적으로 계산합니다."}
            </p>
            {card.nonCalculatedBenefits.length > 0 ? (
              <p className="mt-3 keep-all text-sm leading-7 text-ink/52">
                계산 제외: {card.nonCalculatedBenefits.join(", ")}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-soft md:p-7">
          <h2 className="whitespace-nowrap text-2xl font-black">공식 데이터 출처</h2>
          <p className="mt-3 keep-all text-sm leading-7 text-ink/64">{card.verification.method}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {card.verification.sources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-3xl border border-avocado-900/10 p-5 transition hover:border-avocado-500"
              >
                <p className="whitespace-nowrap text-xs font-black text-avocado-700">
                  {source.type === "issuer_pdf" ? "공식 PDF" : "카드사 공식 페이지"}
                </p>
                <p className="mt-2 font-black text-ink">{source.title}</p>
                <p className="mt-2 keep-all text-xs leading-5 text-ink/50">
                  검증: {source.verifiedFields.join(", ")}
                </p>
              </a>
            ))}
          </div>
        </section>

        <Link
          href="/#ranking"
          className="focus-ring mt-8 inline-flex whitespace-nowrap rounded-full bg-ink px-6 py-4 text-sm font-black text-white"
        >
          랭킹으로 돌아가기
        </Link>
      </main>
    </>
  );
}
