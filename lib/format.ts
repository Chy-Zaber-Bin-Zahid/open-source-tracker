import { APP_TZ } from "./tz";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function timeAgo(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** Absolute timestamp for tooltips and <time> titles, in the office timezone. */
export function formatExact(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toLocaleString("en-US", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Machine-readable value for the `datetime` attribute. */
export function isoString(input: Date | string): string {
  return (typeof input === "string" ? new Date(input) : input).toISOString();
}
