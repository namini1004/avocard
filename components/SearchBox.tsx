"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cards } from "@/data/cards";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return cards.slice(0, 3);
    return cards
      .filter((card) => `${card.name} ${card.issuer} ${card.bestFor.join(" ")}`.toLowerCase().includes(normalized))
      .slice(0, 4);
  }, [query]);

  return (
    <div className="glass relative rounded-[2rem] p-3 shadow-soft">
      <label htmlFor="card-search" className="sr-only">
        카드 이름 검색
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="card-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="궁금한 카드 이름을 입력해보세요"
          className="focus-ring min-h-14 flex-1 rounded-full border border-avocado-900/10 bg-white px-5 text-base font-bold text-ink placeholder:text-avocado-900/40"
        />
        <Link
          href={results[0] ? `/cards/${results[0].slug}` : "/cards"}
          className="focus-ring inline-flex min-h-14 items-center justify-center rounded-full bg-avocado-600 px-6 text-sm font-black text-white transition hover:bg-avocado-700"
        >
          분석 보기
        </Link>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {results.map((card) => (
          <Link
            key={card.slug}
            href={`/cards/${card.slug}`}
            className="rounded-2xl border border-avocado-900/10 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-avocado-500"
          >
            <p className="text-xs font-bold text-avocado-700">{card.issuer}</p>
            <p className="mt-1 text-sm font-black text-ink">{card.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
