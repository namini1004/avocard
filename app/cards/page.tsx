import { Header } from "@/components/Header";
import { CardRankingBoard } from "@/components/CardRankingBoard";

export default function CardsPage() {
  return (
    <>
      <Header />
      <main className="site-main">
        <CardRankingBoard />
      </main>
    </>
  );
}
