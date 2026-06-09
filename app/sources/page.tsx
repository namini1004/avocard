import Link from "next/link";
import { Header } from "@/components/Header";
import {
  benefitPurposes,
  minimumPopularCardCoverage,
  officialIssuerSources,
  popularCoverageTargets,
  publicDisclosureSources
} from "@/data/official-sources";

const sourceStats = [
  { label: "카드사 그룹", value: officialIssuerSources.length.toString(), sub: "공식 상품 페이지 우선" },
  { label: "혜택 목적", value: benefitPurposes.length.toString(), sub: "소비 목적별 분류" },
  { label: "수집 슬롯", value: popularCoverageTargets.length.toString(), sub: `최소 목표 ${minimumPopularCardCoverage}개` },
  { label: "필수 출처", value: "2", sub: "상품 페이지 + 상품설명서" }
];

export default function SourcesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="rounded-[2.5rem] bg-ink p-8 text-white shadow-lift md:p-10">
          <p className="text-sm font-black text-avocado-200">OFFICIAL DATA COVERAGE</p>
          <h1 className="mt-3 text-5xl font-black leading-tight">공식 출처 기반 100개 카드 수집 플랜</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            아보카드는 카드사 공식 상품 페이지와 상품설명서 PDF를 기준으로 혜택 규칙을 검수합니다. 현재 화면은
            실제 카드 100개를 채우기 위한 카드사별·혜택목적별 수집 슬롯입니다.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {sourceStats.map((stat) => (
            <div key={stat.label} className="rounded-[2rem] bg-white p-6 shadow-soft">
              <p className="text-sm font-black text-avocado-700">{stat.label}</p>
              <p className="mt-2 text-4xl font-black text-ink">{stat.value}</p>
              <p className="mt-2 text-sm font-bold text-ink/54">{stat.sub}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-ink">공식/협회 출처</h2>
            <div className="mt-5 space-y-3">
              {publicDisclosureSources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  className="block rounded-3xl border border-avocado-900/10 p-5 transition hover:border-avocado-500"
                >
                  <p className="font-black text-ink">{source.name}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/58">{source.usage}</p>
                  <p className="mt-2 break-all text-xs font-bold text-avocado-700">{source.url}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-ink">카드사별 공식 수집 시작점</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {officialIssuerSources.map((issuer) => (
                <div key={issuer.code} className="rounded-3xl border border-avocado-900/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black text-ink">{issuer.issuer}</p>
                    <span className="rounded-full bg-avocado-100 px-3 py-1 text-xs font-black text-avocado-800">
                      {issuer.domains[0]}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/58">{issuer.notes}</p>
                  <Link
                    href={issuer.productListUrls[0]}
                    className="mt-4 inline-flex text-sm font-black text-avocado-700"
                  >
                    공식 페이지 열기
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-black text-ink">100개 수집 슬롯</h2>
              <p className="mt-2 text-sm leading-6 text-ink/58">
                각 슬롯은 실제 카드 1개 이상을 공식 출처로 매핑하기 위한 작업 큐입니다. 카드별 원문과 PDF가 붙으면
                `draft → needs_review → verified` 순서로 공개됩니다.
              </p>
            </div>
            <span className="rounded-full bg-ink px-4 py-2 text-sm font-black text-white">
              {popularCoverageTargets.length}/{minimumPopularCardCoverage}
            </span>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {popularCoverageTargets.map((target) => (
              <div key={target.id} className="rounded-3xl border border-avocado-900/10 bg-cream p-4">
                <p className="text-xs font-black text-avocado-700">#{target.priority.toString().padStart(3, "0")}</p>
                <p className="mt-2 font-black text-ink">{target.issuer}</p>
                <p className="mt-1 text-sm font-bold text-ink/62">{target.purposeLabel}</p>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-ink/48">{target.candidateQuery}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
