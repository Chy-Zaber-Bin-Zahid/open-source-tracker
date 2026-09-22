"use client";

/* eslint-disable @next/next/no-img-element -- remote GIFs are animated; next/image would add nothing here */

import { useEffect, useRef, useState } from "react";

/**
 * Marking a PR done means its burger party already happened. When the person
 * who pays for the burgers marks one, he has to vouch for it three times, with
 * the PRs in front of him. Purely for fun: the server does not care how many
 * times he clicked. GIFs are hotlinked from GIPHY.
 */
const gif = (id: string) => `https://media.giphy.com/media/${id}/giphy.gif`;

type Step = { gif: string; alt: string; title: string; body: (n: number) => string; yes: string; no: string };

const parties = (n: number) => (n === 1 ? "this PR" : `these ${n} PRs`);

const STEPS: Step[] = [
  {
    gif: gif("pICj6JWqVpm5aapOIS"),
    alt: "Kevin from The Office asking: are you sure?",
    title: "Sir, did the party really happen?",
    body: (n) => `You are saying the team already got burgers for ${parties(n)}:`,
    yes: "Yes, we had it",
    no: "Not yet",
  },
  {
    gif: gif("1wq8TPRtGwR8Otacey"),
    alt: "Kenan Thompson on SNL asking: do you though?",
    title: "Do you though? Really?",
    body: (n) => `Everyone ate? Nobody is still waiting for a burger for ${parties(n)}?`,
    yes: "Everyone ate",
    no: "Let me check",
  },
  {
    gif: gif("SDBVg6GZM5pV30lrkT"),
    alt: "A cartoon cloud sweating nervously",
    title: "Last chance, sir.",
    body: (n) => `Type BURGER to swear the party for ${parties(n)} already happened. The team is watching.`,
    yes: "I swear",
    no: "I panicked, cancel",
  },
];

const THANKS = { gif: gif("hC7hhvggNdbMc"), alt: "The Good Burger guy grinning among flying burgers" };

export function PayerConfirm({
  prs,
  saving,
  error,
  onConfirm,
  onClose,
}: {
  prs: { url: string; repo: string; title: string }[];
  saving: boolean;
  error: string | null;
  /** Resolves true once the burgers are saved. */
  onConfirm: () => Promise<boolean>;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Focus is placed by hand: showModal() focuses the first button itself, which
  // would put "yes" under a held Enter key and win over React's autoFocus.
  const focusRef = useRef<HTMLButtonElement & HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const [thanked, setThanked] = useState(false);

  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
    focusRef.current?.focus();
  }, [step, thanked]);
  const ready = !last || typed.trim().toLowerCase() === "burger";

  async function yes() {
    if (!last) return setStep(step + 1);
    if (await onConfirm()) setThanked(true);
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(420px,calc(100vw-32px))] rounded-card border border-line bg-surface p-0 text-ink backdrop:bg-black/70"
    >
      <div className="flex flex-col gap-4 p-5">
        {thanked ? (
          <>
            <img src={THANKS.gif} alt={THANKS.alt} className="h-[220px] w-full rounded-2xl bg-surface-2 object-cover" />
            <div className="flex flex-col gap-1.5">
              <span className="eyebrow !text-lime">Confirmed</span>
              <h2 className="text-2xl font-extrabold tracking-tight">Thank you, sir! 🍔</h2>
              <p className="text-sm text-ink-muted">
                {prs.length === 1 ? "Marked as served." : `All ${prs.length} marked as served.`} The team salutes your generosity.
              </p>
            </div>
            <button ref={focusRef} type="button" onClick={() => ref.current?.close()} className="h-[40px] rounded-[10px] bg-lime text-[14px] font-extrabold text-bg transition hover:bg-lime-soft">
              Enjoy the burgers
            </button>
          </>
        ) : (
          <>
            <img key={current.gif} src={current.gif} alt={current.alt} className="h-[220px] w-full rounded-2xl bg-surface-2 object-cover" />
            <div className="flex flex-col gap-1.5">
              <span className="eyebrow">Confirmation {step + 1} of {STEPS.length}</span>
              <h2 className="text-2xl font-extrabold tracking-tight">{current.title}</h2>
              <p className="text-sm text-ink-muted">{current.body(prs.length)}</p>
            </div>
            {step === 0 && (
              <ul className="flex max-h-[148px] flex-col gap-1.5 overflow-y-auto rounded-[10px] border border-line-soft bg-surface-2 p-3">
                {prs.map((p) => (
                  <li key={p.url} className="flex min-w-0 flex-col text-[13px]">
                    <span className="truncate font-bold">{p.title}</span>
                    <span className="num truncate text-xs text-ink-dim">{p.repo} #{p.url.split("/").pop()}</span>
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="text-sm text-coral">{error}</p>}
            {last && (
              <input
                ref={focusRef}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ready && !saving && yes()}
                placeholder="BURGER"
                aria-label="Type BURGER to confirm"
                className="num h-[40px] rounded-[10px] border border-line bg-surface-2 px-3 text-sm uppercase tracking-[0.2em] outline-none focus:border-lime"
              />
            )}
            {/* The buttons swap sides on step two, so autopilot clicking does not work. */}
            <div className={`flex gap-2 ${step === 1 ? "flex-row-reverse" : ""}`}>
              <button
                type="button"
                disabled={!ready || saving}
                onClick={yes}
                className="h-[40px] flex-1 rounded-[10px] bg-lime text-[14px] font-extrabold text-bg transition hover:bg-lime-soft disabled:opacity-40"
              >
                {saving ? "Saving…" : current.yes}
              </button>
              <button
                ref={last ? undefined : focusRef}
                type="button"
                disabled={saving}
                onClick={() => ref.current?.close()}
                className="h-[40px] flex-1 rounded-[10px] border border-line text-[14px] font-bold text-ink-muted transition hover:border-ink-dim hover:text-ink disabled:opacity-60"
              >
                {current.no}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
