import Link from "next/link";
import { Header } from "@/components/Header";
import { RecommendationCard } from "@/components/RecommendationCard";
import { cards, BenefitCategory, categoryLabels } from "@/data/cards";
import { defaultProfile, rankCards, SpendingProfile } from "@/lib/calculate";

const fields: BenefitCategory[] = [
  "transport",
  "taxi",
  "fuel",
  "coffee",
  "convenience",
  "delivery",
  "dining",
  "shopping",
  "mart",
  "telecom",
  "ott",
  "medical",
  "education",
  "travel",
  "etc"
];

function numberParam(searchParams: Record<string, string | string[] | undefined>, key: string, fallback: number) {
  const value = searchParams[key];
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : fallback;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function ResultsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const profile = fields.reduce(
    (acc, field) => ({ ...acc, [field]: numberParam(resolvedSearchParams, field, defaultProfile[field]) }),
    { total: numberParam(resolvedSearchParams, "total", defaultProfile.total) } as SpendingProfile
  );
  const results = rankCards(cards, profile);
  const top = results[0];
  const meaningfulFields = fields
    .map((field) => ({ field, value: profile[field] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="rounded-[2.5rem] bg-ink p-7 text-white shadow-lift md:p-10">
          <p className="text-sm font-black text-avocado-200">AI 추천 결과</p>
          <h1 className="mt-3 text-5xl font-black leading-tight">실제로 가장 많이 남는 카드 Top 3</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            당신은 {meaningfulFields.map((item) => categoryLabels[item.field]).join(", ")} 비중이 높습니다. 이 패턴에서는
            {` ${top.card.name}`}가 전월실적을 충족하면서 가장 높은 체감 절감액을 제공합니다.
          </p>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            {results.slice(0, 3).map((analysis, index) => (
              <RecommendationCard key={analysis.card.slug} analysis={analysis} rank={index + 1} />
            ))}
          </div>
          <aside className="h-fit rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-ink">왜 이 카드들이 유리한가요?</h2>
            <p className="mt-4 leading-7 text-ink/64">
              소비 패턴상 핵심은 {meaningfulFields.map((item) => categoryLabels[item.field]).join(", ")}입니다.
              광고 할인율보다 월 한도 안에서 실제로 적용되는 금액이 큰 카드가 상위에 올랐습니다.
            </p>
            <div className="mt-6 rounded-3xl bg-cream p-5">
              <p className="font-black text-ink">주의할 점</p>
              <p className="mt-2 text-sm leading-6 text-ink/64">
                전월실적을 채우려고 소비를 늘리면 피킹률은 바로 낮아집니다. 이미 쓰는 지출 안에서 할인되는지가 가장
                중요합니다.
              </p>
            </div>
            <Link
              href="/compare"
              className="focus-ring mt-6 inline-flex w-full justify-center rounded-full bg-avocado-700 px-5 py-4 text-sm font-black text-white"
            >
              비슷한 카드 비교
            </Link>
          </aside>
        </section>
      </main>
    </>
  );
}
