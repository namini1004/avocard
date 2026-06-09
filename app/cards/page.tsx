import { Header } from "@/components/Header";
import { CardRankingBoard } from "@/components/CardRankingBoard";

export default function CardsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="rounded-[2.5rem] bg-ink p-7 text-white shadow-lift md:p-10">
          <p className="whitespace-nowrap text-sm font-black text-avocado-200">CARD RANKING BOARD</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight md:text-5xl">
            인기 카드를 실제 피킹률로 정렬했습니다
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            통신 10%, 커피 30% 같은 마케팅 할인율보다 월 사용액 대비 실제로 남는 통합 혜택을 먼저 봅니다.
          </p>
        </section>

        <div className="mt-8">
          <CardRankingBoard />
        </div>
      </main>
    </>
  );
}
