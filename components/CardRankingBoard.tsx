"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BenefitCategory, cards, categoryLabels } from "@/data/cards";
import { cardCandidates, candidateSources, type CardCandidate } from "@/data/card-candidates";
import { CardAnalysis, analyzeCard, defaultProfile, formatWon, SpendingProfile } from "@/lib/calculate";

const totalOptions = [
  { label: "30", value: 300000 },
  { label: "40", value: 400000 },
  { label: "50", value: 500000 },
  { label: "70", value: 700000 },
  { label: "100", value: 1000000 }
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

const activeCards = cards.filter((card) => card.status === "active");
const activeCardSlugs = new Set(activeCards.map((card) => card.slug));
const pendingCandidates = cardCandidates.filter((candidate) => !activeCardSlugs.has(candidate.slug));
const candidateSourceMap = new Map(candidateSources.map((source) => [source.id, source]));

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

function CandidateDetail({ candidate }: { candidate: CardCandidate }) {
  const sources = candidate.sourceRefs.map((ref) => candidateSourceMap.get(ref)).filter(Boolean);

  return (
    <article className="h-full overflow-auto rounded-[1.75rem] border border-avocado-900/10 bg-white p-5 md:p-6">
      <p className="whitespace-nowrap text-sm font-black text-avocado-700">검수 대기 카드</p>
      <h3 className="mt-2 text-3xl font-black leading-tight text-ink">{candidate.name}</h3>
      <p className="mt-3 keep-all text-sm leading-6 text-ink/62">
        이 카드는 후보 풀에 등록되어 있지만, 아직 상품설명서 기준의 연회비, 전월실적, 통합 월 한도,
        실적 제외 항목 검수가 끝나지 않았습니다. 피킹률은 확정 데이터가 들어간 뒤 공개합니다.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-cream p-4">
          <p className="whitespace-nowrap text-xs font-bold text-ink/50">카드사</p>
          <p className="mt-1 text-lg font-black text-ink">{candidate.issuer}</p>
        </div>
        <div className="rounded-2xl bg-cream p-4">
          <p className="whitespace-nowrap text-xs font-bold text-ink/50">카드 유형</p>
          <p className="mt-1 text-lg font-black text-ink">{candidate.cardType === "credit" ? "신용" : "체크"}</p>
        </div>
        <div className="rounded-2xl bg-avocado-100 p-4">
          <p className="whitespace-nowrap text-xs font-bold text-ink/50">피킹률</p>
          <p className="mt-1 text-lg font-black text-avocado-800">계산 대기</p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl bg-ink p-5 text-white">
        <h4 className="whitespace-nowrap text-lg font-black">검수해야 할 핵심 조건</h4>
        <p className="mt-3 keep-all text-sm leading-7 text-white/74">
          통합 할인한도, 영역별 한도, 전월실적 제외 항목, 할인받은 이용금액의 다음 달 실적 포함 여부를 확인한 뒤
          랭킹 계산에 반영합니다.
        </p>
      </div>

      <div className="mt-5">
        <h4 className="whitespace-nowrap text-lg font-black text-ink">연결된 출처</h4>
        <div className="mt-3 grid gap-3">
          {sources.map((source) =>
            source ? (
              <a
                key={source.id}
                href={source.url}
                className="rounded-3xl border border-avocado-900/10 p-4 transition hover:border-avocado-500"
              >
                <p className="font-black text-ink">{source.title}</p>
                <p className="mt-2 break-all text-xs font-bold text-avocado-700">{source.url}</p>
              </a>
            ) : null
          )}
        </div>
      </div>
    </article>
  );
}

function RankingDetail({
  selected,
  selectedRank,
  onClose
}: {
  selected: CardAnalysis;
  selectedRank: number;
  onClose?: () => void;
}) {
  return (
    <article className="h-full overflow-auto rounded-[1.75rem] border border-avocado-900/10 bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="whitespace-nowrap text-sm font-black text-avocado-700">#{selectedRank} 분석 결과</p>
          <h3 className="mt-2 text-3xl font-black leading-tight text-ink">{selected.card.name}</h3>
          <p className="mt-3 keep-all text-sm leading-6 text-ink/62">{selected.card.summary}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cream text-xl font-black text-ink"
            aria-label="닫기"
          >
            ×
          </button>
        ) : (
          <span className="w-fit whitespace-nowrap rounded-full bg-avocado-100 px-4 py-2 text-sm font-black text-avocado-800">
            {selected.pickingRate.toFixed(2)}%
          </span>
        )}
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
                  <div className="grid grid-cols-4 gap-2 text-center md:min-w-[320px]">
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
                    <div className="rounded-2xl bg-cream px-3 py-2">
                      <p className="whitespace-nowrap text-[11px] font-black text-ink/45">실적반영</p>
                      <p className="whitespace-nowrap text-sm font-black text-ink">
                        {rule.discountedSpendCountsForPerformance === "included"
                          ? "포함"
                          : rule.discountedSpendCountsForPerformance === "excluded"
                            ? "제외"
                            : "확인중"}
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
  );
}

export function CardRankingBoard() {
  const [total, setTotal] = useState(700000);
  const [focus, setFocus] = useState<"balanced" | BenefitCategory>("balanced");
  const [selectedSlug, setSelectedSlug] = useState(activeCards[0]?.slug ?? "");
  const [selectedCandidateSlug, setSelectedCandidateSlug] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const profile = useMemo(() => buildProfile(total, focus), [total, focus]);
  const rankings = useMemo(() => {
    return activeCards
      .map((card) => analyzeCard(card, profile))
      .sort((a, b) => b.pickingRate - a.pickingRate || b.monthlySaving - a.monthlySaving);
  }, [profile]);

  const selected = rankings.find((analysis) => analysis.card.slug === selectedSlug) ?? rankings[0];
  const selectedRank = rankings.findIndex((analysis) => analysis.card.slug === selected?.card.slug) + 1;
  const selectedCandidate = pendingCandidates.find((candidate) => candidate.slug === selectedCandidateSlug);

  function selectCard(slug: string) {
    setSelectedSlug(slug);
    setSelectedCandidateSlug("");
    setIsModalOpen(true);
  }

  function selectCandidate(slug: string) {
    setSelectedCandidateSlug(slug);
    setIsModalOpen(true);
  }

  return (
    <section className="rounded-[2rem] bg-white p-4 shadow-soft md:p-7">
      <div>
        <h2 className="text-3xl font-black leading-tight text-ink md:text-4xl">인기카드 피킹률순위</h2>
        <p className="mt-3 max-w-3xl keep-all text-sm leading-6 text-ink/62 md:text-base md:leading-7">
          발급 가능한 카드만 대상으로 월 사용액, 전월실적, 통합 월 한도, 연회비 월할액을 반영해 순혜택 기준으로 정렬합니다.
        </p>
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-cream p-3 md:rounded-[1.75rem] md:p-4">
        <div className="grid gap-3 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="whitespace-nowrap text-xs font-black text-ink/54">월카드사용액(만원)</p>
            <div className="mt-2 grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
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
            <p className="whitespace-nowrap text-xs font-black text-ink/54">소비성향</p>
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
                    {analysis.card.issuer} · {analysis.card.cardType === "credit" ? "신용" : "체크"}
                  </span>
                </span>
                <span className="text-right text-base font-black text-avocado-700 md:text-lg">
                  {analysis.pickingRate.toFixed(2)}%
                </span>
              </button>
            ))}
            {pendingCandidates.map((candidate, index) => (
              <button
                key={candidate.slug}
                type="button"
                onClick={() => selectCandidate(candidate.slug)}
                className={`grid w-full grid-cols-[58px_1fr_84px] items-center gap-2 px-3 py-4 text-left transition ${
                  selectedCandidateSlug === candidate.slug ? "bg-avocado-50" : "hover:bg-cream"
                }`}
              >
                <span className="w-fit rounded-full bg-cream px-2.5 py-1 text-xs font-black text-ink">
                  #{rankings.length + index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-ink md:text-base">{candidate.name}</span>
                  <span className="mt-1 block truncate text-xs font-bold text-ink/48">
                    {candidate.issuer} · {candidate.cardType === "credit" ? "신용" : "체크"} · 검수 대기
                  </span>
                </span>
                <span className="text-right text-xs font-black text-ink/45">계산 대기</span>
              </button>
            ))}
          </div>
        </div>

        {selectedCandidate ? (
          <div className="hidden lg:block">
            <CandidateDetail candidate={selectedCandidate} />
          </div>
        ) : selected ? (
          <div className="hidden lg:block">
            <RankingDetail selected={selected} selectedRank={selectedRank} />
          </div>
        ) : (
          <div className="rounded-[1.75rem] bg-cream p-6 text-center font-black text-ink/60">
            조건에 맞는 카드가 없습니다.
          </div>
        )}
      </div>

      {isModalOpen && (selectedCandidate || selected) ? (
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
            {selectedCandidate ? (
              <CandidateDetail candidate={selectedCandidate} />
            ) : (
              <RankingDetail selected={selected} selectedRank={selectedRank} />
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
