import Link from "next/link";
import { TrophyIcon } from "./icons";
import { NavLinks } from "./NavLinks";
import { SyncButton } from "./SyncButton";
import { getLastSync } from "@/lib/queries";
import { timeAgo } from "@/lib/format";

export async function Nav() {
  const last = await getLastSync().catch(() => null);
  const label = !last ? "never synced" : last.finished_at ? `last sync ${timeAgo(last.finished_at)}` : "syncing…";
  return (
    <header className="border-b border-line-soft">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 sm:px-10 sm:py-0">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:gap-x-9">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-lime text-bg">
              <TrophyIcon width={18} height={18} strokeWidth={2.4} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Contribution Tracker</span>
          </Link>
          <NavLinks />
        </div>
        <div className="flex items-center gap-3">
          <span className="num hidden text-xs text-ink-dim sm:inline">{label}</span>
          <SyncButton />
        </div>
      </div>
    </header>
  );
}
