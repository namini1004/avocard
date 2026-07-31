import type { VerifiedCard } from "@/data/verified-card-types";

export function CardVisual({ card, compact = false }: { card: VerifiedCard; compact?: boolean }) {
  return (
    <div
      className={`relative aspect-[8/5] w-full overflow-hidden rounded-lg border border-black/10 p-5 shadow-lift ${
        compact ? "max-w-[320px]" : "max-w-[520px]"
      }`}
      style={{ backgroundColor: card.color.background, color: card.color.foreground }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="whitespace-nowrap text-xs font-black opacity-65">{card.issuer}</p>
          <p className="mt-2 max-w-[15rem] text-xl font-black leading-tight">{card.name}</p>
        </div>
        <div
          className="h-8 w-11 rounded-md border border-black/15"
          style={{ backgroundColor: card.color.accent }}
          aria-hidden="true"
        >
          <div className="mx-auto mt-2 h-3 w-7 rounded-sm border border-black/15" />
        </div>
      </div>
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
        <p className="whitespace-nowrap text-xs font-black opacity-60">
          {card.cardType === "credit" ? "CREDIT" : "CHECK"}
        </p>
        <p className="whitespace-nowrap text-xs font-black opacity-55">AVOCARD VERIFIED</p>
      </div>
    </div>
  );
}
