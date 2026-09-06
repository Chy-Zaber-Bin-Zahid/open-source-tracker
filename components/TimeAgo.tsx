import { formatExact, isoString, timeAgo } from "@/lib/format";

/**
 * Relative time that stays machine-readable and hoverable: screen readers and
 * "copy the exact date" both need the absolute value, which bare text loses.
 */
export function TimeAgo({ value, className = "" }: { value: Date | string; className?: string }) {
  return (
    <time dateTime={isoString(value)} title={formatExact(value)} className={className}>
      {timeAgo(value)}
    </time>
  );
}
