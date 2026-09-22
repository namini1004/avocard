import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { CardChoiceDetails } from "@/components/CardExplorer";
import { discoverCards } from "@/lib/card-discovery";
import { initialDiscovery } from "@/lib/discovery-types";
import { verifiedCards } from "@/data/verified-cards";

export function generateStaticParams() {
  return verifiedCards.map(({ slug }) => ({ slug }));
}

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = discoverCards({
    ...initialDiscovery,
    mode: "benefit",
  }).cards.find((item) => item.slug === slug);
  if (!card) notFound();
  return (
    <>
      <Header />
      <main className="standalone-detail">
        <Link href="/#find" className="text-action">
          <ArrowLeft size={17} /> 카드 고르기로
        </Link>
        <p className="caption detail-context">
          월 70만원 일반 국내 가맹점 사용 예시
        </p>
        <CardChoiceDetails card={card} />
        <Link href="/recommend" className="primary-action">
          내 소비로 다시 확인
        </Link>
      </main>
    </>
  );
}
