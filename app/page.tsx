import Link from "next/link";
import { Header } from "@/components/Header";
import { ButtonLink } from "@/components/ButtonLink";
import { CardRankingBoard } from "@/components/CardRankingBoard";
import { AvocadoMascot } from "@/components/AvocadoMark";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative mx-auto max-w-7xl px-5 pb-4 pt-10 lg:px-8 lg:pt-14">
          <div className="pointer-events-none absolute right-5 top-7 opacity-95 lg:right-10">
            <AvocadoMascot className="h-16 w-auto sm:h-20 lg:h-28" />
          </div>
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-avocado-900/10 bg-white px-4 py-2 text-sm font-black text-avocado-800 shadow-soft">
              <span className="whitespace-nowrap">카드 광고보다 솔직하게</span>
            </div>
            <h1 className="text-5xl font-black leading-[1.06] text-ink sm:text-6xl lg:text-7xl">
              아보카드
              <span className="mt-3 block text-avocado-700">아는 만큼 보이는 카드</span>
            </h1>
            <p className="mt-6 text-lg font-bold leading-8 text-ink/70 md:text-xl md:leading-9">
              모든 혜택 조건과 전월실적을 지켰을 때 어디까지 받을 수 있을까요? 공식 한도, 실적 인정률,
              연회비까지 반영한 최대 피킹률부터 비교해보세요.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#ranking">최대 피킹률 순위 보기</ButtonLink>
              <ButtonLink href="/recommend" tone="secondary">
                내 소비로 카드 찾기
              </ButtonLink>
            </div>
          </div>
        </section>

        <section id="ranking" className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <CardRankingBoard />
        </section>

        <section id="faq" className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
          <h2 className="text-3xl font-black text-ink">FAQ</h2>
          <div className="mt-6 space-y-4">
            {[
              [
                "피킹률이 뭐예요?",
                "(실제 할인·적립액 - 연회비 월할) ÷ 실제 카드 사용액입니다. 아보카드는 음수가 되면 순혜택과 피킹률을 0으로 표시합니다."
              ],
              ["왜 연회비를 빼나요?", "연회비도 실제 비용이기 때문에 월할로 나눠 순혜택에서 차감합니다."],
              [
                "카드 데이터는 정확한가요?",
                "랭킹에는 카드사 공식 상품 페이지로 발급 상태와 계산 필드를 검증한 카드만 노출합니다. 아직 검증하지 않은 수집 원본은 랭킹 계산에 쓰지 않습니다."
              ],
              [
                "지속 피킹률은 뭐예요?",
                "혜택을 받은 소비가 다음 달 실적에 포함되는지까지 반영해, 같은 소비를 반복했을 때 유지되는 피킹률입니다."
              ],
              [
                "최대 피킹률은 광고상 할인율과 다른가요?",
                "다릅니다. 모든 거래 조건과 실적을 지키면서 월 30만~120만원 안에서 반복 가능한 최적 소비 조합을 찾고, 연회비를 차감한 값입니다."
              ]
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
                  공식 근거와 계산 테스트가 갖춰진 카드부터 공개하고, 같은 기준으로 카드사별 데이터를 확장합니다.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link className="focus-ring whitespace-nowrap rounded-full bg-white px-6 py-4 text-sm font-black text-ink" href="#ranking">
                  랭킹 다시 보기
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
