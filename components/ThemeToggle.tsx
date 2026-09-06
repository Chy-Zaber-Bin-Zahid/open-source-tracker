"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "./icons";

type Theme = "system" | "light" | "dark";

const ORDER: Theme[] = ["system", "light", "dark"];
const LABEL: Record<Theme, string> = { system: "Following the system theme", light: "Light theme", dark: "Dark theme" };

export const THEME_STORAGE_KEY = "tracker-theme";

/**
 * Which icon shows is decided by CSS from the `data-theme` attribute the boot
 * script already set, not by React state — that keeps the button correct on the
 * very first paint and avoids a hydration mismatch.
 */
export function ThemeToggle() {
  function cycle(e: React.MouseEvent<HTMLButtonElement>) {
    const root = document.documentElement;
    const current = (root.getAttribute("data-theme") as Theme) ?? "system";
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length] ?? "light";

    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the choice just will not survive a reload.
    }

    const button = e.currentTarget;
    button.title = `${LABEL[next]}. Click to switch.`;
    button.setAttribute("aria-label", `${LABEL[next]}. Click to switch theme.`);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title="Switch theme"
      aria-label="Switch theme between system, light and dark"
      className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-line text-ink-muted transition hover:border-ink-dim hover:text-ink"
    >
      <span className="theme-icon theme-icon-system">
        <MonitorIcon width={17} height={17} />
      </span>
      <span className="theme-icon theme-icon-light">
        <SunIcon width={17} height={17} />
      </span>
      <span className="theme-icon theme-icon-dark">
        <MoonIcon width={17} height={17} />
      </span>
    </button>
  );
}
