export function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl border border-avocado-900/10 bg-white p-5 shadow-soft">
      <p className="text-sm font-bold text-avocado-800/70">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
      {sub ? <p className="mt-2 text-sm leading-6 text-ink/60">{sub}</p> : null}
    </div>
  );
}
