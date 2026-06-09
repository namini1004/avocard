import { CreditCard } from "@/data/cards";

export function CardVisual({ card, compact = false }: { card: CreditCard; compact?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.6rem] bg-gradient-to-br ${card.color} p-5 text-white shadow-lift ${
        compact ? "min-h-44" : "min-h-60"
      }`}
    >
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />
      <div className="absolute -bottom-14 right-7 h-40 w-40 rounded-full bg-cream/20" />
      <p className="text-sm font-bold opacity-80">{card.issuer}</p>
      <p className="mt-3 max-w-56 text-2xl font-black leading-tight">{card.name}</p>
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold opacity-75">실제 혜택 추적</p>
          <p className="mt-1 text-lg font-black">AVO BENEFIT</p>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-cream">
          <div className="h-8 w-8 rounded-full bg-seed" />
        </div>
      </div>
    </div>
  );
}
