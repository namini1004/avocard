"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BenefitCategory, cards, categoryLabels } from "@/data/cards";
import { analyzeCard, defaultProfile, formatWon, SpendingProfile } from "@/lib/calculate";
import { BenefitBar } from "./BenefitBar";

const totalOptions = [
  { label: "월 30만원", value: 300000 },
  { label: "월 50만원", value: 500000 },
  { label: "월 70만원", value: 700000 },
  { label: "월 90만원", value: 900000 },
  { label: "월 120만원", value: 1200000 }
];

const focusOptions: Array<{ label: string; value: "balanced" | BenefitCategory }> = [
  { label: "균형 소비", value: "balanced" },
  { label: "교통", value: "transport" },
  { label: "커피", value: "coffee" },
  { label: "배달", value: "delivery" },
  { label: "주유", value: "fuel" },
  { label: "쇼핑", value: "shopping" },
  { label: "통신", value: "telecom" },
  { label: "OTT", value: "ott" },
  { label: "마트", value: "mart" }
];

const issuers = ["전체", ...Array.from(new Set(cards.map((card) => card.issuer)))];
const cardTypes = [
  { label: "전체", value: "all" },
  { label: "신용", value: "credit" },
  { label: "체크", value: "check" }
];

function buildProfile(total: number, focus: "balanced" | BenefitCategory): SpendingProfile {
  const profile: SpendingProfile = { ...defaultProfile, total };
  const categoryTotal = Object.entries(defaultProfile)
    .filter(([key]) => key !== "total")
    .reduce((sum, [, value]) => sum + value, 0);
  const scale = categoryTotal > 0 ? total / categoryTotal : 1;

  (Object.keys(categoryLabels) as BenefitCategory[]).forEach((category) => {
    profile[category] = Math.round((defaultProfile[category] ?? 0) * scale);
  });

  if (focus !== "balanced") {
    const categories = Object.keys(categoryLabels) as BenefitCategory[];
    const focusedAmount = Math.round(total * 0.28);
    const remaining = Math.max(0, total - focusedAmount);
    const otherCurrentTotal = categories
      .filter((category) => category !== focus)
      .reduce((sum, category) => sum + profile[category], 0);

    profile[focus] = focusedAmount;
    categories
      .filter((category) => category !== focus)
      .forEach((category) => {
        profile[category] = otherCurrentTotal > 0 ? Math.round((profile[category] / otherCurrentTotal) * remaining) : 0;
      });
  }

  const normalizedTotal = (Object.keys(categoryLabels) as BenefitCategory[]).reduce(
    (sum, category) => sum + profile[category],
    0
  );
  profile.etc += total - normalizedTotal;

  return profile;
}

export function CardRankingBoard() {
  const [total, setTotal] = useState(700000);
  const [focus, setFocus] = useState<"balanced" | BenefitCategory>("balanced");
  const [issuer, setIssuer] = useState("전체");
  const [cardType, setCardType] = useState("all");
  const [selectedSlug, setSelectedSlug] = useState(cards[0]?.slug ?? "");

  const profile = useMemo(() => buildProfile(total, focus), [total, focus]);
  const rankings = useMemo(() => {
    return cards
      .filter((card) => issuer === "전체" || card.issuer === issuer)
      .filter((card) => cardType === "all" || card.cardType === cardType)
      .map((card) => analyzeCard(card, profile))
      .sort((a, b) => b.pickingRate - a.pickingRate || b.monthlySaving - a.monthlySaving);
  }, [cardType, issuer, profile]);

  const selected = rankings.find((analysis) => analysis.card.slug === selectedSlug) ?? rankings[0];
  const topFocus = (Object.keys(categoryLabels) as BenefitCategory[])
    .map((category) => ({ category, spend: profile[category] }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 3);

  return (
    <section className="rounded-[2rem] bg-white p-5 shadow-soft md:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-black text-avocado-700">AVOCARD CORE RANKING</p>
          <h2 className="mt-2 text-3xl font-black text-ink">월 사용액 기준 순혜택 랭킹보드</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/60">
            마케팅 할인율이 아니라, 실제 월 사용액에서 받을 수 있는 통합 월 할인한도와 연회비 월할을 반영해 순피킹률을 계산합니다.
          </p>
        </div>
        <div className="rounded-3xl bg-cream px-5 py-4">
          <p className="text-xs font-black text-ink/50">현재 계산식</p>
          <p className="mt-1 text-sm font-black text-ink">카테고리 혜택 - 통합한도 - 월할 연회비 = 순혜택</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
        <div className="rounded-[1.75rem] border border-avocado-900/10 bg-cream p-4">
          <p className="text-sm font-black text-ink">필터</p>
          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-xs font-black text-ink/52">월 사용액</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {totalOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTotal(option.value)}
                    className={`focus-ring rounded-full px-4 py-2 text-sm font-black transition ${
                      total === option.value ? "bg-ink text-white" : "bg-white text-ink hover:bg-avocado-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-black text-ink/52">소비 성향</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {focusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFocus(option.value)}
                    className={`focus-ring rounded-full px-4 py-2 text-sm font-black transition ${
                      focus === option.value ? "bg-avocado-700 text-white" : "bg-white text-ink hover:bg-avocado-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="text-xs font-black text-ink/52">카드사</span>
                <select
                  value={issuer}
                  onChange={(event) => setIssuer(event.target.value)}
                  className="focus-ring mt-2 h-12 w-full rounded-2xl border border-avocado-900/10 bg-white px-4 font-bold"
                >
                  {issuers.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs font-black text-ink/52">카드 유형</span>
                <select
                  value={cardType}
                  onChange={(event) => setCardType(event.target.value)}
                  className="focus-ring mt-2 h-12 w-full rounded-2xl border border-avocado-900/10 bg-white px-4 font-bold"
                >
                  {cardTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-ink p-5 text-white">
          <p className="text-sm font-black text-avocado-200">소비 프로필</p>
          <p className="mt-2 text-4xl font-black">{formatWon(profile.total)}</p>
          <div className="mt-4 grid gap-2">
            {topFocus.map((item) => (
              <div key={item.category} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                <span className="text-sm font-bold text-white/70">{categoryLabels[item.category]}</span>
                <span className="font-black">{formatWon(item.spend)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-avocado-900/10">
        <div className="hidden grid-cols-[72px_1.2fr_0.8fr_0.8fr_0.8fr_0.7fr] bg-cream px-4 py-3 text-xs font-black text-ink/54 md:grid">
          <span>순위</span>
          <span>카드</span>
          <span>통합 월 한도</span>
          <span>월할 연회비</span>
          <span>순혜택</span>
          <span>순피킹률</span>
        </div>
        <div className="divide-y divide-avocado-900/10">
          {rankings.map((analysis, index) => (
            <button
              key={analysis.card.slug}
              type="button"
              onClick={() => setSelectedSlug(analysis.card.slug)}
              className={`grid w-full gap-3 px-4 py-4 text-left transition md:grid-cols-[72px_1.2fr_0.8fr_0.8fr_0.8fr_0.7fr] md:items-center ${
                selected?.card.slug === analysis.card.slug ? "bg-avocado-50" : "bg-white hover:bg-cream"
              }`}
            >
              <span className="w-fit rounded-full bg-ink px-3 py-1 text-sm font-black text-white">#{index + 1}</span>
              <span>
                <span className="block text-lg font-black text-ink">{analysis.card.name}</span>
                <span className="mt-1 block text-xs font-bold text-ink/50">
                  {analysis.card.issuer} · 전월실적 {formatWon(analysis.card.previousSpend)}
                </span>
              </span>
              <span>
                <span className="block text-xs font-bold text-ink/45 md:hidden">통합 월 한도</span>
                <span className="font-black text-ink">{formatWon(analysis.effectiveMonthlyCap)}</span>
              </span>
              <span>
                <span className="block text-xs font-bold text-ink/45 md:hidden">월할 연회비</span>
                <span className="font-black text-ink">{formatWon(analysis.monthlyFee)}</span>
              </span>
              <span>
                <span className="block text-xs font-bold text-ink/45 md:hidden">순혜택</span>
                <span className="font-black text-avocado-700">{formatWon(analysis.monthlySaving)}</span>
              </span>
              <span>
                <span className="block text-xs font-bold text-ink/45 md:hidden">순피킹률</span>
                <span className="font-black text-ink">{analysis.pickingRate.toFixed(2)}%</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <article className="rounded-[1.75rem] border border-avocado-900/10 p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-black text-avocado-700">선택 카드 분석</p>
                <h3 className="mt-2 text-3xl font-black text-ink">{selected.card.name}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{selected.reason}</p>
              </div>
              <Link
                href={`/cards/${selected.card.slug}`}
                className="focus-ring w-fit rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
              >
                상세 보기
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-cream p-4">
                <p className="text-xs font-bold text-ink/50">혜택 합계</p>
                <p className="mt-1 text-xl font-black text-ink">{formatWon(selected.matchedBenefit)}</p>
              </div>
              <div className="rounded-2xl bg-cream p-4">
                <p className="text-xs font-bold text-ink/50">통합한도 적용 후</p>
                <p className="mt-1 text-xl font-black text-ink">{formatWon(selected.grossMonthlySaving)}</p>
              </div>
              <div className="rounded-2xl bg-cream p-4">
                <p className="text-xs font-bold text-ink/50">월할 연회비</p>
                <p className="mt-1 text-xl font-black text-ink">-{formatWon(selected.monthlyFee)}</p>
              </div>
              <div className="rounded-2xl bg-avocado-100 p-4">
                <p className="text-xs font-bold text-ink/50">최종 순혜택</p>
                <p className="mt-1 text-xl font-black text-avocado-800">{formatWon(selected.monthlySaving)}</p>
              </div>
            </div>
          </article>

          <article className="rounded-[1.75rem] border border-avocado-900/10 p-5">
            <h3 className="text-xl font-black text-ink">혜택별 실제 적용액</h3>
            <div className="mt-5 space-y-5">
              {selected.ruleSavings.map((rule) => (
                <BenefitBar
                  key={rule.id}
                  label={`${rule.label} · ${formatWon(rule.spend)} 사용 · ${(rule.rate * 100).toFixed(0)}%`}
                  value={rule.saving}
                  max={rule.cap}
                />
              ))}
            </div>
          </article>
        </div>
      ) : (
        <div className="mt-6 rounded-[1.75rem] bg-cream p-6 text-center font-black text-ink/60">
          조건에 맞는 카드가 없습니다.
        </div>
      )}
    </section>
  );
}
