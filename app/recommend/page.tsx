import { Header } from "@/components/Header";
import { CardExplorer } from "@/components/CardExplorer";
import { discoverCards } from "@/lib/card-discovery";
import { initialDiscovery } from "@/lib/discovery-types";

export default function RecommendPage() {
  return (
    <>
      <Header />
      <main className="site-main">
        <CardExplorer
          personal
          initial={discoverCards({ ...initialDiscovery, mode: "benefit" })}
        />
      </main>
    </>
  );
}
