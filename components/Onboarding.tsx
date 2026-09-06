import Link from "next/link";
import { MergeIcon, PlusIcon, RefreshIcon } from "./icons";
import { SYNC_SCHEDULE_LABEL } from "@/lib/sync-schedule";

const STEPS = [
  {
    icon: PlusIcon,
    title: "Add your teammates",
    body: "One GitHub username each. Nothing else to configure.",
  },
  {
    icon: RefreshIcon,
    title: "Let the first sync run",
    body: `The tracker ${SYNC_SCHEDULE_LABEL}, or press Sync now in the header to pull straight away.`,
  },
  {
    icon: MergeIcon,
    title: "Watch merged PRs land",
    body: "Pending PRs, issues and reviews are tracked for context; only merged pull requests are counted.",
  },
];

/** First screen of a fresh install — the only thing that matters here is step one. */
export function Onboarding() {
  return (
    <section className="rise flex flex-col gap-6 rounded-card border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <span className="eyebrow !text-lime">Get started</span>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Nobody is on the board yet</h2>
        <p className="max-w-xl text-[15px] text-ink-muted">
          Add the people whose open source work you want on the record. Everything after that happens on its own.
        </p>
      </div>

      <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-col gap-2 rounded-2xl border border-line-soft bg-surface-2 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-bg text-lime">
              <s.icon width={17} height={17} />
            </span>
            <span className="num text-[11px] font-bold text-ink-dim">STEP {i + 1}</span>
            <span className="font-extrabold">{s.title}</span>
            <span className="text-[13px] leading-snug text-ink-muted">{s.body}</span>
          </li>
        ))}
      </ol>

      <Link
        href="/members"
        className="flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-lime text-sm font-extrabold text-bg transition hover:bg-lime-soft sm:w-auto sm:self-start sm:px-6"
      >
        <PlusIcon width={16} height={16} strokeWidth={2.6} />
        Add your first teammate
      </Link>
    </section>
  );
}
