"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/queries";
import { CONTRIBUTION_TYPES, TYPE_LABEL, type ContributionType } from "@/lib/points";
import { AlertIcon, CheckIcon } from "./icons";
import { inputClass } from "./MembersManager";

/** `https://github.com/owner/repo/pull/12` → `owner/repo`, so the repo field can fill itself. */
function repoFromUrl(url: string): string | null {
  const m = url.trim().match(/^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)(?:\/|$)/i);
  return m ? `${m[1]}/${m[2]}` : null;
}

const EMPTY = { member_id: "", type: "pr_merged" as ContributionType, url: "", repo: "", title: "", occurred_at: "" };

/**
 * The GitHub search API cannot see private repos, other forges, or work that is
 * not a PR at all. This is the escape hatch for those — it writes to the same
 * table with `source = 'manual'`.
 */
export function LogContributionForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: Number(form.member_id),
          type: form.type,
          repo: form.repo.trim(),
          title: form.title.trim(),
          url: form.url.trim(),
          occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not log that contribution");
      setForm({ ...EMPTY, member_id: form.member_id, type: form.type });
      setDone("Logged. It shows up in the feed straight away.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log that contribution");
    } finally {
      setBusy(false);
    }
  }

  if (members.length === 0) return null;

  return (
    <section id="log" className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-extrabold tracking-tight">Log a contribution by hand</h2>
        <p className="max-w-2xl text-[13px] text-ink-muted">
          For work the GitHub search cannot reach — private repos, GitLab, patches sent by mail. Merged pull requests logged here count
          the same as synced ones; a later sync will not overwrite them.
        </p>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Member</span>
          <select className={inputClass} value={form.member_id} onChange={(e) => set("member_id", e.target.value)} required>
            <option value="" disabled>
              Choose a teammate
            </option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Type</span>
          <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value as ContributionType)}>
            {CONTRIBUTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="eyebrow">Link</span>
          <input
            className={inputClass}
            type="url"
            value={form.url}
            placeholder="https://github.com/owner/repo/pull/42"
            onChange={(e) => {
              const url = e.target.value;
              const repo = repoFromUrl(url);
              setForm((f) => ({ ...f, url, repo: repo && !f.repo ? repo : f.repo }));
            }}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Repository</span>
          <input className={inputClass} value={form.repo} placeholder="owner/repo" onChange={(e) => set("repo", e.target.value)} required />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Date (optional)</span>
          <input className={inputClass} type="date" value={form.occurred_at} onChange={(e) => set("occurred_at", e.target.value)} />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="eyebrow">Title</span>
          <input
            className={inputClass}
            value={form.title}
            placeholder="Fix flaky retry in the upload worker"
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </label>

        {error && (
          <p role="alert" className="flex items-start gap-1.5 text-sm text-coral sm:col-span-2">
            <AlertIcon width={15} height={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {done && (
          <p role="status" className="flex items-start gap-1.5 text-sm text-lime sm:col-span-2">
            <CheckIcon width={15} height={15} className="mt-0.5 shrink-0" />
            <span>{done}</span>
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-[10px] bg-ink px-6 text-sm font-extrabold text-bg transition hover:opacity-90 disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
        >
          {busy ? "Logging…" : "Log contribution"}
        </button>
      </form>
    </section>
  );
}
