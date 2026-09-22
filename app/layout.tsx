import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./discovery.css";

export const metadata: Metadata = {
  title: {
    default: "아보카드 - 아는 만큼 보이는 카드",
    template: "%s | 아보카드",
  },
  description:
    "쓰는 건 그대로, 남는 혜택은 더 크게. 연회비와 실적 조건을 반영한 피킹률, 월 순혜택, 사용 편의성으로 내 일상에 맞는 카드를 비교하세요.",
  keywords: [
    "아보카드",
    "카드 추천",
    "피킹률",
    "신용카드 혜택",
    "무실적 카드",
    "카드 비교",
  ],
  openGraph: {
    title: "아보카드 - 아는 만큼 보이는 카드",
    description:
      "카드사 광고보다 더 솔직하게, 실제로 남는 혜택을 보여드립니다.",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8faf8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
