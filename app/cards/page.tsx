import { Header } from "@/components/Header";
import { CardRankingBoard } from "@/components/CardRankingBoard";

export default function CardsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <CardRankingBoard />
      </main>
    </>
  );
}
