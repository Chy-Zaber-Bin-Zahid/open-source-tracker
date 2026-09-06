import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-5 pt-16">
      <span className="num text-[64px] font-bold leading-none tracking-[-0.05em] text-ink-dim">404</span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Nothing here</h1>
        <p className="max-w-lg text-[15px] text-ink-muted">
          That page does not exist. If you were looking for a teammate, they may not be on the board yet.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="flex h-11 items-center rounded-[10px] bg-lime px-5 text-sm font-extrabold text-bg transition hover:bg-lime-soft">
          Back to contributions
        </Link>
        <Link
          href="/members"
          className="flex h-11 items-center rounded-[10px] border border-line px-5 text-sm font-bold text-ink-muted transition hover:border-ink-dim hover:text-ink"
        >
          Manage members
        </Link>
      </div>
    </div>
  );
}
