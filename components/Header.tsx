"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  ChartNoAxesColumnIncreasing,
  SlidersHorizontal,
} from "lucide-react";
import { AvocardCardLogo } from "./AvocadoMark";

export function Header() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <nav className="header-inner" aria-label="주요 메뉴">
        <Link href="/" className="brand-link" aria-label="아보카드 홈">
          <AvocardCardLogo className="brand-logo" />
          <span>Avocard</span>
        </Link>
        <div className="desktop-nav">
          <Link
            href="/#find"
            aria-current={pathname === "/" ? "page" : undefined}
          >
            카드 고르기
          </Link>
          <Link
            href="/compare"
            aria-current={pathname === "/compare" ? "page" : undefined}
          >
            카드 비교
          </Link>
          <Link href="/#faq">궁금한 이야기</Link>
        </div>
        <Link href="/recommend" className="header-action">
          내 카드 찾기 <ArrowUpRight size={17} />
        </Link>
        <div className="mobile-nav">
          <Link href="/#find" aria-label="카드 랭킹" title="카드 랭킹">
            <ChartNoAxesColumnIncreasing size={21} />
          </Link>
          <Link
            href="/recommend"
            aria-label="내 카드 찾기"
            title="내 카드 찾기"
          >
            <SlidersHorizontal size={21} />
          </Link>
        </div>
      </nav>
    </header>
  );
}
