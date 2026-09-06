"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Contributions" },
  { href: "/members", label: "Members" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-5 text-sm font-bold">
      {links.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={active ? "text-ink" : "text-ink-dim transition hover:text-ink-muted"}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
