import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "아보카드 - 아는 만큼 보이는 카드",
    template: "%s | 아보카드"
  },
  description:
    "카드의 광고상 혜택이 아니라 실제 절감액과 피킹률을 분석하고, 소비 패턴 기반 AI 카드 추천을 제공하는 아보카드입니다.",
  keywords: ["아보카드", "카드 추천", "피킹률", "신용카드 혜택", "카드 분석", "AI 카드 추천"],
  openGraph: {
    title: "아보카드 - 아는 만큼 보이는 카드",
    description: "카드사 광고보다 더 솔직하게, 실제로 남는 혜택을 보여드립니다.",
    type: "website",
    locale: "ko_KR"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
