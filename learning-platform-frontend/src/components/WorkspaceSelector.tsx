"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  ChevronDown,
  CircleHelp,
  CirclePlay,
  Layers3,
  SquarePen,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import TopicPickerDialog from "@/components/search/TopicPickerDialog";
import { apiFetch } from "@/lib/api";
import {
  learningScopeFromSearchParams,
  learningUrl,
  scopeToParams,
} from "@/lib/learning";
import { practiceHref } from "@/lib/practice";
import type {
  LearningDashboardPayload,
  LearningScope,
} from "@/lib/learning-types";

function scopedHref(path: string, scope: LearningScope) {
  // scope may be a full backend topic state at runtime; narrow to scope keys.
  const params = scopeToParams(scope);
  return `${path}?${params.toString()}`;
}

export default function WorkspaceSelector({
  compact = false,
}: {
  compact?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dashboard, setDashboard] = useState<LearningDashboardPayload | null>(
    null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(
        await apiFetch<LearningDashboardPayload>("/api/learning/dashboard"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const routeScope = learningScopeFromSearchParams(searchParams);
  const backendScope =
    dashboard?.activeTopics[0] ?? dashboard?.completedTopics[0] ?? null;
  const scope = routeScope ?? backendScope;
  const isWorkspaceRoute = [
    "/learn",
    "/practice",
    "/tests",
    "/notebook",
    "/doubts",
  ].some((route) => pathname.startsWith(route));

  return (
    <section className="relative hidden lg:block">
      <div
        className={`rounded-[1.35rem] border transition ${compact ? "border-transparent bg-transparent p-0" : "p-1.5"} ${
          isWorkspaceRoute
            ? "border-primary/25 bg-white shadow-[0_12px_30px_rgba(28,78,56,0.07)]"
            : "border-hairline bg-canvas/50"
        }`}
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={`flex w-full items-center gap-2.5 rounded-[0.95rem] bg-canvas/55 text-left transition hover:bg-primary-tint/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${compact ? "mx-auto h-10 w-10 justify-center p-0" : "p-2.5"}`}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-white">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className={compact ? "sr-only" : "min-w-0 flex-1"}>
            {loading ? (
              <span className="block h-7 w-28 rounded-full skeleton" />
            ) : scope ? (
              <>
                <span className="block truncate text-[11px] font-medium text-ink-mute">
                  {scope.subject} / {scope.chapter}
                </span>
                <span className="block truncate text-[13px] font-bold text-ink">
                  {scope.topic}
                </span>
              </>
            ) : (
              <>
                <span className="block text-[11px] font-medium text-ink-mute">
                  No topic selected
                </span>
                <span className="block text-[13px] font-semibold text-ink">
                  Choose a workspace
                </span>
              </>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-mute ${compact ? "sr-only" : ""}`}
            aria-hidden="true"
          />
        </button>

        {!compact && scope ? (
          <nav
            className="mt-2 border-t border-hairline px-0.5 pt-2"
            aria-label="Selected topic workspace"
          >
            <p className="px-1 pb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
              Topic tools
            </p>
            <WorkspaceLink
              href={learningUrl(scope)}
              label="Continue learning"
              icon={CirclePlay}
              active={pathname === "/learn"}
              featured
            />
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-canvas/70 p-1">
              <WorkspaceLink
                href={learningUrl(scope, { tab: "practice" })}
                label="Practice"
                icon={SquarePen}
                active={
                  pathname === "/learn" &&
                  searchParams.get("tab") === "practice"
                }
              />
              <WorkspaceLink
                href={practiceHref(scope)}
                label="Tests"
                icon={Timer}
                active={pathname === "/practice"}
              />
              <WorkspaceLink
                href={scopedHref("/notebook", scope)}
                label="Notebook"
                icon={BookOpenCheck}
                active={pathname === "/notebook"}
              />
              <WorkspaceLink
                href={scopedHref("/doubts", scope)}
                label="Doubts"
                icon={CircleHelp}
                active={pathname === "/doubts"}
              />
            </div>
          </nav>
        ) : null}
      </div>
      <TopicPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </section>
  );
}

function WorkspaceLink({
  href,
  label,
  icon: Icon,
  active,
  featured = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-9 items-center gap-2 rounded-lg px-2.5 text-[11px] transition ${
        featured ? "w-full" : "min-w-0 justify-start"
      } ${
        featured
          ? "bg-primary font-semibold text-white shadow-[0_7px_18px_rgba(63,111,87,0.2)] hover:bg-primary-strong"
          : active
            ? "bg-white font-semibold text-primary shadow-[0_3px_10px_rgba(20,20,30,0.06)] ring-1 ring-primary/15"
            : "font-semibold text-ink-soft hover:bg-white hover:text-ink"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${featured ? "text-white" : active ? "text-primary" : "text-ink-mute"}`}
        aria-hidden="true"
      />
      {label}
    </Link>
  );
}
