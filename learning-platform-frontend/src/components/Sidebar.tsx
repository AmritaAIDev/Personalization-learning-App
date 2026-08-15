"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Atom,
  Compass,
  HelpCircle,
  Home,
  LoaderCircle,
  LogOut,
  Map,
  NotebookTabs,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  ShieldCheck,
  SquarePen,
  Timer,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/diagnostic-types";
import {
  learningScopeFromSearchParams,
  learningUrl,
  scopeToParams,
} from "@/lib/learning";
import WorkspaceSelector from "@/components/WorkspaceSelector";

const navigation: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: readonly UserRole[];
}> = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Journey", href: "/journey", icon: Map },
  { label: "Learn", href: "/learn", icon: Compass },
  { label: "Practice", href: "/practice", icon: SquarePen },
  { label: "Tests", href: "/tests", icon: Timer },
  { label: "Notebook", href: "/notebook", icon: NotebookTabs },
  { label: "Doubts", href: "/doubts", icon: HelpCircle },
  { label: "Content", href: "/content", icon: PenLine, roles: ["admin"] },
  { label: "Admin", href: "/admin", icon: ShieldCheck, roles: ["admin"] },
];

const overviewLabels = new Set(["Dashboard", "Journey"]);
const planningLabels = new Set(["Content", "Admin"]);
const mobileLabels = new Set([
  "Dashboard",
  "Journey",
  "Learn",
  "Practice",
  "Tests",
]);

type CompactNavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Context-aware compact rail (phone bottom bar + tablet icon rail): on a study
  // surface with a live topic it mirrors the desktop rail's scoped topic tools;
  // everywhere else it shows the global destinations.
  const isStudySurface =
    pathname.startsWith("/learn") ||
    pathname.startsWith("/practice") ||
    pathname.startsWith("/tests");
  const scope = learningScopeFromSearchParams(searchParams);
  const compactItems: CompactNavItem[] =
    isStudySurface && scope
      ? [
          { key: "dashboard", label: "Dashboard", href: "/", icon: Home, active: pathname === "/" },
          { key: "journey", label: "Journey", href: "/journey", icon: Map, active: pathname.startsWith("/journey") },
          {
            key: "practice",
            label: "Practice",
            href: learningUrl(scope, { tab: "practice" }),
            icon: SquarePen,
            active: pathname.startsWith("/learn") && searchParams.get("tab") === "practice",
          },
          {
            key: "notebook",
            label: "Notebook",
            href: `/notebook?${scopeToParams(scope).toString()}`,
            icon: NotebookTabs,
            active: pathname.startsWith("/notebook"),
          },
          {
            key: "doubts",
            label: "Doubts",
            href: `/doubts?${scopeToParams(scope).toString()}`,
            icon: HelpCircle,
            active: pathname.startsWith("/doubts"),
          },
        ]
      : navigation
          .filter(
            (item) =>
              mobileLabels.has(item.label) &&
              (!item.roles || item.roles.includes(user?.role ?? "student")),
          )
          .map((item) => ({
            key: item.href,
            label: item.label,
            href: item.href,
            icon: item.icon,
            active:
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href),
          }));

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
      className={`fixed inset-x-0 bottom-0 z-40 flex h-[calc(4.5rem+env(safe-area-inset-bottom))] w-full items-center border-t border-hairline bg-surface/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl transition-[width,padding] duration-300 md:sticky md:top-0 md:h-screen md:w-[76px] md:shrink-0 md:flex-col md:border-r md:border-t-0 md:bg-surface md:px-3 md:py-6 md:backdrop-blur-none lg:overflow-y-auto lg:py-5 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden ${isCollapsed ? "lg:w-[76px] lg:px-3" : "lg:w-[272px] lg:px-4"}`}
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
        className="flex min-w-0 flex-1 items-center justify-around gap-1 md:block md:w-full md:space-y-1 lg:hidden"
        aria-label="Student navigation"
      >
        {compactItems.map(({ key, label, href, icon: Icon, active }) => (
          <Link
            key={key}
            href={href}
            title={label}
            aria-current={active ? "page" : undefined}
            className={`group flex h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition duration-200 md:h-10 md:flex-row md:justify-center md:gap-3 md:px-2 md:text-[13.5px] lg:justify-start lg:px-3 ${
              active
                ? "text-primary md:bg-primary-tint"
                : "text-ink-mute hover:text-ink md:hover:bg-canvas"
            }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span className="truncate md:hidden lg:block">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="hidden w-full lg:block">
        <SidebarSection
          title="Overview"
          items={navigation.filter((item) => overviewLabels.has(item.label))}
          pathname={pathname}
          collapsed={isCollapsed}
        />
        <div className="my-3 border-t border-hairline" />
        <WorkspaceSelector compact={isCollapsed} />
        {navigation.some(
          (item) =>
            planningLabels.has(item.label) &&
            (!item.roles || item.roles.includes(user?.role ?? "student")),
        ) ? (
          <SidebarSection
            title="Manage"
            items={navigation.filter(
              (item) =>
                planningLabels.has(item.label) &&
                (!item.roles || item.roles.includes(user?.role ?? "student")),
            )}
            pathname={pathname}
            collapsed={isCollapsed}
          />
        ) : null}
      </div>

      <div className="mt-auto hidden w-full shrink-0 border-t border-hairline pt-2.5 md:block">
        {error && (
          <p className="mb-3 hidden text-xs text-rose-600 lg:block" role="alert">
            {error}
          </p>
        )}
        <Link
          href="/profile"
          className={`mb-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-canvas md:justify-center ${isCollapsed ? "lg:justify-center" : "lg:justify-start"}`}
          title="Profile"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-sm font-semibold text-ink-soft ring-1 ring-hairline">
            {user?.name?.charAt(0).toUpperCase() ?? (
              <UserRound className="h-4 w-4" />
            )}
          </span>
          <span className={`hidden min-w-0 ${isCollapsed ? "" : "lg:block"}`}>
            <span className="block truncate text-[13.5px] font-semibold text-ink">
              {user?.name}
            </span>
            <span className="block truncate text-xs text-ink-mute">
              Level {user?.level}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
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
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
  collapsed,
}: {
  title: string;
  items: typeof navigation;
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
