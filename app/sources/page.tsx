import { Header } from "@/components/Header";
import { cardCandidates, candidateSources, candidateStats } from "@/data/card-candidates";

const sourceLabel = {
  popular_reference: "인기 랭킹",
  official_catalog: "공식 상품",
  public_disclosure: "협회 공시"
};

export default function SourcesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="rounded-[2.5rem] bg-ink p-8 text-white shadow-lift md:p-10">
          <p className="text-sm font-black text-avocado-200">DATA COLLECTION</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight">카드 후보 풀 수집 현황</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            먼저 인기 카드 사이트, 카드사 공식 상품 목록, 여신금융협회 공시를 기준으로 카드 종류를 넓게 모읍니다.
            이후 카드별 상품설명서와 약관 PDF를 확인해 연회비, 전월실적, 통합한도, 제외 항목을 채우는 순서로 검수합니다.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["후보 카드", candidateStats.total.toString(), "수집 인벤토리"],
            ["랭킹 반영", candidateStats.inRanking.toString(), "계산 데이터 있음"],
            ["검수 대기", candidateStats.backlog.toString(), "혜택 수치 입력 예정"],
            ["카드사/브랜드", candidateStats.issuers.toString(), "중복 제외"]
          ].map(([label, value, sub]) => (
            <div key={label} className="rounded-[2rem] bg-white p-6 shadow-soft">
              <p className="text-sm font-black text-avocado-700">{label}</p>
              <p className="mt-2 text-4xl font-black text-ink">{value}</p>
              <p className="mt-2 text-sm font-bold text-ink/54">{sub}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-ink">사용 중인 출처</h2>
            <div className="mt-5 space-y-3">
              {candidateSources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  className="block rounded-3xl border border-avocado-900/10 p-5 transition hover:border-avocado-500"
                >
                  <span className="rounded-full bg-avocado-100 px-3 py-1 text-xs font-black text-avocado-800">
                    {sourceLabel[source.trust]}
                  </span>
                  <p className="mt-3 font-black text-ink">{source.title}</p>
                  <p className="mt-2 break-all text-xs font-bold text-avocado-700">{source.url}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-black text-ink">검수 순서</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["1. 후보 등록", "인기 랭킹과 공식 상품 목록에서 카드명, 카드사, 카드 유형을 먼저 모읍니다."],
                ["2. 공식 상품 확인", "카드사 상세 페이지에서 발급 가능 여부와 상품설명서 링크를 확인합니다."],
                ["3. 혜택 규칙 입력", "전월실적, 영역별 한도, 통합한도, 제외 항목을 BenefitRule로 정리합니다."],
                ["4. 피킹률 공개", "계산 검증이 끝난 카드만 랭킹 데이터로 승격합니다."]
              ].map(([title, body]) => (
                <div key={title} className="rounded-3xl border border-avocado-900/10 bg-cream p-5">
                  <p className="font-black text-ink">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/62">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-black text-ink">카드 후보 목록</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-ink/58">
                아래 목록은 아직 모두 피킹률 계산 완료 상태가 아닙니다. `랭킹 반영`은 현재 사이트 랭킹에 쓰이는 카드,
                `검수 대기`는 공식 상품설명서 확인 후 혜택 수치를 채울 카드입니다.
              </p>
            </div>
            <span className="w-fit rounded-full bg-ink px-4 py-2 text-sm font-black text-white">
              {candidateStats.total} cards
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cardCandidates.map((card) => (
              <div key={card.slug} className="rounded-3xl border border-avocado-900/10 bg-cream p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-black text-avocado-700">#{card.priority.toString().padStart(3, "0")}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                      card.status === "in_ranking" ? "bg-avocado-100 text-avocado-800" : "bg-white text-ink/58"
                    }`}
                  >
                    {card.status === "in_ranking" ? "랭킹 반영" : "검수 대기"}
                  </span>
                </div>
                <p className="mt-2 font-black leading-6 text-ink">{card.name}</p>
                <p className="mt-1 text-sm font-bold text-ink/58">
                  {card.issuer} · {card.cardType === "credit" ? "신용" : "체크"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {card.purposeTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-ink/58">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
