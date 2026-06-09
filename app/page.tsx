import Link from "next/link";
import { Header } from "@/components/Header";
import { ButtonLink } from "@/components/ButtonLink";
import { AvocardCardLogo, AvocadoMascot } from "@/components/AvocadoMark";
import { CardRankingBoard } from "@/components/CardRankingBoard";
import { cards } from "@/data/cards";
import { defaultProfile, rankCards, formatWon } from "@/lib/calculate";

const top = rankCards(cards, defaultProfile)[0];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-avocado-900/10 bg-white px-4 py-2 text-sm font-black text-avocado-800 shadow-soft">
              <AvocardCardLogo className="h-8 w-[102px]" />
              <span className="whitespace-nowrap">카드 광고보다 솔직하게</span>
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[1.06] text-ink sm:text-6xl lg:text-7xl">
              아보카드
              <span className="mt-3 block text-avocado-700">아는 만큼 보이는 카드</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-bold leading-8 text-ink/70 md:text-xl md:leading-9">
              “10% 할인”보다 중요한 건 실제로 남는 금액입니다. 인기 카드 30개를 월 사용액, 전월실적, 통합 할인한도, 연회비까지 반영해 피킹률로 정리했습니다.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#ranking">인기 카드 랭킹 보기</ButtonLink>
              <ButtonLink href="/recommend" tone="secondary">
                나만의 카드 찾기
              </ButtonLink>
            </div>
          </div>

          <div className="relative">
            <div className="glass relative overflow-hidden rounded-[2.5rem] p-5 shadow-lift">
              <div className="grid gap-4 sm:grid-cols-[0.82fr_1.18fr]">
                <div className="rounded-[2rem] bg-avocado-100 p-6">
                  <AvocadoMascot className="h-32 w-auto drop-shadow-[0_16px_22px_rgba(38,55,25,0.16)]" />
                  <p className="mt-6 whitespace-nowrap text-sm font-black text-avocado-800">현재 1위</p>
                  <p className="mt-2 text-2xl font-black leading-tight text-ink">{top.card.name}</p>
                </div>
                <div className="rounded-[2rem] bg-ink p-6 text-white">
                  <p className="whitespace-nowrap text-sm font-black text-avocado-200">월 70만원 기준</p>
                  <p className="mt-3 text-5xl font-black">{top.pickingRate.toFixed(2)}%</p>
                  <p className="mt-2 whitespace-nowrap text-sm font-bold text-white/62">실제 피킹률</p>
                  <div className="mt-6 grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                      <span className="whitespace-nowrap text-sm font-bold text-white/70">통합 월 한도</span>
                      <span className="whitespace-nowrap font-black">{formatWon(top.effectiveMonthlyCap)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                      <span className="whitespace-nowrap text-sm font-bold text-white/70">월 순혜택</span>
                      <span className="whitespace-nowrap font-black">{formatWon(top.monthlySaving)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                      <span className="whitespace-nowrap text-sm font-bold text-white/70">연회비 월할</span>
                      <span className="whitespace-nowrap font-black">-{formatWon(top.monthlyFee)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-[2rem] bg-white p-5">
                <p className="whitespace-nowrap text-sm font-black text-avocado-700">아보카드의 기준</p>
                <p className="mt-2 text-2xl font-black text-ink">혜택 - 연회비 = 실제로 남는 금액</p>
                <p className="mt-3 text-sm leading-6 text-ink/62">
                  카드별 상세를 누르면 영역별 최소 조건, 월 할인한도, 피킹률 계산 이유를 바로 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="ranking" className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <CardRankingBoard />
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-12 lg:grid-cols-3 lg:px-8">
          {[
            ["광고 문구 대신 실제 한도", "통신 10%, 커피 30%보다 중요한 통합 월 한도를 먼저 보여줍니다."],
            ["연회비까지 차감", "월 순혜택에서 연회비 월할액을 빼 피킹률을 더 현실적으로 계산합니다."],
            ["AI 추천은 유지", "나만의 카드 찾기는 MVP 이후 소비 입력을 더 촘촘하게 발전시킬 예정입니다."]
          ].map(([title, body]) => (
            <div key={title} className="rounded-[2rem] border border-avocado-900/10 bg-white p-6 shadow-soft">
              <h2 className="text-xl font-black text-ink">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink/62">{body}</p>
            </div>
          ))}
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
          <h2 className="text-3xl font-black text-ink">FAQ</h2>
          <div className="mt-6 space-y-4">
            {[
              ["피킹률이 뭐예요?", "월 카드 사용액 대비 실제로 돌려받는 순혜택 비율입니다."],
              ["왜 연회비를 빼나요?", "연회비도 실제 비용이기 때문에 월할로 나눠 순혜택에서 차감합니다."],
              ["카드 데이터는 정확한가요?", "MVP는 공식 상품 페이지, 여신금융협회 공시, 인기 랭킹 출처를 연결한 검수 대기 데이터입니다. 약관 PDF 단위의 최종 검수는 계속 확장합니다."],
              ["검색은 왜 없나요?", "초기에는 30개 인기 카드 랭킹과 상세 분석에 집중하고, 데이터가 충분히 늘어난 뒤 검색을 붙입니다."]
            ].map(([q, a]) => (
              <details key={q} className="rounded-3xl border border-avocado-900/10 bg-white p-5 shadow-soft">
                <summary className="cursor-pointer text-lg font-black text-ink">{q}</summary>
                <p className="mt-3 leading-7 text-ink/64">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-5 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-avocado-700 p-8 text-white shadow-lift md:p-12">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="whitespace-nowrap text-sm font-black text-avocado-100">답답해서 만들었습니다</p>
                <h2 className="mt-3 text-4xl font-black">카드 선택, 감이 아니라 데이터로</h2>
                <p className="mt-4 max-w-2xl text-white/78">
                  일단 인기 카드 30개부터 제대로 비교하고, 다음 단계에서 카드사별·혜택목적별 데이터를 확장합니다.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link className="focus-ring whitespace-nowrap rounded-full bg-white px-6 py-4 text-sm font-black text-ink" href="#ranking">
                  랭킹 다시 보기
                </Link>
                <Link className="focus-ring whitespace-nowrap rounded-full bg-ink px-6 py-4 text-sm font-black text-white" href="/recommend">
                  나만의 카드 찾기
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
