"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`mb-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-ink-mute transition-colors hover:bg-canvas hover:text-ink md:justify-center ${collapsed ? "lg:justify-center" : "lg:justify-start"}`}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      )}
      <span className={`hidden ${collapsed ? "" : "lg:block"}`}>
        {isDark ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}
