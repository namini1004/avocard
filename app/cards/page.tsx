import Link from "next/link";
import { Header } from "@/components/Header";
import { CardRankingBoard } from "@/components/CardRankingBoard";
import { cards } from "@/data/cards";
import { analyzeCard, defaultProfile, formatWon } from "@/lib/calculate";
import { minimumPopularCardCoverage, popularCoverageTargets } from "@/data/official-sources";

const analyses = cards.map((card) => analyzeCard(card, defaultProfile));
const analyzedCount = analyses.length;
const averagePickingRate =
  analyses.length > 0 ? analyses.reduce((sum, analysis) => sum + analysis.pickingRate, 0) / analyses.length : 0;

export default function CardsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <section className="rounded-[2.5rem] bg-ink p-8 text-white shadow-lift md:p-10">
          <p className="text-sm font-black text-avocado-200">CARD RANKING BOARD</p>
          <h1 className="mt-3 max-w-4xl text-5xl font-black leading-tight">월 사용액 기준, 진짜 남는 카드 랭킹</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/72">
            통신 10%, 커피 20% 같은 문구보다 중요한 건 실제 통합 월 할인한도입니다. 아보카드는 월 사용액, 전월실적, 통합한도, 연회비 월할을 반영해 순피킹률로 정렬합니다.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-avocado-700">분석 가능 카드</p>
            <p className="mt-2 text-4xl font-black text-ink">{analyzedCount}</p>
            <p className="mt-2 text-sm font-bold text-ink/54">현재 화면에 표시 중</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-avocado-700">100개 수집 목표</p>
            <p className="mt-2 text-4xl font-black text-ink">{popularCoverageTargets.length}</p>
            <p className="mt-2 text-sm font-bold text-ink/54">공식 출처 검수 대기</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-avocado-700">평균 피킹률</p>
            <p className="mt-2 text-4xl font-black text-ink">{averagePickingRate.toFixed(2)}%</p>
            <p className="mt-2 text-sm font-bold text-ink/54">연회비 월할 차감 후</p>
          </div>
          <div className="rounded-[2rem] bg-white p-6 shadow-soft">
            <p className="text-sm font-black text-avocado-700">랭킹 기준</p>
            <p className="mt-2 text-4xl font-black text-ink">순</p>
            <p className="mt-2 text-sm font-bold text-ink/54">혜택 - 월할 연회비</p>
          </div>
        </section>

        <div className="mt-8">
          <CardRankingBoard />
        </div>

        <section className="mt-8 rounded-[2rem] border border-avocado-900/10 bg-cream p-6">
          <h2 className="text-2xl font-black text-ink">100개 카드는 어디에서 확인하나요?</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-ink/64">
            현재 100개는 카드사별·혜택목적별 수집 타깃입니다. 실제 카드명, 연회비, 혜택, 피킹률은 공식 상품 페이지와 상품설명서 PDF 검수가 끝난 뒤 이 목록에 순차적으로 추가됩니다. 수집 타깃은 데이터 현황 페이지에서 확인할 수 있습니다.
          </p>
          <Link href="/sources" className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-ink shadow-soft">
            데이터 현황으로 이동
          </Link>
        </section>
      </main>
    </>
  );
}
