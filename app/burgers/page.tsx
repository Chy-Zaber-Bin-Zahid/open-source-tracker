import { BurgerBoard } from "@/components/BurgerBoard";
import { StatTile } from "@/components/StatTile";
import { authConfigured, burgerAdmins, getViewer, isBurgerAdmin } from "@/lib/auth";
import { burgerSince, getBurgerPRs } from "@/lib/burgers";
import { formatNumber } from "@/lib/format";
import { APP_TZ } from "@/lib/tz";

export const dynamic = "force-dynamic";

const AUTH_ERRORS: Record<string, string> = {
  failed: "GitHub sign-in did not complete. Try again.",
  unavailable: "GitHub sign-in is not set up on this deployment yet.",
};

export default async function BurgersPage({ searchParams }: { searchParams: Promise<{ auth?: string }> }) {
  const [prs, viewer, { auth }] = await Promise.all([getBurgerPRs(), getViewer(), searchParams]);
  const done = prs.filter((p) => p.done).length;
  const admins = burgerAdmins();
  const since = burgerSince().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: APP_TZ });

  return (
    <div className="flex flex-col gap-8 pt-11">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="eyebrow !text-lime">Burgers</span>
          <h1 className="text-[40px] font-extrabold leading-[0.95] tracking-[-0.035em] sm:text-[48px]">Burger parties</h1>
          <p className="max-w-xl text-[15px] text-ink-muted">
            One round of burgers for every merged pull request. Tracked since {since}.
          </p>
        </div>
        <Account viewer={viewer?.login ?? null} canMark={isBurgerAdmin(viewer?.login)} ready={authConfigured()} admins={admins} />
      </div>

      {auth && AUTH_ERRORS[auth] && (
        <p className="rounded-2xl border border-coral/40 bg-coral/10 px-5 py-3 text-sm text-coral">{AUTH_ERRORS[auth]}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Merged PRs" value={formatNumber(prs.length)} note={`since ${since}`} />
        <StatTile label="Burgers done" value={formatNumber(done)} note={done === 1 ? "party held" : "parties held"} />
        <StatTile label="Burgers due" value={formatNumber(prs.length - done)} note="still to celebrate" />
      </div>

      <BurgerBoard prs={prs} canMark={isBurgerAdmin(viewer?.login)} />
    </div>
  );
}

function Account({ viewer, canMark, ready, admins }: { viewer: string | null; canMark: boolean; ready: boolean; admins: string[] }) {
  const who = admins.length ? admins.map((a) => `@${a}`).join(", ") : "nobody yet";
  if (!viewer) {
    return (
      <div className="flex flex-col items-start gap-2 md:items-end">
        {ready ? (
          <a href="/api/auth/github" className="flex h-[38px] items-center rounded-[10px] bg-ink px-4 text-[13px] font-extrabold text-bg transition hover:bg-white">
            Sign in with GitHub
          </a>
        ) : (
          <span className="text-[13px] text-ink-dim">GitHub sign-in is not set up yet.</span>
        )}
        <span className="text-xs text-ink-dim">Only {who} can mark parties done.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <div className="flex items-center gap-3">
        <span className="num text-[13px] text-ink-muted">@{viewer}</span>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="flex h-[34px] items-center rounded-[10px] border border-line px-3 text-[13px] font-bold text-ink-muted transition hover:border-ink-dim hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
      <span className="text-xs text-ink-dim">{canMark ? "You can mark parties done." : `View only. Only ${who} can mark parties done.`}</span>
    </div>
  );
}
