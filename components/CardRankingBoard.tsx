"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BenefitCategory, cards, categoryLabels } from "@/data/cards";
import { analyzeCard, defaultProfile, formatWon, SpendingProfile } from "@/lib/calculate";

const totalOptions = [
  { label: "월 30만원", value: 300000 },
  { label: "월 50만원", value: 500000 },
  { label: "월 70만원", value: 700000 },
  { label: "월 90만원", value: 900000 },
  { label: "월 120만원", value: 1200000 }
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

function buildProfile(total: number, focus: "balanced" | BenefitCategory): SpendingProfile {
  const profile: SpendingProfile = { ...defaultProfile, total };
  const categories = Object.keys(categoryLabels) as BenefitCategory[];
  const categoryTotal = categories.reduce((sum, category) => sum + (defaultProfile[category] ?? 0), 0);
  const scale = categoryTotal > 0 ? total / categoryTotal : 1;

  categories.forEach((category) => {
    profile[category] = Math.round((defaultProfile[category] ?? 0) * scale);
  });

  if (focus !== "balanced") {
    const focusedAmount = Math.round(total * 0.3);
    const remaining = Math.max(0, total - focusedAmount);
    const otherTotal = categories
      .filter((category) => category !== focus)
      .reduce((sum, category) => sum + profile[category], 0);

    profile[focus] = focusedAmount;
    categories
      .filter((category) => category !== focus)
      .forEach((category) => {
        profile[category] = otherTotal > 0 ? Math.round((profile[category] / otherTotal) * remaining) : 0;
      });
  }

  const normalizedTotal = categories.reduce((sum, category) => sum + profile[category], 0);
  profile.etc += total - normalizedTotal;

  return profile;
}

export function CardRankingBoard() {
  const [total, setTotal] = useState(700000);
  const [focus, setFocus] = useState<"balanced" | BenefitCategory>("balanced");
  const [selectedSlug, setSelectedSlug] = useState(cards[0]?.slug ?? "");

  const profile = useMemo(() => buildProfile(total, focus), [total, focus]);
  const rankings = useMemo(() => {
    return cards
      .map((card) => analyzeCard(card, profile))
      .sort((a, b) => b.pickingRate - a.pickingRate || b.monthlySaving - a.monthlySaving);
  }, [profile]);

  const selected = rankings.find((analysis) => analysis.card.slug === selectedSlug) ?? rankings[0];
  const selectedRank = rankings.findIndex((analysis) => analysis.card.slug === selected?.card.slug) + 1;

  return (
    <section className="rounded-[2rem] bg-white p-4 shadow-soft md:p-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="whitespace-nowrap text-sm font-black text-avocado-700">POPULAR CARD RANKING</p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-ink md:text-4xl">
            인기 카드 50개, 실제 피킹률 순위
          </h2>
          <p className="mt-3 max-w-3xl keep-all text-sm leading-6 text-ink/62">
            마케팅 문구의 할인율이 아니라 월 사용액, 전월실적, 통합 월 한도, 연회비 월할액을 반영해 순혜택 기준으로 정렬합니다.
          </p>
        </div>
        <Link
          href="/recommend"
          className="focus-ring w-fit whitespace-nowrap rounded-full bg-ink px-5 py-3 text-sm font-black text-white"
        >
          나만의 카드 찾기
        </Link>
      </div>

      <div className="mt-6 rounded-[1.75rem] bg-cream p-4">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="whitespace-nowrap text-xs font-black text-ink/54">월 카드 사용액</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {totalOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTotal(option.value)}
                  className={`focus-ring whitespace-nowrap rounded-full px-4 py-2 text-sm font-black transition ${
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
            <div className="mt-2 flex flex-wrap gap-2">
              {focusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFocus(option.value)}
                  className={`focus-ring whitespace-nowrap rounded-full px-4 py-2 text-sm font-black transition ${
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

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="overflow-hidden rounded-[1.75rem] border border-avocado-900/10">
          <div className="grid grid-cols-[58px_1fr_84px] bg-ink px-3 py-3 text-xs font-black text-white/72">
            <span className="whitespace-nowrap">순위</span>
            <span className="whitespace-nowrap">카드명</span>
            <span className="text-right whitespace-nowrap">피킹률</span>
          </div>
          <div className="max-h-[720px] divide-y divide-avocado-900/10 overflow-auto bg-white">
            {rankings.map((analysis, index) => (
              <button
                key={analysis.card.slug}
                type="button"
                onClick={() => setSelectedSlug(analysis.card.slug)}
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
                    {analysis.card.issuer} · {analysis.card.cardType === "credit" ? "신용" : "체크"}
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
          <article className="rounded-[1.75rem] border border-avocado-900/10 bg-white p-5 md:p-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <p className="whitespace-nowrap text-sm font-black text-avocado-700">#{selectedRank} 분석 결과</p>
                <h3 className="mt-2 text-3xl font-black leading-tight text-ink">{selected.card.name}</h3>
                <p className="mt-3 keep-all text-sm leading-6 text-ink/62">{selected.card.summary}</p>
              </div>
              <span className="w-fit whitespace-nowrap rounded-full bg-avocado-100 px-4 py-2 text-sm font-black text-avocado-800">
                {selected.pickingRate.toFixed(2)}%
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-cream p-4">
                <p className="whitespace-nowrap text-xs font-bold text-ink/50">월 사용 조건</p>
                <p className="mt-1 text-lg font-black text-ink">{formatWon(selected.card.previousSpend)}</p>
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

            <div className="mt-5 rounded-3xl bg-ink p-5 text-white">
              <h4 className="whitespace-nowrap text-lg font-black">왜 이 피킹률인가요?</h4>
              <p className="mt-3 keep-all text-sm leading-7 text-white/74">{selected.reason}</p>
            </div>

            <div className="mt-5">
              <h4 className="whitespace-nowrap text-lg font-black text-ink">영역별 지켜야 할 조건</h4>
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
                            최소 조건 {rule.performanceBand} · 적용처 {rule.merchantScope.join(", ")}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center md:min-w-[250px]">
                          <div className="rounded-2xl bg-cream px-3 py-2">
                            <p className="whitespace-nowrap text-[11px] font-black text-ink/45">할인율</p>
                            <p className="whitespace-nowrap text-sm font-black text-ink">
                              {((rule.rate ?? 0) * 100).toFixed(rule.rate && rule.rate < 0.01 ? 1 : 0)}%
                            </p>
                          </div>
                          <div className="rounded-2xl bg-cream px-3 py-2">
                            <p className="whitespace-nowrap text-[11px] font-black text-ink/45">월 한도</p>
                            <p className="whitespace-nowrap text-sm font-black text-ink">{formatWon(rule.monthlyCap)}</p>
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
                공식 출처 보기
              </a>
            </div>
          </article>
        ) : (
          <div className="rounded-[1.75rem] bg-cream p-6 text-center font-black text-ink/60">
            조건에 맞는 카드가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
