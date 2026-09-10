import { Atom, Calculator, FlaskConical, type LucideIcon } from "lucide-react";

/**
 * Single source of truth for subject branding (icon, color, gradient).
 *
 * Subjects are free-text on the backend `topics` table (Topic.level ===
 * "SUBJECT", Topic.name is a plain string — "Physics" / "Chemistry" /
 * "Mathematics", verified against learning-platform-backend/src/scripts).
 * There is no subject enum or id on the backend, so resolution here matches
 * by substring the same way individual components used to do it inline.
 */
export interface SubjectTheme {
  id: "physics" | "chemistry" | "mathematics";
  label: string;
  icon: LucideIcon;
  tint: string;
  accent: string;
  badge: string;
  gradient: string;
}

const PHYSICS: SubjectTheme = {
  id: "physics",
  label: "Physics",
  icon: Atom,
  tint: "bg-primary-tint text-primary",
  accent: "bg-primary",
  badge: "text-primary",
  gradient:
    "linear-gradient(135deg, var(--color-primary-strong) 0%, var(--color-primary) 100%)",
};

const CHEMISTRY: SubjectTheme = {
  id: "chemistry",
  label: "Chemistry",
  icon: FlaskConical,
  tint: "bg-orange-50 text-orange-600",
  accent: "bg-orange-500",
  badge: "text-orange-700",
  gradient: "linear-gradient(135deg, #ea580c 0%, #fb923c 100%)",
};

const MATHEMATICS: SubjectTheme = {
  id: "mathematics",
  label: "Mathematics",
  icon: Calculator,
  tint: "bg-blue-50 text-blue-600",
  accent: "bg-blue-500",
  badge: "text-blue-700",
  gradient: "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)",
};

/** Ordered for grid/list rendering (Physics, Chemistry, Mathematics). */
export const SUBJECT_THEMES: readonly SubjectTheme[] = [
  PHYSICS,
  CHEMISTRY,
  MATHEMATICS,
];

/**
 * Resolves a free-text subject name (e.g. from `topics.name` or any API
 * payload's `subject` field) to its theme. Falls back to the Physics theme
 * for anything unrecognised — the same fallback the original per-component
 * logic used.
 */
export function getSubjectTheme(subject: string | null | undefined): SubjectTheme {
  const normalized = (subject ?? "").toLowerCase();
  if (normalized.includes("chem")) return CHEMISTRY;
  if (normalized.includes("math")) return MATHEMATICS;
  return PHYSICS;
}
