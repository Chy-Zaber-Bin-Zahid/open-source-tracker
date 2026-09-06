import { Suspense } from "react";
import Link from "next/link";
import { MergeIcon } from "./icons";
import { NavLinks } from "./NavLinks";
import { SyncButton } from "./SyncButton";
import { SyncStatus, SyncStatusFallback } from "./SyncStatus";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-bg/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-5 py-3 sm:min-h-[72px] sm:px-10 sm:py-0">
        <div className="flex min-w-0 items-center gap-6 sm:gap-9">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-lime text-bg">
              <MergeIcon width={17} height={17} strokeWidth={2.4} />
            </span>
            <span className="hidden text-lg font-extrabold tracking-tight sm:inline">Contribution Tracker</span>
            <span className="text-lg font-extrabold tracking-tight sm:hidden">Tracker</span>
          </Link>
          <div className="hidden md:block">
            <NavLinks />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden lg:inline">
            <Suspense fallback={<SyncStatusFallback />}>
              <SyncStatus />
            </Suspense>
          </span>
          <ThemeToggle />
          <SyncButton />
        </div>
      </div>
      {/* Below md the links get their own row rather than wrapping the header. */}
      <div className="border-t border-line-soft px-5 py-2 md:hidden">
        <NavLinks />
      </div>
    </header>
  );
}
