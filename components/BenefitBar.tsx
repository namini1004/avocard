export function BenefitBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span className="text-ink">{label}</span>
        <span className="text-avocado-700">{value.toLocaleString("ko-KR")}원</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-avocado-100">
        <div className="h-full rounded-full bg-avocado-600 transition-all" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
