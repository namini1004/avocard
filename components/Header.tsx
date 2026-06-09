import Link from "next/link";
import { AvocadoMark } from "./AvocadoMark";

const links = [
  { href: "/#analysis", label: "혜택 분석" },
  { href: "/recommend", label: "AI 추천" },
  { href: "/compare", label: "카드 비교" },
  { href: "/sources", label: "데이터 소스" },
  { href: "/#faq", label: "FAQ" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-avocado-900/10 bg-cream/82 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8" aria-label="주요 메뉴">
        <Link href="/" className="flex items-center gap-3 font-black text-ink">
          <AvocadoMark size="sm" />
          <span className="text-xl">아보카드</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm font-bold text-avocado-900/75 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-avocado-700">
              {link.label}
            </Link>
          ))}
        </div>
        <Link
          href="/recommend"
          className="focus-ring rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-avocado-800"
        >
          내 카드 찾기
        </Link>
      </nav>
    </header>
  );
}
