import { CardExplorer } from "./CardExplorer";
import { discoverCards } from "@/lib/card-discovery";

export function CardRankingBoard() {
  return <CardExplorer initial={discoverCards()} />;
}
