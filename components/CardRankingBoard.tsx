"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BenefitCategory, cards, categoryLabels } from "@/data/cards";
import { CardAnalysis, analyzeCard, defaultProfile, formatWon, SpendingProfile } from "@/lib/calculate";

const totalOptions = [
  { label: "30", value: 300000 },
  { label: "40", value: 400000 },
  { label: "50", value: 500000 },
  { label: "70", value: 700000 },
  { label: "100", value: 1000000 },
  { label: "120", value: 1200000 }
];

const focusOptions: Array<{ label: string; value: "balanced" | BenefitCategory }> = [
  { label: "균형", value: "balanced" },
  { label: "교통", value: "transport" },
  { label: "커피", value: "coffee" },
  { label: "배달", value: "delivery" },
  { label: "주유", value: "fuel" },
  { label: "쇼핑", value: "shopping" },
  { label: "통신", value: "telecom" },
  { label: "OTT", value: "ott" },
  { label: "여행", value: "travel" }
];

const activeCards = cards.filter((card) => card.status !== "unknown");
const benefitCategories = Object.keys(categoryLabels) as BenefitCategory[];

function roundToUnit(value: number, unit = 10000) {
  return Math.max(0, Math.round(value / unit) * unit);
}

function buildProfile(total: number, focus: "balanced" | BenefitCategory): SpendingProfile {
  const profile: SpendingProfile = { ...defaultProfile, total };
  const categoryTotal = benefitCategories.reduce((sum, category) => sum + (defaultProfile[category] ?? 0), 0);
  const scale = categoryTotal > 0 ? total / categoryTotal : 1;

  benefitCategories.forEach((category) => {
    profile[category] = roundToUnit((defaultProfile[category] ?? 0) * scale);
  });

  if (focus !== "balanced") {
    const focusedAmount = roundToUnit(total * 0.35);
    const remaining = Math.max(0, total - focusedAmount);
    const otherTotal = benefitCategories
      .filter((category) => category !== focus)
      .reduce((sum, category) => sum + profile[category], 0);

    profile[focus] = focusedAmount;
    benefitCategories
      .filter((category) => category !== focus)
      .forEach((category) => {
        profile[category] = otherTotal > 0 ? roundToUnit((profile[category] / otherTotal) * remaining) : 0;
      });
  }

  const normalizedTotal = benefitCategories.reduce((sum, category) => sum + profile[category], 0);
  profile[focus === "balanced" ? "etc" : focus] += total - normalizedTotal;
  return profile;
}

function rateLabel(rate: number) {
  if (rate <= 0) return "-";
  return `${(rate * 100).toFixed(rate < 0.01 ? 1 : 0)}%`;
}

function RankingDetail({
  selected,
  selectedRank,
  profileTotal
}: {
  selected: CardAnalysis;
  selectedRank: number;
  profileTotal: number;
}) {
  const tiers = selected.card.monthlyCapTiers ?? [];

  return (
    <article className="h-full overflow-auto rounded-[1.75rem] border border-avocado-900/10 bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="whitespace-nowrap text-sm font-black text-avocado-700">#{selectedRank} 계산 결과</p>
          <h3 className="mt-2 text-3xl font-black leading-tight text-ink">{selected.card.name}</h3>
          <p className="mt-3 keep-all text-sm leading-6 text-ink/62">{selected.card.summary}</p>
        </div>
        <span className="w-fit whitespace-nowrap rounded-full bg-avocado-100 px-4 py-2 text-sm font-black text-avocado-800">
          {selected.pickingRate.toFixed(2)}%
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl bg-cream p-4">
          <p className="whitespace-nowrap text-xs font-bold text-ink/50">적용 구간</p>
          <p className="mt-1 text-lg font-black text-ink">{selected.appliedMonthlyCapTier?.label ?? "미충족"}</p>
        </div>
        <div className="rounded-2xl bg-cream p-4">
          <p className="whitespace-nowrap text-xs font-bold text-ink/50">영역별 혜택합</p>
          <p className="mt-1 text-lg font-black text-ink">{formatWon(selected.matchedBenefit)}</p>
        </div>
        <div className="rounded-2xl bg-cream p-4">
          <p className="whitespace-nowrap text-xs font-bold text-ink/50">통합 월 한도</p>
          <p className="mt-1 text-lg font-black text-ink">{formatWon(selected.effectiveMonthlyCap)}</p>
        </div>
        <div className="rounded-2xl bg-cream p-4">
          <p className="whitespace-nowrap text-xs font-bold text-ink/50">연회비 월할</p>
          <p className="mt-1 text-lg font-black text-ink">-{formatWon(selected.monthlyFee)}</p>
        </div>
        <div className="rounded-2xl bg-avocado-100 p-4">
          <p className="whitespace-nowrap text-xs font-bold text-ink/50">월 순혜택</p>
          <p className="mt-1 text-lg font-black text-avocado-800">{formatWon(selected.monthlySaving)}</p>
        </div>
      </div>

      {tiers.length > 1 ? (
        <div className="mt-5 rounded-3xl border border-avocado-900/10 p-5">
          <h4 className="whitespace-nowrap text-lg font-black text-ink">실적 구간별 통합한도</h4>
          <div className="mt-3 grid gap-2">
            {tiers.map((tier) => {
              const active = selected.appliedMonthlyCapTier?.minSpend === tier.minSpend && selected.appliedMonthlyCapTier?.totalCap === tier.totalCap;
              return (
                <div
                  key={`${tier.minSpend}-${tier.maxSpend ?? "up"}-${tier.totalCap}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm ${
                    active ? "bg-avocado-100 text-avocado-900" : "bg-cream text-ink/70"
                  }`}
                >
                  <span className="font-black">{tier.label}</span>
                  <span className="whitespace-nowrap font-black">{formatWon(tier.totalCap)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-3xl bg-ink p-5 text-white">
        <h4 className="whitespace-nowrap text-lg font-black">피킹률 계산식</h4>
        <p className="mt-3 keep-all text-sm leading-7 text-white/74">
          피킹률은 내가 쓴 돈 대비 실제로 남는 금액입니다. 영역별 할인 예상액을 먼저 계산하고, 선택 월 사용액에 맞는 통합 월 한도로 자른 뒤,
          연회비 월할을 차감합니다.
        </p>
        <p className="mt-3 whitespace-nowrap text-xl font-black text-avocado-100">
          {formatWon(selected.monthlySaving)} / {formatWon(profileTotal)} = {selected.pickingRate.toFixed(2)}%
        </p>
      </div>

      <div className="mt-5 rounded-3xl bg-cream p-5">
        <h4 className="whitespace-nowrap text-lg font-black text-ink">왜 이 피킹률인가요?</h4>
        <p className="mt-3 keep-all text-sm leading-7 text-ink/66">{selected.reason}</p>
      </div>

      <div className="mt-5">
        <h4 className="whitespace-nowrap text-lg font-black text-ink">영역별 계산 근거</h4>
        <div className="mt-3 grid gap-3">
          {selected.card.benefitRules.map((rule) => {
            const applied = selected.ruleSavings.find((item) => item.id === rule.id);
            return (
              <div key={rule.id} className="rounded-3xl border border-avocado-900/10 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <p className="font-black text-ink">{rule.label}</p>
                    <p className="mt-1 keep-all text-sm leading-6 text-ink/58">{rule.note}</p>
                    <p className="mt-2 keep-all text-xs font-bold leading-5 text-ink/45">
                      조건 {rule.performanceBand} · 적용처 {rule.merchantScope.join(", ")}
                    </p>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center md:min-w-[340px]">
                    <div className="rounded-2xl bg-cream px-3 py-2">
                      <p className="whitespace-nowrap text-[11px] font-black text-ink/45">사용액</p>
                      <p className="whitespace-nowrap text-sm font-black text-ink">{formatWon(applied?.spend ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl bg-cream px-3 py-2">
                      <p className="whitespace-nowrap text-[11px] font-black text-ink/45">혜택률</p>
                      <p className="whitespace-nowrap text-sm font-black text-ink">{rateLabel(rule.rate ?? 0)}</p>
                    </div>
                    <div className="rounded-2xl bg-cream px-3 py-2">
                      <p className="whitespace-nowrap text-[11px] font-black text-ink/45">영역한도</p>
                      <p className="whitespace-nowrap text-sm font-black text-ink">{formatWon(rule.monthlyCap)}</p>
                    </div>
                    <div className="rounded-2xl bg-avocado-100 px-3 py-2">
                      <p className="whitespace-nowrap text-[11px] font-black text-ink/45">인정혜택</p>
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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/cards/${selected.card.slug}`}
          className="focus-ring whitespace-nowrap rounded-full bg-ink px-5 py-3 text-center text-sm font-black text-white"
        >
          상세 페이지 보기
        </Link>
        <a
          href={selected.card.sourceUrls[0]?.url}
          className="focus-ring whitespace-nowrap rounded-full bg-cream px-5 py-3 text-center text-sm font-black text-ink"
        >
          수집 출처 보기
        </a>
      </div>
    </article>
  );
}

export function CardRankingBoard() {
  const [total, setTotal] = useState(700000);
  const [focus, setFocus] = useState<"balanced" | BenefitCategory>("balanced");
  const [selectedSlug, setSelectedSlug] = useState(activeCards[0]?.slug ?? "");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const profile = useMemo(() => buildProfile(total, focus), [total, focus]);
  const rankings = useMemo(() => {
    return activeCards
      .map((card) => analyzeCard(card, profile))
      .sort((a, b) => b.pickingRate - a.pickingRate || b.monthlySaving - a.monthlySaving);
  }, [profile]);

  const selected = rankings.find((analysis) => analysis.card.slug === selectedSlug) ?? rankings[0];
  const selectedRank = rankings.findIndex((analysis) => analysis.card.slug === selected?.card.slug) + 1;

  function selectCard(slug: string) {
    setSelectedSlug(slug);
    setIsModalOpen(true);
  }

  return (
    <section className="rounded-[2rem] bg-white p-4 shadow-soft md:p-7">
      <div>
        <h2 className="text-3xl font-black leading-tight text-ink md:text-4xl">인기 카드 피킹률 순위</h2>
        <p className="mt-3 max-w-3xl keep-all text-sm leading-6 text-ink/62 md:text-base md:leading-7">
          선택한 월 사용액의 실적 구간에 맞춰 통합 월 한도를 적용합니다. 30만원 구간 카드가 120만원 구간 한도를 가져오는 오류 없이,
          실제 사용액 대비 남는 혜택만 피킹률로 계산합니다.
        </p>
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-cream p-3 md:rounded-[1.75rem] md:p-4">
        <div className="grid gap-3 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="whitespace-nowrap text-xs font-black text-ink/54">월 카드 사용액(만원)</p>
            <div className="mt-2 grid grid-cols-6 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
              {totalOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTotal(option.value)}
                  className={`focus-ring whitespace-nowrap rounded-full px-2 py-2 text-xs font-black transition sm:px-4 sm:text-sm ${
                    total === option.value ? "bg-ink text-white" : "bg-white text-ink hover:bg-avocado-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="whitespace-nowrap text-xs font-black text-ink/54">소비 성향</p>
            <div className="mt-2 grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
              {focusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFocus(option.value)}
                  className={`focus-ring whitespace-nowrap rounded-full px-2 py-2 text-xs font-black transition sm:px-4 sm:text-sm ${
                    focus === option.value ? "bg-avocado-700 text-white" : "bg-white text-ink hover:bg-avocado-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-avocado-900/10 bg-white">
          <div className="max-h-[720px] divide-y divide-avocado-900/10 overflow-auto">
            {rankings.map((analysis, index) => (
              <button
                key={analysis.card.slug}
                type="button"
                onClick={() => selectCard(analysis.card.slug)}
                className={`grid w-full grid-cols-[58px_1fr_84px] items-center gap-2 px-3 py-4 text-left transition ${
                  selected?.card.slug === analysis.card.slug ? "bg-avocado-50" : "hover:bg-cream"
                }`}
              >
                <span className="w-fit rounded-full bg-cream px-2.5 py-1 text-xs font-black text-ink">
                  #{index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-ink md:text-base">{analysis.card.name}</span>
                  <span className="mt-1 block truncate text-xs font-bold text-ink/48">
                    {analysis.appliedMonthlyCapTier?.label ?? "미충족"} · 순혜택 {formatWon(analysis.monthlySaving)}
                  </span>
                </span>
                <span className="text-right text-base font-black text-avocado-700 md:text-lg">
                  {analysis.pickingRate.toFixed(2)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <div className="hidden lg:block">
            <RankingDetail selected={selected} selectedRank={selectedRank} profileTotal={profile.total} />
          </div>
        ) : (
          <div className="rounded-[1.75rem] bg-cream p-6 text-center font-black text-ink/60">
            조건에 맞는 카드가 없습니다.
          </div>
        )}
      </div>

      {isModalOpen && selected ? (
        <div className="fixed inset-0 z-[80] bg-ink/62 p-3 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="focus-ring fixed right-4 top-4 z-[90] grid h-11 w-11 place-items-center rounded-full bg-white text-2xl font-black text-ink shadow-lift"
            aria-label="닫기"
          >
            ×
          </button>
          <div className="h-full pt-12">
            <RankingDetail selected={selected} selectedRank={selectedRank} profileTotal={profile.total} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
