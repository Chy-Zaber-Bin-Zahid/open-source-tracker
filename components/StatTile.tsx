export function StatTile({ label, value, note }: { label: string; value: string; note?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface px-5 py-4">
      <span className="eyebrow">{label}</span>
      <span className="num text-[32px] font-bold leading-none tracking-[-0.03em]">{value}</span>
      {note && <span className="text-[13px] text-ink-muted">{note}</span>}
    </div>
  );
}
