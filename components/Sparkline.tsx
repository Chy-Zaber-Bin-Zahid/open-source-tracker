export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-7 items-end gap-[3px]" title="Merged PRs per day, last 7 days">
      {values.map((v, i) => {
        const pct = v === 0 ? 15 : Math.max(20, Math.round((v / max) * 100));
        return (
          <div
            key={i}
            className={`w-2.5 rounded-t-[3px] ${v === 0 ? "bg-[#3a3a2c]" : "bg-lime"}`}
            style={{ height: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}
