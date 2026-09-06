"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { TrashIcon } from "./icons";

export function MembersManager({ initial, orgName = null }: { initial: Member[]; orgName?: string | null }) {
  const router = useRouter();
  const [members, setMembers] = useState(initial);
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const data = await res.json();
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

  async function remove(member: Member) {
    if (!confirm(`Remove ${member.display_name} and all their logged contributions?`)) return;
    const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Could not remove member");
      return;
    }
    setMembers((m) => m.filter((x) => x.id !== member.id));
    setError(null);
    router.refresh();
  }

  const input = "h-11 w-full rounded-[10px] border border-line bg-bg px-3.5 text-sm text-ink outline-none placeholder:text-ink-dim focus:border-lime";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <form onSubmit={add} className="flex flex-col gap-3 self-start rounded-card border border-line bg-surface p-5">
        <span className="text-lg font-extrabold tracking-tight">Add a teammate</span>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">GitHub username</span>
          <input className={input} value={login} onChange={(e) => setLogin(e.target.value)} placeholder="octocat" required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Display name (optional)</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mona Lisa" />
        </label>
        {error && <p className="text-sm text-coral">{error}</p>}
        <button type="submit" disabled={busy} className="mt-1 h-11 rounded-[10px] bg-lime text-sm font-extrabold text-bg transition hover:bg-lime-soft disabled:opacity-60">
          {busy ? "Adding…" : "Add to the board"}
        </button>
      </form>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        {members.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-dim">No one yet. Add yourself first.</p>}
        {members.map((m, i) => (
          <div key={m.id} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? "border-t border-line-soft" : ""}`}>
            <Avatar login={m.github_login} name={m.display_name} className="bg-[#24262a] text-ink-muted" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="flex min-w-0 items-center gap-2">
                <Link href={`/members/${m.github_login}`} className="truncate font-bold hover:text-lime">{m.display_name}</Link>
                {orgName && !m.org_member && (
                  <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs font-bold text-coral" title={`Flagged by the last sync — no longer in ${orgName}`}>
                    not in {orgName}
                  </span>
                )}
              </span>
              <a href={`https://github.com/${m.github_login}`} target="_blank" rel="noreferrer" className="num truncate text-xs text-ink-dim hover:text-lime">
                @{m.github_login}
              </a>
            </div>
            <button
              type="button"
              onClick={() => remove(m)}
              disabled={Boolean(orgName) && m.org_member}
              title={orgName && m.org_member ? `Members still in ${orgName} cannot be removed` : `Remove ${m.display_name}`}
              aria-label={`Remove ${m.display_name}`}
              className="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-dim transition hover:bg-surface-2 hover:text-coral disabled:pointer-events-none disabled:opacity-30"
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
