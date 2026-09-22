"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileActionDock() {
  const pathname = usePathname();

  if (pathname.startsWith("/recommend") || pathname.startsWith("/results")) {
    return null;
  }

  return (
    <Link
      href="/recommend"
      className="mobile-fab-bottom focus-ring fixed right-4 z-[70] inline-flex min-h-14 items-center gap-3 rounded-[20px] bg-ink px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(22,32,22,0.28)] transition active:scale-[0.97] md:hidden"
      aria-label="내 소비로 카드 찾기"
    >
      <span
        className="relative h-5 w-7 rounded-[5px] border-2 border-current before:absolute before:left-1 before:top-1 before:h-1 before:w-2 before:rounded-sm before:bg-current"
        aria-hidden="true"
      />
      <span className="whitespace-nowrap">내 카드 찾기</span>
    </Link>
  );
}
