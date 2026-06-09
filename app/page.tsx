import Link from "next/link";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { ButtonLink } from "@/components/ButtonLink";
import { AvocadoMascot } from "@/components/AvocadoMark";
import { BenefitBar } from "@/components/BenefitBar";
import { CardVisual } from "@/components/CardVisual";
import { RecommendationCard } from "@/components/RecommendationCard";
import { cards } from "@/data/cards";
import { analyzeCard, defaultProfile, formatWon, rankCards } from "@/lib/calculate";

const problems = [
  "최대 10% 할인이라 해서 만들었는데 실제론 월 5천원 남짓",
  "전월실적 채우느라 오히려 더 쓰게 되는 이상한 상황",
  "나에게 맞는 카드인지 끝까지 알 수 없는 추천 리스트",
  "할인한도, 제외 항목, 실적 조건이 너무 작게 숨어 있음"
];

const principles = [
  "전월실적, 월 할인한도, 실적 제외 조건을 함께 봅니다.",
  "광고 문구보다 실제 사용 기준 예상 절감액을 먼저 보여줍니다.",
  "카드 선택의 기준을 감이 아니라 숫자로 바꿉니다.",
  "복잡한 혜택 구조를 금융 문맹도 이해할 수 있게 풀어냅니다."
];

const topAnalyses = rankCards(cards, defaultProfile).slice(0, 3);

export default function HomePage() {
  const example = analyzeCard(cards[0], defaultProfile);

  return (
    <>
      <Header />
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-avocado-900/10 bg-white px-4 py-2 text-sm font-black text-avocado-800 shadow-soft">
              <span>🥑</span>
              카드사 광고보다 더 솔직하게
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
              아보카드
              <span className="mt-3 block text-avocado-700">아는 만큼 보이는 카드</span>
            </h1>
            <p className="mt-7 max-w-2xl text-xl font-bold leading-9 text-ink/72">
              10% 할인? 그래서 실제로 얼마가 남는데요. 카드 이름만 입력하면 전월실적, 할인한도, 실적 제외까지
              반영해 실제 혜택과 피킹률을 보여드립니다.
            </p>
            <div className="mt-8 max-w-2xl">
              <SearchBox />
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/cards/fresh-life">카드 분석 시작하기</ButtonLink>
              <ButtonLink href="/recommend" tone="secondary">
                AI 카드 추천 받기
              </ButtonLink>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 hidden h-24 w-24 rounded-full bg-seed/25 blur-2xl lg:block" />
            <div className="glass relative overflow-hidden rounded-[2.5rem] p-5 shadow-lift">
              <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[2rem] bg-avocado-100 p-6">
                  <AvocadoMascot className="h-36 w-auto drop-shadow-[0_16px_22px_rgba(38,55,25,0.16)]" />
                  <p className="mt-6 text-sm font-black text-avocado-800">실제로 남는 혜택</p>
                  <p className="mt-2 text-4xl font-black text-ink">{formatWon(example.monthlySaving)}</p>
                  <p className="mt-3 text-sm leading-6 text-ink/62">
                    월 70만원 소비 기준, 커피/교통/배달 한도까지 계산했습니다.
                  </p>
                </div>
                <CardVisual card={cards[0]} />
              </div>
              <div className="mt-4 rounded-[2rem] bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-ink/50">광고상 혜택</p>
                    <p className="text-2xl font-black text-ink">최대 10% 할인</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink/50">실제 피킹률</p>
                    <p className="text-3xl font-black text-avocado-700">{example.pickingRate.toFixed(2)}%</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <BenefitBar label="커피 할인 예상" value={8000} max={10000} />
                  <BenefitBar label="배달 할인 예상" value={9600} max={12000} />
                  <BenefitBar label="교통 할인 예상" value={5600} max={10000} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <h2 className="text-4xl font-black text-ink">이런 경험, 한 번쯤 있으셨죠?</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {problems.map((problem) => (
                <div key={problem} className="rounded-3xl border border-avocado-900/10 bg-cream p-5">
                  <p className="text-3xl">“</p>
                  <p className="mt-2 text-lg font-black leading-7 text-ink">{problem}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="analysis" className="py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase text-avocado-700">How Avocard Works</p>
              <h2 className="mt-3 text-4xl font-black text-ink">아보카드는 이렇게 다릅니다</h2>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                ["실제 혜택 분석", "전월실적과 한도를 반영해 카드별 혜택 구조를 한눈에 정리합니다."],
                ["실제 피킹률 계산", "월 소비액 대비 실제로 남는 금액을 퍼센트로 보여줍니다."],
                ["AI 맞춤 카드 추천", "소비 패턴을 읽고 왜 이 카드가 유리한지 자연어로 설명합니다."]
              ].map(([title, body]) => (
                <div key={title} className="rounded-[2rem] border border-avocado-900/10 bg-white p-7 shadow-soft">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-avocado-100 text-xl">🥑</div>
                  <h3 className="mt-6 text-2xl font-black text-ink">{title}</h3>
                  <p className="mt-3 leading-7 text-ink/64">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ink py-20 text-white">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black text-avocado-200">광고상 혜택 vs 실제 체감 혜택</p>
                <h2 className="mt-3 text-4xl font-black">혜택은 숫자로 증명합니다</h2>
              </div>
              <ButtonLink href="/compare" tone="secondary">
                카드 비교 보기
              </ButtonLink>
            </div>
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {topAnalyses.map((analysis) => (
                <div key={analysis.card.slug} className="rounded-[2rem] bg-white p-5 text-ink">
                  <p className="text-sm font-black text-avocado-700">{analysis.card.issuer}</p>
                  <h3 className="mt-2 text-2xl font-black">{analysis.card.name}</h3>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-cream p-4">
                      <p className="text-xs font-bold text-ink/50">광고 문구</p>
                      <p className="mt-2 font-black">{analysis.card.advertisedBenefit}</p>
                    </div>
                    <div className="rounded-2xl bg-avocado-100 p-4">
                      <p className="text-xs font-bold text-ink/50">실제 피킹률</p>
                      <p className="mt-2 text-2xl font-black text-avocado-800">{analysis.pickingRate.toFixed(2)}%</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink/62">{analysis.card.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-black text-avocado-700">AI CARD MATCHER</p>
              <h2 className="mt-3 text-4xl font-black leading-tight text-ink">나만의 AI 카드 고르기</h2>
              <p className="mt-4 text-lg leading-8 text-ink/68">
                월 총 소비, 커피, 배달, 교통, 통신, OTT 같은 소비 패턴을 입력하면 실제 피킹률 기준으로 유리한
                카드를 추천합니다.
              </p>
              <div className="mt-7">
                <ButtonLink href="/recommend">내 소비 패턴 입력하기</ButtonLink>
              </div>
            </div>
            <div className="space-y-4">
              {topAnalyses.map((analysis, index) => (
                <RecommendationCard key={analysis.card.slug} analysis={analysis} rank={index + 1} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <h2 className="text-4xl font-black text-ink">왜 아보카드는 믿을 수 있을까요?</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {principles.map((principle) => (
                <div key={principle} className="rounded-3xl border border-avocado-900/10 p-5">
                  <p className="text-lg font-black leading-7 text-ink">{principle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-20">
          <div className="mx-auto max-w-4xl px-5 lg:px-8">
            <h2 className="text-4xl font-black text-ink">FAQ</h2>
            <div className="mt-8 space-y-4">
              {[
                ["피킹률이 뭐예요?", "월 카드 사용액 대비 실제 할인/적립으로 돌려받는 비율입니다."],
                ["추천 결과는 어떻게 계산되나요?", "소비 카테고리별 지출에 할인율과 월 한도를 적용하고 전월실적 충족 여부를 반영합니다."],
                ["카드사와 제휴된 사이트인가요?", "프로토타입 기준으로는 독립 분석 서비스 콘셉트입니다. 광고보다 실제 숫자를 우선합니다."],
                ["내 소비 데이터는 저장되나요?", "현재 목업은 브라우저 입력값 기반으로만 보여주며 서버 저장을 하지 않습니다."]
              ].map(([q, a]) => (
                <details key={q} className="rounded-3xl border border-avocado-900/10 bg-white p-5 shadow-soft">
                  <summary className="cursor-pointer text-lg font-black text-ink">{q}</summary>
                  <p className="mt-3 leading-7 text-ink/64">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-avocado-700 p-8 text-white shadow-lift md:p-12">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-black text-avocado-100">답답해서 만들었습니다</p>
                <h2 className="mt-3 text-4xl font-black">지금 내 카드의 진짜 혜택을 확인하세요</h2>
                <p className="mt-4 max-w-2xl text-white/78">
                  보이는 혜택이 아니라 실제로 남는 혜택. 카드 선택, 이제 데이터로 하세요.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link className="focus-ring rounded-full bg-white px-6 py-4 text-sm font-black text-ink" href="/cards/fresh-life">
                  진짜 혜택 확인하기
                </Link>
                <Link className="focus-ring rounded-full bg-ink px-6 py-4 text-sm font-black text-white" href="/recommend">
                  AI로 찾기
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
