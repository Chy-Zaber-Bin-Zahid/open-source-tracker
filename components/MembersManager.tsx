"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { AlertIcon, TrashIcon } from "./icons";

export const inputClass =
  "h-11 w-full rounded-[10px] border border-line bg-bg px-3.5 text-sm text-ink outline-none placeholder:text-ink-dim focus:border-lime";

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-1.5 text-sm text-coral">
      <AlertIcon width={15} height={15} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function MembersManager({ initial, orgName = null }: { initial: Member[]; orgName?: string | null }) {
  const router = useRouter();
  const [members, setMembers] = useState(initial);
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Which member is one click away from deletion, plus any failure to report.
  const [confirming, setConfirming] = useState<number | null>(null);
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_login: login, display_name: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not add member");
      setMembers((m) => [...m, data].sort((a, b) => a.display_name.localeCompare(b.display_name)));
      setLogin("");
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add member");
    } finally {
      setBusy(false);
    }
  }

  /** The API refuses these too; disabling the button just avoids a pointless round trip. */
  const protectedByOrg = (member: Member) => Boolean(orgName) && member.org_member;

  async function remove(member: Member) {
    setRowError(null);
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Could not remove ${member.display_name}`);
      }
      setMembers((m) => m.filter((x) => x.id !== member.id));
      setConfirming(null);
      router.refresh();
    } catch (err) {
      setRowError({ id: member.id, message: err instanceof Error ? err.message : "Could not remove member" });
    }
    setMembers((m) => m.filter((x) => x.id !== member.id));
    setError(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <form onSubmit={add} className="flex flex-col gap-3 self-start rounded-card border border-line bg-surface p-5">
        <h2 className="text-lg font-extrabold tracking-tight">Add a teammate</h2>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">GitHub username</span>
          <input className={inputClass} value={login} onChange={(e) => setLogin(e.target.value)} placeholder="octocat" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Display name (optional)</span>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mona Lisa" />
        </label>
        {error && <FormError>{error}</FormError>}
        <button
          type="submit"
          disabled={busy}
          className="mt-1 h-11 rounded-[10px] bg-lime text-sm font-extrabold text-bg transition hover:bg-lime-soft disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add teammate"}
        </button>
        <p className="text-[13px] text-ink-dim">Their public pull requests are pulled in on the next sync.</p>
      </form>

      <div className="self-start overflow-hidden rounded-card border border-line bg-surface">
        {members.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-dim">No one yet. Add yourself first.</p>}
        {members.map((m, i) => (
          <div key={m.id} className={`flex flex-col gap-2 px-5 py-3.5 ${i > 0 ? "border-t border-line-soft" : ""}`}>
            <div className="flex items-center gap-3">
              <Avatar login={m.github_login} name={m.display_name} />
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/members/${m.github_login}`} className="truncate font-bold hover:text-lime">
                  {m.display_name}
                </Link>
                <a
                  href={`https://github.com/${m.github_login}`}
                  target="_blank"
                  rel="noreferrer"
                  className="num truncate text-xs text-ink-dim hover:text-lime"
                >
                  @{m.github_login}
                </a>
              </div>

              {/* Members still in a required org cannot be removed at all; the rest get a
                  two-step delete in the page's own styling rather than a native confirm(). */}
              {protectedByOrg(m) ? (
                <button
                  type="button"
                  disabled
                  title={`Members still in ${orgName} cannot be removed`}
                  aria-label={`Remove ${m.display_name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-ink-dim disabled:pointer-events-none disabled:opacity-30"
                >
                  <TrashIcon />
                </button>
              ) : confirming === m.id ? (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => remove(m)}
                    className="h-9 rounded-[10px] bg-coral px-3 text-[13px] font-extrabold text-bg transition hover:opacity-90"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="h-9 rounded-[10px] border border-line px-3 text-[13px] font-bold text-ink-muted transition hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRowError(null);
                    setConfirming(m.id);
                  }}
                  aria-label={`Remove ${m.display_name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-ink-dim transition hover:bg-surface-2 hover:text-coral"
                >
                  <TrashIcon />
                </button>
              )}
            </div>

            {confirming === m.id && (
              <p className="text-[13px] text-ink-muted">
                This also deletes every contribution logged for {m.display_name}. A later sync will re-add them if they are added back.
              </p>
            )}
            {rowError?.id === m.id && <FormError>{rowError.message}</FormError>}
          </div>
        ))}
      </div>
    </div>
  );
}
