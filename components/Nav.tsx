import { Suspense } from "react";
import Link from "next/link";
import { MergeIcon } from "./icons";
import { NavLinks } from "./NavLinks";
import { SyncButton } from "./SyncButton";
import { SyncStatus, SyncStatusFallback } from "./SyncStatus";

export function Nav() {
  return (
    <header className="border-b border-line-soft">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-3 sm:px-10 sm:py-0">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:gap-x-9">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-lime text-bg">
              <MergeIcon width={17} height={17} strokeWidth={2.5} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Contribution Tracker</span>
          </Link>
          <NavLinks />
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={<SyncStatusFallback />}>
            <SyncStatus />
          </Suspense>
          <SyncButton />
        </div>
      </div>
    </header>
  );
}
