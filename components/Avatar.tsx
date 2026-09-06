"use client";

import { useState } from "react";
import { initials } from "@/lib/format";

type Props = { login: string; name: string; size?: number; className?: string };

export function Avatar({ login, name, size = 40, className = "bg-avatar text-ink-muted" }: Props) {
  const [failed, setFailed] = useState(false);
  const radius = Math.round(size * 0.3);
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden font-extrabold ${className}`}
      style={{ width: size, height: size, borderRadius: radius, fontSize: Math.round(size * 0.35) }}
    >
      <span aria-hidden>{initials(name)}</span>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://github.com/${login}.png?size=${size * 2}`}
          alt=""
          width={size}
          height={size}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
