"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { verifiedCards } from "@/data/verified-cards";
import {
  type BenefitCategory,
  type VerifiedBenefitRule,
  type VerifiedCard
} from "@/data/verified-card-types";
import {
  analyzeVerifiedCard,
  createRankingProfile,
  formatPercent,
  formatWon,
  maximumScenarioRange,
  rankMaximumVerifiedCards,
  rankVerifiedCards,
  type MaximumCardScenario,
  type MonthlyCalculation,
  type VerifiedCardAnalysis
} from "@/lib/calculate-v2";

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

type RankingMode = "maximum" | "personal";

function rewardLabel(rule: VerifiedBenefitRule) {
  return rule.rewardBands
    .map((band) => {
      const condition =
        band.minTransactionAmount !== undefined
          ? `건당 ${formatWon(band.minTransactionAmount)} 이상 `
          : "";
      if (band.formula.kind === "rate") {
        return `${condition}${Number((band.formula.rate * 100).toFixed(2))}%`;
      }
      if (band.formula.kind === "fixed") {
        return `${condition}${formatWon(band.formula.amount)}`;
      }
      return `리터당 ${formatWon(band.formula.wonPerLiter)}`;
    })
    .join(" · ");
}

function capLabel(calculation: MonthlyCalculation, rule: VerifiedBenefitRule) {
  const saving = calculation.ruleSavings.find((item) => item.id === rule.id);
  if (saving?.effectiveCap !== null && saving?.effectiveCap !== undefined) {
    return formatWon(saving.effectiveCap);
  }
  if (rule.capGroupId) return "구간 통합한도";
  return "한도 없음";
}

function DetailMetric({
  label,
  value,
  tone = "cream"
}: {
  label: string;
  value: string;
  tone?: "cream" | "green" | "yellow";
}) {
  const toneClass =
    tone === "green"
      ? "bg-avocado-100 text-avocado-800"
      : tone === "yellow"
        ? "bg-[#fff7d6] text-ink"
        : "bg-cream text-ink";

  return (
    <div className={`rounded-2xl p-4 ${toneClass}`}>
      <p className="whitespace-nowrap text-xs font-bold opacity-55">{label}</p>
      <p className="mt-1 whitespace-nowrap text-lg font-black">{value}</p>
    </div>
  );
}

function TierDetails({
  card,
  calculation
}: {
  card: VerifiedCard;
  calculation: MonthlyCalculation;
}) {
  return (
    <section className="mt-5 rounded-3xl border border-avocado-900/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="whitespace-nowrap text-lg font-black text-ink">실적 구간과 한도</h4>
        <span className="whitespace-nowrap text-xs font-black text-avocado-700">
          현재 {calculation.appliedTier?.label ?? "적용 구간 없음"}
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        {card.capTiers.map((tier) => {
          const active = calculation.appliedTier?.id === tier.id;
          const limits = [
            tier.totalCap !== undefined ? `통합 ${formatWon(tier.totalCap)}` : "",
            ...Object.entries(tier.groupCaps ?? {}).map(([, cap]) => formatWon(cap))
          ].filter(Boolean);
          return (
            <div
              key={tier.id}
              className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm ${
                active ? "bg-avocado-100 text-avocado-900" : "bg-cream text-ink/70"
              }`}
            >
              <span className="whitespace-nowrap font-black">{tier.label}</span>
              <span className="truncate text-right font-black">
                {limits.length > 0 ? limits.join(" · ") : "한도 없음"}
              </span>
            </div>
          );
        })}
      </div>
      {calculation.activatedBonusLabels.length > 0 ? (
        <p className="mt-3 text-sm font-black text-avocado-700">
          {calculation.activatedBonusLabels.join(", ")} 조건 충족
        </p>
      ) : null}
    </section>
  );
}

function BenefitDetails({
  card,
  calculation
}: {
  card: VerifiedCard;
  calculation: MonthlyCalculation;
}) {
  const appliedRules = card.benefitRules.filter((rule) =>
    calculation.ruleSavings.some((saving) => saving.id === rule.id && saving.saving > 0)
  );

  return (
    <section className="mt-5">
      <h4 className="whitespace-nowrap text-lg font-black text-ink">혜택별 계산 근거</h4>
      <div className="mt-3 grid gap-3">
        {appliedRules.map((rule) => {
          const applied = calculation.ruleSavings.find((item) => item.id === rule.id);
          return (
            <div key={rule.id} className="rounded-3xl border border-avocado-900/10 p-4">
              <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-start">
                <div>
                  <p className="font-black text-ink">{rule.label}</p>
                  <p className="mt-1 keep-all text-sm leading-6 text-ink/58">{rule.note}</p>
                  <p className="mt-2 keep-all text-xs font-bold leading-5 text-ink/45">
                    {rewardLabel(rule)} · {rule.merchantScope.join(", ")}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center xl:min-w-[330px]">
                  <div className="rounded-2xl bg-cream px-2 py-2">
                    <p className="whitespace-nowrap text-[11px] font-black text-ink/45">혜택 사용액</p>
                    <p className="whitespace-nowrap text-sm font-black text-ink">
                      {formatWon(applied?.spend ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-cream px-2 py-2">
                    <p className="whitespace-nowrap text-[11px] font-black text-ink/45">적용 한도</p>
                    <p className="whitespace-nowrap text-sm font-black text-ink">
                      {capLabel(calculation, rule)}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-avocado-100 px-2 py-2">
                    <p className="whitespace-nowrap text-[11px] font-black text-ink/45">예상 혜택</p>
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
    </section>
  );
}

function DetailActions({ card }: { card: VerifiedCard }) {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      <Link
        href={`/cards/${card.slug}`}
        className="focus-ring whitespace-nowrap rounded-full bg-ink px-5 py-3 text-center text-sm font-black text-white"
      >
        상세 분석 보기
      </Link>
      <a
        href={card.verification.sources[0].url}
        target="_blank"
        rel="noreferrer"
        className="focus-ring whitespace-nowrap rounded-full bg-cream px-5 py-3 text-center text-sm font-black text-ink"
      >
        공식 출처 보기
      </a>
    </div>
  );
}

function MaximumRankingDetail({
  scenario,
  rank
}: {
  scenario: MaximumCardScenario;
  rank: number;
}) {
  const { card, calculation } = scenario;

  return (
    <article className="h-full overflow-auto rounded-[1.75rem] border border-avocado-900/10 bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="whitespace-nowrap text-sm font-black text-avocado-700">#{rank} 최대 분석</p>
          <span className="whitespace-nowrap rounded-full bg-avocado-100 px-3 py-1 text-[11px] font-black text-avocado-800">
            공식 검증
          </span>
          <span className="whitespace-nowrap rounded-full bg-cream px-3 py-1 text-[11px] font-black text-ink/60">
            {scenario.difficultyLabel}
          </span>
        </div>
        <span className="w-fit whitespace-nowrap rounded-full bg-avocado-700 px-4 py-2 text-sm font-black text-white">
          {formatPercent(scenario.pickingRate)}
        </span>
      </div>

      <h3 className="mt-3 text-2xl font-black leading-tight text-ink sm:text-3xl">{card.name}</h3>
      <p className="mt-3 keep-all text-sm leading-6 text-ink/62">{scenario.reason}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <DetailMetric label="최적 월 사용액" value={formatWon(scenario.totalSpend)} tone="yellow" />
        <DetailMetric label="월 순혜택" value={formatWon(calculation.netBenefit)} tone="green" />
        <DetailMetric label="다음 달 인정실적" value={formatWon(scenario.nextQualifyingSpend)} />
        <DetailMetric label="연회비 월할" value={`-${formatWon(calculation.monthlyFee)}`} />
      </div>

      <section className="mt-5 rounded-3xl bg-avocado-100 p-5">
        <p className="text-xs font-black text-avocado-800/65">최대 피킹률 공식</p>
        <p className="mt-2 text-[13px] font-black leading-6 text-avocado-900 sm:text-lg">
          ({formatWon(calculation.grossBenefit)} - {formatWon(calculation.monthlyFee)}) ÷{" "}
          {formatWon(calculation.currentSpend)} = {formatPercent(calculation.pickingRate)}
        </p>
        <p className="mt-3 keep-all text-xs leading-5 text-avocado-900/65">
          실적 충족용 일반 결제까지 실제 사용액에 포함했습니다.
        </p>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="whitespace-nowrap text-lg font-black text-ink">최대값을 만드는 소비 조합</h4>
          <span className="whitespace-nowrap text-xs font-bold text-ink/45">1천원 단위</span>
        </div>
        <div className="mt-3 space-y-3">
          {scenario.allocation.map((item) => (
            <div key={item.category}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-black text-ink">{item.label}</span>
                <span className="whitespace-nowrap font-black text-ink/65">{formatWon(item.amount)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-cream">
                <div
                  className="h-full rounded-full bg-avocado-600"
                  style={{ width: `${Math.max(2, item.share * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-seed/25 bg-[#fff9e8] p-5">
        <h4 className="whitespace-nowrap text-lg font-black text-ink">반드시 지킬 조건</h4>
        <p className="mt-3 keep-all text-sm leading-6 text-ink/67">{card.performance.description}</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/62">
          {card.cautions.slice(0, 3).map((caution) => (
            <li key={caution}>· {caution}</li>
          ))}
        </ul>
      </section>

      <TierDetails card={card} calculation={calculation} />
      <BenefitDetails card={card} calculation={calculation} />

      <details className="mt-5 rounded-3xl bg-cream p-5">
        <summary className="cursor-pointer whitespace-nowrap font-black text-ink">최대값 계산 기준</summary>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/62">
          {scenario.assumptionSummary.map((assumption) => (
            <li key={assumption}>· {assumption}</li>
          ))}
        </ul>
      </details>

      <DetailActions card={card} />
    </article>
  );
}

function PersonalRankingDetail({
  analysis,
  rank
}: {
  analysis: VerifiedCardAnalysis;
  rank: number;
}) {
  const { card, sustainable, potential } = analysis;
  const performanceGap = Math.max(0, card.performance.minimumSpend - analysis.nextQualifyingSpend);

  return (
    <article className="h-full overflow-auto rounded-[1.75rem] border border-avocado-900/10 bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="whitespace-nowrap text-sm font-black text-avocado-700">#{rank} 내 소비 분석</p>
          <span className="whitespace-nowrap rounded-full bg-avocado-100 px-3 py-1 text-[11px] font-black text-avocado-800">
            공식 검증
          </span>
        </div>
        <span className="w-fit whitespace-nowrap rounded-full bg-avocado-100 px-4 py-2 text-sm font-black text-avocado-800">
          {formatPercent(analysis.pickingRate)}
        </span>
      </div>

      <h3 className="mt-3 text-2xl font-black leading-tight text-ink sm:text-3xl">{card.name}</h3>
      <p className="mt-3 keep-all text-sm leading-6 text-ink/62">{analysis.reason}</p>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <DetailMetric label="지속 순혜택" value={formatWon(sustainable.netBenefit)} tone="green" />
        <DetailMetric label="전월 충족 시" value={formatWon(potential.netBenefit)} />
        <DetailMetric label="다음 달 인정실적" value={formatWon(analysis.nextQualifyingSpend)} />
        <DetailMetric label="연회비 월할" value={`-${formatWon(sustainable.monthlyFee)}`} />
      </div>

      <section className="mt-5 rounded-3xl bg-avocado-100 p-5">
        <p className="text-xs font-black text-avocado-800/65">내 소비 피킹률 공식</p>
        <p className="mt-2 text-[13px] font-black leading-6 text-avocado-900 sm:text-lg">
          ({formatWon(sustainable.grossBenefit)} - {formatWon(sustainable.monthlyFee)}) ÷{" "}
          {formatWon(sustainable.currentSpend)} = {formatPercent(sustainable.pickingRate)}
        </p>
      </section>

      {performanceGap > 0 ? (
        <section className="mt-4 rounded-3xl border border-seed/30 bg-[#fff8df] p-5">
          <p className="font-black text-ink">다음 달 실적 경고</p>
          <p className="mt-2 keep-all text-sm leading-6 text-ink/65">
            같은 소비를 반복하면 최소 실적보다 {formatWon(performanceGap)} 부족합니다. 할인 대상 매출의
            실적 제외·일부 반영 조건을 계산한 결과입니다.
          </p>
        </section>
      ) : null}

      <TierDetails card={card} calculation={sustainable} />
      <BenefitDetails card={card} calculation={sustainable} />

      <details className="mt-5 rounded-3xl bg-cream p-5">
        <summary className="cursor-pointer whitespace-nowrap font-black text-ink">대표 소비 가정 보기</summary>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/62">
          {analysis.assumptionSummary.map((assumption) => (
            <li key={assumption}>· {assumption}</li>
          ))}
        </ul>
      </details>

      <DetailActions card={card} />
    </article>
  );
}

export function CardRankingBoard() {
  const [mode, setMode] = useState<RankingMode>("maximum");
  const [total, setTotal] = useState(700000);
  const [focus, setFocus] = useState<"balanced" | BenefitCategory>("balanced");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const maximumRankings = useMemo(() => rankMaximumVerifiedCards(verifiedCards), []);
  const profile = useMemo(() => createRankingProfile(total, focus), [total, focus]);
  const personalRankings = useMemo(() => rankVerifiedCards(verifiedCards, profile), [profile]);
  const activeSlugs =
    mode === "maximum"
      ? maximumRankings.map((scenario) => scenario.card.slug)
      : personalRankings.map((analysis) => analysis.card.slug);
  const maximumSelected =
    maximumRankings.find((scenario) => scenario.card.slug === selectedSlug) ??
    maximumRankings[0];
  const personalSelected =
    personalRankings.find((analysis) => analysis.card.slug === selectedSlug) ??
    personalRankings[0] ??
    analyzeVerifiedCard(verifiedCards[0], profile);
  const selectedCardSlug =
    mode === "maximum" ? maximumSelected.card.slug : personalSelected.card.slug;
  const selectedRank =
    mode === "maximum"
      ? maximumRankings.findIndex((scenario) => scenario.card.slug === selectedCardSlug) + 1
      : personalRankings.findIndex((analysis) => analysis.card.slug === selectedCardSlug) + 1;

  useEffect(() => {
    if (!activeSlugs.includes(selectedSlug)) {
      setSelectedSlug(activeSlugs[0] ?? "");
    }
  }, [activeSlugs, selectedSlug]);

  function selectCard(slug: string) {
    setSelectedSlug(slug);
    setIsModalOpen(true);
  }

  function changeMode(nextMode: RankingMode) {
    setMode(nextMode);
    setIsModalOpen(false);
  }

  return (
    <section className="rounded-[2rem] bg-white p-4 shadow-soft md:p-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-3xl font-black leading-tight text-ink md:text-4xl">
            {mode === "maximum" ? "최대 피킹률 카드 순위" : "내 소비 기준 피킹률 순위"}
          </h2>
          <p className="mt-3 max-w-3xl keep-all text-sm leading-6 text-ink/62 md:text-base md:leading-7">
            {mode === "maximum"
              ? `월 ${maximumScenarioRange.min / 10000}만~${maximumScenarioRange.max / 10000}만원에서 모든 조건을 지키고 반복할 수 있는 최적 소비 조합을 찾았습니다.`
              : "선택한 월 사용액과 소비 성향을 같은 방식으로 반복했을 때의 순혜택으로 정렬합니다."}
          </p>
        </div>
        <Link
          href="/sources"
          className="w-fit whitespace-nowrap text-sm font-black text-avocado-700 underline decoration-avocado-300 underline-offset-4"
        >
          검증 기준 보기
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-y border-avocado-900/10 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 rounded-full bg-cream p-1">
          <button
            type="button"
            onClick={() => changeMode("maximum")}
            className={`focus-ring whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-black transition sm:text-sm ${
              mode === "maximum" ? "bg-ink text-white" : "text-ink/58 hover:text-ink"
            }`}
          >
            최대 피킹률
          </button>
          <button
            type="button"
            onClick={() => changeMode("personal")}
            className={`focus-ring whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-black transition sm:text-sm ${
              mode === "personal" ? "bg-ink text-white" : "text-ink/58 hover:text-ink"
            }`}
          >
            월 사용액별
          </button>
        </div>
        <Link
          href="/recommend"
          className="focus-ring whitespace-nowrap rounded-full bg-avocado-700 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-avocado-800"
        >
          내 소비로 카드 찾기
        </Link>
      </div>

      {mode === "personal" ? (
        <div className="mt-4 rounded-[1.5rem] bg-cream p-3 md:p-4">
          <div className="grid gap-3 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="min-w-0">
              <p className="whitespace-nowrap text-xs font-black text-ink/54">월 카드 사용액(만원)</p>
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {totalOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTotal(option.value)}
                    className={`focus-ring min-w-10 flex-1 whitespace-nowrap rounded-full px-3 py-2 text-xs font-black transition sm:text-sm ${
                      total === option.value ? "bg-ink text-white" : "bg-white text-ink hover:bg-avocado-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-xs font-black text-ink/54">소비 성향</p>
              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {focusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFocus(option.value)}
                    className={`focus-ring min-w-fit whitespace-nowrap rounded-full px-3 py-2 text-xs font-black transition sm:text-sm ${
                      focus === option.value
                        ? "bg-avocado-700 text-white"
                        : "bg-white text-ink hover:bg-avocado-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.74fr_1.26fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-avocado-900/10 bg-white">
          <div className="max-h-[760px] divide-y divide-avocado-900/10 overflow-auto">
            {mode === "maximum"
              ? maximumRankings.map((scenario, index) => (
                  <button
                    key={scenario.card.slug}
                    type="button"
                    onClick={() => selectCard(scenario.card.slug)}
                    className={`grid w-full grid-cols-[46px_1fr_74px] items-center gap-2 px-3 py-4 text-left transition ${
                      selectedCardSlug === scenario.card.slug ? "bg-avocado-50" : "hover:bg-cream"
                    }`}
                  >
                    <span className="w-fit rounded-full bg-cream px-2.5 py-1 text-xs font-black text-ink">
                      #{index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-ink md:text-base">
                        {scenario.card.name}
                      </span>
                      <span className="mt-1 block truncate text-xs font-bold text-ink/48">
                        최적 {formatWon(scenario.totalSpend)} · 순혜택{" "}
                        {formatWon(scenario.calculation.netBenefit)}
                      </span>
                      <span className="mt-1 block truncate text-[11px] font-bold text-avocado-700">
                        {scenario.keyBenefitLabels.join(" · ") || "기본 혜택"} · {scenario.difficultyLabel}
                      </span>
                    </span>
                    <span className="text-right text-base font-black text-avocado-700 md:text-lg">
                      {formatPercent(scenario.pickingRate)}
                    </span>
                  </button>
                ))
              : personalRankings.map((analysis, index) => (
                  <button
                    key={analysis.card.slug}
                    type="button"
                    onClick={() => selectCard(analysis.card.slug)}
                    className={`grid w-full grid-cols-[46px_1fr_74px] items-center gap-2 px-3 py-4 text-left transition ${
                      selectedCardSlug === analysis.card.slug ? "bg-avocado-50" : "hover:bg-cream"
                    }`}
                  >
                    <span className="w-fit rounded-full bg-cream px-2.5 py-1 text-xs font-black text-ink">
                      #{index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-ink md:text-base">
                        {analysis.card.name}
                      </span>
                      <span className="mt-1 block truncate text-xs font-bold text-ink/48">
                        순혜택 {formatWon(analysis.sustainable.netBenefit)} · 인정실적{" "}
                        {formatWon(analysis.nextQualifyingSpend)}
                      </span>
                    </span>
                    <span className="text-right text-base font-black text-avocado-700 md:text-lg">
                      {formatPercent(analysis.pickingRate)}
                    </span>
                  </button>
                ))}
          </div>
        </div>

        <div className="hidden lg:block">
          {mode === "maximum" ? (
            <MaximumRankingDetail scenario={maximumSelected} rank={Math.max(1, selectedRank)} />
          ) : (
            <PersonalRankingDetail analysis={personalSelected} rank={Math.max(1, selectedRank)} />
          )}
        </div>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-[80] bg-ink/62 p-3 backdrop-blur-sm lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="카드 피킹률 상세"
        >
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="focus-ring fixed right-4 top-4 z-[90] grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-black text-ink shadow-lift"
            aria-label="상세 닫기"
          >
            ×
          </button>
          <div className="h-full pt-12">
            {mode === "maximum" ? (
              <MaximumRankingDetail scenario={maximumSelected} rank={Math.max(1, selectedRank)} />
            ) : (
              <PersonalRankingDetail analysis={personalSelected} rank={Math.max(1, selectedRank)} />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
