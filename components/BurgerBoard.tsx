"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BurgerPR } from "@/lib/burgers";
import { RepoBadge } from "./member-lists";
import { BurgerIcon, CheckIcon } from "./icons";
import { PayerConfirm } from "./PayerConfirm";
import { timeAgo } from "@/lib/format";

const PAGE_SIZE = 8;

/** The rows of one page. Clamps to the last page, so marking the final rows of a page never leaves it empty. */
function paged<T>(items: T[], page: number) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  return { rows: items.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE), current, pages, total: items.length };
}

/** `payer` is the person buying the burgers: marking asks him three times first (see PayerConfirm). */
export function BurgerBoard({ prs, canMark, payer = false }: { prs: BurgerPR[]; canMark: boolean; payer?: boolean }) {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const pending = saving || refreshing;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<BurgerPR[] | null>(null);

  const due = prs.filter((p) => !p.done);
  const done = prs.filter((p) => p.done);
  const picked = due.filter((p) => selected.has(p.url));
  const [duePage, setDuePage] = useState(0);
  const [donePage, setDonePage] = useState(0);
  const dueView = paged(due, duePage);
  const doneView = paged(done, donePage);
  // Selection survives page changes; the page button toggles only the rows in view.
  const pageAllPicked = dueView.rows.every((p) => selected.has(p.url));

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of dueView.rows) {
        if (pageAllPicked) next.delete(p.url);
        else next.add(p.url);
      }
      return next;
    });
  }

  function toggle(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  async function update(urls: string[], markDone: boolean): Promise<boolean> {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/burgers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, done: markDone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setSelected(new Set());
      startTransition(() => router.refresh());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function markPicked() {
    if (payer) {
      setError(null);
      setConfirming(picked);
    } else update(picked.map((p) => p.url), true);
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {confirming && (
        <PayerConfirm
          prs={confirming}
          saving={saving}
          error={error}
          onConfirm={() => update(confirming.map((p) => p.url), true)}
          onClose={() => setConfirming(null)}
        />
      )}
      <section className="flex flex-col self-start overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3.5 pt-5">
          <span className="text-lg font-extrabold tracking-tight">
            Burger due <span className="num text-ink-dim">· {due.length}</span>
          </span>
          {canMark && due.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={togglePage}
                className="h-[34px] rounded-[10px] border border-line px-3 text-[13px] font-bold text-ink-muted transition hover:border-ink-dim hover:text-ink disabled:opacity-60"
              >
                {pageAllPicked ? "Clear page" : "Select page"}
              </button>
              <button
                type="button"
                disabled={pending || picked.length === 0}
                onClick={markPicked}
                className="flex h-[34px] items-center gap-1.5 rounded-[10px] bg-lime px-3 text-[13px] font-extrabold text-bg transition hover:bg-lime-soft disabled:opacity-40"
              >
                <CheckIcon width={14} height={14} strokeWidth={2.8} />
                {pending ? "Saving…" : picked.length ? `Mark ${picked.length} done` : "Mark done"}
              </button>
            </div>
          )}
        </div>
        {error && <p className="px-5 pb-3 text-sm text-coral">{error}</p>}
        {due.length === 0 ? (
          <p className="border-t border-line-soft px-5 py-10 text-center text-sm text-ink-dim">Nothing due. Every merged PR has had its burgers.</p>
        ) : (
          dueView.rows.map((p) => (
            <Row key={p.url} pr={p}>
              {canMark && (
                <input
                  type="checkbox"
                  aria-label={`Select ${p.title}`}
                  checked={selected.has(p.url)}
                  disabled={pending}
                  onChange={() => toggle(p.url)}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-lime"
                />
              )}
            </Row>
          ))
        )}
        <Pager view={dueView} onPage={setDuePage} />
      </section>

      <section className="flex flex-col self-start overflow-hidden rounded-card border border-line bg-surface">
        <div className="px-5 pb-3.5 pt-5">
          <span className="text-lg font-extrabold tracking-tight">
            Burger done <span className="num text-ink-dim">· {done.length}</span>
          </span>
        </div>
        {done.length === 0 ? (
          <p className="border-t border-line-soft px-5 py-10 text-center text-sm text-ink-dim">No parties marked yet.</p>
        ) : (
          doneView.rows.map((p) => (
            <Row
              key={p.url}
              pr={p}
              action={
                canMark && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => update([p.url], false)}
                    className="shrink-0 text-xs font-bold text-ink-dim transition hover:text-coral disabled:opacity-60"
                  >
                    Undo
                  </button>
                )
              }
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-lime text-bg">
                <BurgerIcon width={13} height={13} strokeWidth={2.4} />
              </span>
            </Row>
          ))
        )}
        <Pager view={doneView} onPage={setDonePage} />
      </section>
    </div>
  );
}

/** Page indexes to show as numbers: first, last and the neighbours of the current one, with gaps as null. */
function pageNumbers(current: number, pages: number): (number | null)[] {
  const keep = new Set([0, pages - 1, current - 1, current, current + 1]);
  const out: (number | null)[] = [];
  for (let i = 0; i < pages; i++) {
    if (!keep.has(i)) continue;
    const prev = out[out.length - 1];
    if (typeof prev === "number" && i - prev > 1) out.push(i - prev === 2 ? prev + 1 : null);
    out.push(i);
  }
  return out;
}

function Pager({ view, onPage }: { view: { current: number; pages: number; total: number }; onPage: (page: number) => void }) {
  if (view.pages <= 1) return null;
  const first = view.current * PAGE_SIZE + 1;
  const last = Math.min(view.total, first + PAGE_SIZE - 1);
  const atStart = view.current === 0;
  const atEnd = view.current >= view.pages - 1;
  const box =
    "num flex h-[30px] min-w-[30px] items-center justify-center rounded-[8px] px-2 text-[13px] font-bold transition disabled:pointer-events-none disabled:opacity-30";
  const idle = `${box} text-ink-muted hover:bg-surface-2 hover:text-ink`;
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line-soft px-5 py-3">
      <span className="num text-xs text-ink-dim">
        {first}–{last} of {view.total}
      </span>
      <div className="flex items-center gap-0.5">
        <button type="button" aria-label="First page" className={idle} disabled={atStart} onClick={() => onPage(0)}>«</button>
        <button type="button" aria-label="Previous page" className={idle} disabled={atStart} onClick={() => onPage(view.current - 1)}>‹</button>
        {pageNumbers(view.current, view.pages).map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} className="num px-1 text-[13px] text-ink-dim">…</span>
          ) : (
            <button
              key={n}
              type="button"
              aria-label={`Page ${n + 1}`}
              aria-current={n === view.current ? "page" : undefined}
              className={n === view.current ? `${box} bg-lime text-bg` : idle}
              onClick={() => onPage(n)}
            >
              {n + 1}
            </button>
          ),
        )}
        <button type="button" aria-label="Next page" className={idle} disabled={atEnd} onClick={() => onPage(view.current + 1)}>›</button>
        <button type="button" aria-label="Last page" className={idle} disabled={atEnd} onClick={() => onPage(view.pages - 1)}>»</button>
      </div>
    </nav>
  );
}

function Row({ pr, children, action }: { pr: BurgerPR; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-t border-line-soft px-5 py-3.5">
      {children}
      <div className="min-w-0 flex-1">
        <a href={pr.url} target="_blank" rel="noreferrer" className="text-sm font-bold leading-snug hover:text-lime hover:underline">
          {pr.title}
        </a>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-dim">
          <RepoBadge repo={pr.repo} />
          <span>
            {pr.authors.map((a, i) => (
              <span key={a.login}>
                {i > 0 && ", "}
                <Link href={`/members/${a.login}`} className="font-bold text-ink-muted hover:text-lime">{a.name}</Link>
              </span>
            ))}
            {" · merged "}
            {timeAgo(pr.merged_at)}
          </span>
        </div>
      </div>
      {action}
    </div>
  );
}
