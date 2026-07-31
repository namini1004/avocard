import Link from "next/link";
import { Header } from "@/components/Header";
import { RecommendationCard } from "@/components/RecommendationCard";
import { verifiedCards } from "@/data/verified-cards";
import {
  benefitCategories,
  categoryLabels,
  type SpendingProfile
} from "@/data/verified-card-types";
import { defaultProfile, rankVerifiedCards } from "@/lib/calculate-v2";

function stringParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
  fallback: string
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function numberParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
  fallback: number
) {
  const parsed = Number(stringParam(searchParams, key, String(fallback)));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

export default async function ResultsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const profile = benefitCategories.reduce(
    (acc, field) => ({
      ...acc,
      [field]: numberParam(params, field, defaultProfile[field])
    }),
    { total: numberParam(params, "total", defaultProfile.total) } as SpendingProfile
  );
  const issuer = stringParam(params, "issuer", "상관없음");
  const cardType = stringParam(params, "type", "신용");
  const feeSensitivity = stringParam(params, "fee", "보통");
  const load = stringParam(params, "load", "60만원까지");
  const maxPerformance = Number(load.replace(/[^0-9]/g, "")) * 10000 || 600000;
  const maxAnnualFee =
    feeSensitivity === "높음" ? 15000 : feeSensitivity === "보통" ? 30000 : Number.POSITIVE_INFINITY;

  const filtered = verifiedCards.filter((card) => {
    const issuerMatches = issuer === "상관없음" || card.issuer === issuer;
    const typeMatches =
      cardType === "상관없음" ||
      (cardType === "신용" && card.cardType === "credit") ||
      (cardType === "체크" && card.cardType === "check");
    return (
      issuerMatches &&
      typeMatches &&
      card.annualFee <= maxAnnualFee &&
      card.performance.minimumSpend <= maxPerformance
    );
  });
  const usedFallback = filtered.length === 0;
  const results = rankVerifiedCards(usedFallback ? verifiedCards : filtered, profile);
  const top = results[0];
  const meaningfulFields = benefitCategories
    .map((field) => ({ field, value: profile[field] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="rounded-[2.5rem] bg-ink p-7 text-white shadow-lift md:p-10">
          <p className="whitespace-nowrap text-sm font-black text-avocado-200">공식 검증 카드 추천</p>
          <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
            같은 소비를 반복해도 혜택이 유지되는 카드
          </h1>
          <p className="mt-5 max-w-3xl keep-all text-lg leading-8 text-white/72">
            {meaningfulFields.map((item) => categoryLabels[item.field]).join(", ")} 비중과 전월 인정실적을 함께
            계산했습니다. {top.card.name}은 현재 조건에서 지속 순피킹률이 가장 높습니다.
          </p>
          {usedFallback ? (
            <p className="mt-4 w-fit rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/75">
              선택 조건에 맞는 검증 카드가 없어 카드사·유형 조건을 풀어 다시 계산했습니다.
            </p>
          ) : null}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {results.slice(0, 3).map((analysis, index) => (
              <RecommendationCard key={analysis.card.slug} analysis={analysis} rank={index + 1} />
            ))}
          </div>
          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-ink">추천에서 본 것</h2>
            <p className="mt-4 keep-all leading-7 text-ink/64">
              카테고리 할인율뿐 아니라 건당 최소금액, 영역·통합 한도, 할인 대상 사용액의 다음 달 실적
              반영률까지 계산했습니다.
            </p>
            <div className="mt-6 rounded-3xl bg-cream p-5">
              <p className="whitespace-nowrap font-black text-ink">두 숫자를 비교하세요</p>
              <p className="mt-2 keep-all text-sm leading-6 text-ink/64">
                전월을 이미 채웠을 때의 잠재 피킹률보다 지속 피킹률이 크게 낮다면, 혜택을 받는 소비가 다음 달
                실적에 적게 잡히는 카드입니다.
              </p>
            </div>
            <Link
              href="/compare"
              className="focus-ring mt-6 inline-flex w-full justify-center rounded-full bg-avocado-700 px-5 py-4 text-sm font-black text-white"
            >
              검증 카드 한눈에 비교
            </Link>
          </aside>
        </section>
      </main>
    </>
  );
}
