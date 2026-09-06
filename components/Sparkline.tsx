type Props = { values: number[]; days: string[]; name?: string };

function shortDay(key: string) {
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * Seven day buckets of merged PRs. The bars are decorative — the accessible
 * name carries the actual numbers, so this is not a chart only sighted users
 * can read.
 */
export function Sparkline({ values, days, name }: Props) {
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const busiest = values.indexOf(max);
  const summary =
    total === 0
      ? `${name ? `${name}: n` : "N"}o pull requests merged in the last 7 days`
      : `${name ? `${name}: ` : ""}${total} pull request${total === 1 ? "" : "s"} merged in the last 7 days, most on ${shortDay(days[busiest])}`;

  return (
    <div role="img" aria-label={summary} className="flex h-7 items-end gap-[3px]">
      {values.map((v, i) => (
        <span
          key={days[i] ?? i}
          title={`${shortDay(days[i])}: ${v} merged`}
          className={`w-2.5 rounded-t-[3px] ${v === 0 ? "bg-track" : "bg-lime"}`}
          style={{ height: `${v === 0 ? 15 : Math.max(20, Math.round((v / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}
