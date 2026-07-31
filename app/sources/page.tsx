import { Header } from "@/components/Header";
import { collectedCards } from "@/data/collected-cards";
import { verifiedCards } from "@/data/verified-cards";

export default function SourcesPage() {
  const officialSourceCount = new Set(
    verifiedCards.flatMap((card) => card.verification.sources.map((source) => source.url))
  ).size;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="rounded-[2.5rem] bg-ink p-8 text-white shadow-lift md:p-10">
          <p className="whitespace-nowrap text-sm font-black text-avocado-200">데이터 검증 원칙</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-5xl">
            많이 모은 데이터와 계산 가능한 데이터는 분리합니다
          </h1>
          <p className="mt-5 max-w-3xl keep-all text-lg leading-8 text-white/72">
            수집 원본은 카드 발견과 중복 확인에 보관합니다. 랭킹에는 카드사 공식 상품 페이지에서 발급 상태,
            연회비, 실적, 거래 조건, 한도를 확인한 카드만 들어갑니다.
          </p>
        </section>

        <section className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["수집 원본", collectedCards.length.toString(), "발견·중복 확인용"],
            ["공식 검증", verifiedCards.length.toString(), "계산 규칙 입력 완료"],
            ["공식 근거", officialSourceCount.toString(), "카드사 페이지·PDF"],
            ["추정치 랭킹", "0", "검증 전에는 미노출"]
          ].map(([label, value, sub]) => (
            <div key={label} className="rounded-[1.5rem] bg-white p-5 shadow-soft md:rounded-[2rem] md:p-6">
              <p className="whitespace-nowrap text-sm font-black text-avocado-700">{label}</p>
              <p className="mt-2 text-4xl font-black text-ink">{value}</p>
              <p className="mt-2 keep-all text-sm font-bold text-ink/54">{sub}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-ink">랭킹 승격 조건</h2>
            <div className="mt-5 grid gap-3">
              {[
                ["1. 현재 발급 가능", "공식 신청 화면 또는 카드사 상품 목록에서 상태를 확인합니다."],
                ["2. 금액 조건 구조화", "전월실적, 건당 최소금액, 횟수, 영역 한도와 통합 한도를 각각 저장합니다."],
                ["3. 다음 달 실적 검증", "할인 대상 매출의 실적 포함·제외·일부 반영 조건을 따로 계산합니다."],
                ["4. 고정 계산 통과", "공식 예시와 경계 구간 테스트가 맞아야 verified 상태로 승격합니다."]
              ].map(([title, body]) => (
                <div key={title} className="rounded-3xl border border-avocado-900/10 bg-cream p-5">
                  <p className="font-black text-ink">{title}</p>
                  <p className="mt-2 keep-all text-sm leading-6 text-ink/62">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-ink">현재 공식 검증 카드</h2>
            <div className="mt-5 space-y-3">
              {verifiedCards.map((card) => (
                <div key={card.slug} className="rounded-3xl border border-avocado-900/10 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-avocado-700">{card.issuer}</p>
                      <p className="mt-1 font-black text-ink">{card.name}</p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-avocado-100 px-3 py-1 text-xs font-black text-avocado-800">
                      {card.calculationCoverage === "full_monetary" ? "금전혜택 전체" : "핵심 금전혜택"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {card.verification.sources.map((source) => (
                      <a
                        key={source.id}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="whitespace-nowrap rounded-full bg-cream px-3 py-2 text-xs font-black text-ink/65 hover:text-avocado-700"
                      >
                        {source.type === "issuer_pdf" ? "공식 PDF" : "공식 상품 페이지"}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
