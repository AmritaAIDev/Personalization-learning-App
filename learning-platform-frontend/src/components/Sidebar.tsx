"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Atom,
  Compass,
  Ellipsis,
  HelpCircle,
  Home,
  LoaderCircle,
  LogOut,
  Map,
  Moon,
  NotebookTabs,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  ShieldCheck,
  Sun,
  SquarePen,
  Timer,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import type { UserRole } from "@/lib/diagnostic-types";
import { useBodyScrollLock } from "@/lib/use-body-scroll-lock";
import WorkspaceSelector from "@/components/WorkspaceSelector";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: readonly UserRole[];
};

/** Single source of truth for every destination in the app. */
const navigation: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Home, roles: ["student"] },
  { label: "Journey", href: "/journey", icon: Map, roles: ["student"] },
  { label: "Learn", href: "/learn", icon: Compass, roles: ["student"] },
  { label: "Practice", href: "/practice", icon: SquarePen, roles: ["student"] },
  { label: "Tests", href: "/tests", icon: Timer, roles: ["student"] },
  { label: "Notebook", href: "/notebook", icon: NotebookTabs, roles: ["student"] },
  { label: "Doubts", href: "/doubts", icon: HelpCircle, roles: ["student"] },
  { label: "Content", href: "/content", icon: PenLine, roles: ["admin"] },
  { label: "Admin", href: "/admin", icon: ShieldCheck, roles: ["admin"] },
];

const overviewLabels = new Set(["Dashboard", "Journey"]);
const studyLabels = new Set(["Learn", "Practice", "Tests", "Notebook", "Doubts"]);
const planningLabels = new Set(["Content", "Admin"]);

/** Destinations promoted to the phone/tablet bar; everything else lives in the More sheet. */
const mobilePrimaryLabels = new Set(["Dashboard", "Learn", "Practice", "Tests"]);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const morePanelRef = useRef<HTMLDivElement>(null);

  const role = user?.role ?? "student";
  const visibleItems = navigation.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
  const primaryCandidates = visibleItems.filter((item) =>
    mobilePrimaryLabels.has(item.label),
  );
  const primaryItems = primaryCandidates.length
    ? primaryCandidates
    : visibleItems.slice(0, 4);
  const primaryHrefs = new Set(primaryItems.map((item) => item.href));
  const moreItems = visibleItems.filter((item) => !primaryHrefs.has(item.href));

  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href)),
    [pathname],
  );

  useEffect(() => {
    if (!moreOpen) return;
    const panel = morePanelRef.current;
    const trigger = moreTriggerRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    first?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
        trigger?.focus();
      }
      if (event.key === "Tab" && focusable && focusable.length > 1) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  useBodyScrollLock(moreOpen);

  const handleLogout = async () => {
    setError(null);
    setIsSigningOut(true);
    try {
      await logout();
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <aside
      className={`relative z-40 fixed inset-x-0 bottom-0 flex h-[calc(4.5rem+env(safe-area-inset-bottom))] w-full items-center border-t border-hairline bg-surface/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl transition-[width,padding] duration-300 md:sticky md:top-0 md:h-screen md:w-[76px] md:shrink-0 md:flex-col md:border-r md:border-t-0 md:bg-surface md:px-3 md:py-6 md:backdrop-blur-none lg:overflow-y-auto lg:py-5 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden ${isCollapsed ? "lg:w-[76px] lg:px-3" : "lg:w-[272px] lg:px-4"}`}
    >
      <Link
        href="/"
        className={`mb-5 hidden shrink-0 items-center gap-2.5 md:flex md:justify-center ${isCollapsed ? "lg:justify-center" : "lg:justify-start lg:px-2"}`}
        aria-label="JEE AI Competency Engine dashboard"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <Atom className="h-5 w-5" aria-hidden="true" />
        </span>
        <span
          className={`hidden leading-none ${isCollapsed ? "" : "lg:block"}`}
        >
          <span className="block text-[15px] font-semibold tracking-tight text-ink">
            JEE AI
          </span>
        </span>
      </Link>

      <button
        type="button"
        onClick={() => setIsCollapsed((value) => !value)}
        className="mb-4 hidden h-8 w-full items-center justify-center rounded-lg text-ink-mute transition hover:bg-canvas hover:text-ink lg:flex"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>

      <nav
        className="flex min-w-0 flex-1 items-center justify-around gap-1 md:flex-col md:justify-start md:gap-1.5 md:self-stretch md:space-y-0 lg:hidden"
        aria-label="Primary navigation"
      >
        {primaryItems.map(({ label, href, icon: Icon }) => (
          <BarLink
            key={href}
            href={href}
            label={label}
            icon={Icon}
            active={isActive(href)}
          />
        ))}
        <button
          ref={moreTriggerRef}
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          aria-label={moreOpen ? "Close more menu" : "Open more menu"}
          className={`flex h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition duration-200 md:h-10 md:w-full md:flex-none md:flex-row md:justify-center md:gap-3 md:px-2 md:text-[13.5px] ${
            moreOpen ? "text-primary bg-primary-tint" : "text-ink-mute hover:text-ink"
          }`}
        >
          <Ellipsis className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span className="truncate md:hidden">More</span>
        </button>
      </nav>

      {moreOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-ink-solid/25 backdrop-blur-[2px] lg:hidden"
          />
          <div
            ref={morePanelRef}
            role="dialog"
            aria-modal="true"
            aria-label="More pages and account"
            className="absolute inset-x-2 bottom-full z-50 mb-2 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_24px_60px_rgba(20,20,30,0.22)] md:inset-x-auto md:bottom-auto md:left-full md:top-14 md:ml-2 md:w-64 animate-rise"
          >
            {error && (
              <p className="border-b border-hairline px-3 py-2 text-xs font-semibold text-danger" role="alert">
                {error}
              </p>
            )}
            {moreItems.length ? (
              <nav className="p-1.5" aria-label="More destinations">
                {moreItems.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition ${
                      isActive(href)
                        ? "bg-primary-tint text-primary"
                        : "text-ink-soft hover:bg-canvas hover:text-ink"
                    }`}
                  >
                    <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              </nav>
            ) : null}
            <div className="border-t border-hairline p-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-ink-soft transition hover:bg-canvas hover:text-ink"
              >
                {theme === "dark" ? (
                  <Sun className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                ) : (
                  <Moon className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                )}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <Link
                href="/profile"
                onClick={() => setMoreOpen(false)}
                className="flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-ink-soft transition hover:bg-canvas hover:text-ink"
              >
                <UserRound className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  void handleLogout();
                }}
                disabled={isSigningOut}
                className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-danger transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? (
                  <LoaderCircle className="h-[17px] w-[17px] shrink-0 animate-spin" aria-hidden="true" />
                ) : (
                  <LogOut className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                )}
                Sign out
              </button>
            </div>
          </div>
        </>
      ) : null}

      <div className="hidden w-full lg:block">
        {visibleItems.some((item) => overviewLabels.has(item.label)) ? (
          <>
            <SidebarSection
              title="Overview"
              items={visibleItems.filter((item) => overviewLabels.has(item.label))}
              pathname={pathname}
              collapsed={isCollapsed}
            />
            <div className="my-3 border-t border-hairline" />
          </>
        ) : null}
        {visibleItems.some((item) => studyLabels.has(item.label)) ? (
          <>
            <SidebarSection
              title="Study"
              items={visibleItems.filter((item) => studyLabels.has(item.label))}
              pathname={pathname}
              collapsed={isCollapsed}
            />
            <div className="my-3 border-t border-hairline" />
          </>
        ) : null}
        {role !== "admin" ? (
          <WorkspaceSelector compact={isCollapsed} />
        ) : null}
        {visibleItems.some((item) => planningLabels.has(item.label)) ? (
          <SidebarSection
            title={role === "admin" ? "Console" : "Manage"}
            items={visibleItems.filter((item) => planningLabels.has(item.label))}
            pathname={pathname}
            collapsed={isCollapsed}
          />
        ) : null}
      </div>

      <div className="mt-auto hidden w-full shrink-0 border-t border-hairline pt-2.5 md:block">
        {error && (
          <p className="mb-3 hidden text-xs text-danger lg:block" role="alert">
            {error}
          </p>
        )}
        <FooterActions
          isCollapsed={isCollapsed}
          userName={user?.name}
          level={user?.level}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={() => void handleLogout()}
          isSigningOut={isSigningOut}
        />
      </div>
    </aside>
  );
}

function BarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-current={active ? "page" : undefined}
      className={`group flex h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition duration-200 md:h-10 md:w-full md:flex-none md:flex-row md:justify-center md:gap-3 md:px-2 md:text-[13.5px] ${
        active
          ? "text-primary md:bg-primary-tint"
          : "text-ink-mute hover:text-ink md:hover:bg-canvas"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span className="truncate md:hidden lg:hidden">{label}</span>
    </Link>
  );
}

function FooterActions({
  isCollapsed,
  userName,
  level,
  theme,
  onToggleTheme,
  onLogout,
  isSigningOut,
}: {
  isCollapsed: boolean;
  userName?: string;
  level?: number;
  theme: string;
  onToggleTheme: () => void;
  onLogout: () => void;
  isSigningOut: boolean;
}) {
  const isDark = theme === "dark";
  return (
    <>
      <button
        type="button"
        onClick={onToggleTheme}
        className={`mb-1 flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-ink-mute transition-colors hover:bg-canvas hover:text-ink md:justify-center ${isCollapsed ? "lg:justify-center" : "lg:justify-start"}`}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <Sun className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        ) : (
          <Moon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        )}
        <span className={`hidden ${isCollapsed ? "" : "lg:block"}`}>
          {isDark ? "Light mode" : "Dark mode"}
        </span>
      </button>
      <Link
        href="/profile"
        className={`mb-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-canvas md:justify-center ${isCollapsed ? "lg:justify-center" : "lg:justify-start"}`}
        title="Profile"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-sm font-semibold text-ink-soft ring-1 ring-hairline">
          {userName?.charAt(0).toUpperCase() ?? (
            <UserRound className="h-4 w-4" />
          )}
        </span>
        <span className={`hidden min-w-0 ${isCollapsed ? "" : "lg:block"}`}>
          <span className="block truncate text-[13.5px] font-semibold text-ink">
            {userName}
          </span>
          <span className="block truncate text-xs text-ink-mute">
            Level {level}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={onLogout}
        disabled={isSigningOut}
        className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-ink-mute transition-colors hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 md:justify-center ${isCollapsed ? "lg:justify-center" : "lg:justify-start"}`}
      >
        {isSigningOut ? (
          <LoaderCircle
            className="h-[18px] w-[18px] animate-spin"
            aria-hidden="true"
          />
        ) : (
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
        )}
        <span className={`hidden ${isCollapsed ? "" : "lg:block"}`}>
          Sign out
        </span>
      </button>
    </>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
  collapsed,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <section>
      {title ? (
        <p
          className={
            collapsed
              ? "sr-only"
              : "mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute"
          }
        >
          {title}
        </p>
      ) : null}
      <nav
        className="space-y-0.5"
        aria-label={title || "Additional navigation"}
      >
        {items.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center gap-3 rounded-xl text-[13px] font-semibold transition duration-200 ${collapsed ? "justify-center px-0" : "px-3"} ${
                active
                  ? "bg-primary-tint text-primary shadow-[0_6px_16px_rgba(20,20,30,0.035)]"
                  : "text-ink-soft hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
              <span className={collapsed ? "sr-only" : ""}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
