"use client";

import { useCallback } from "react";
import {
  Atom,
  Award,
  BookOpenCheck,
  Calculator,
  Flame,
  FlaskConical,
  Footprints,
  Sparkles,
  Star,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useApiResource } from "@/lib/useApiResource";
import type { AchievementsPayload, AchievementView } from "@/lib/achievements-types";

/**
 * Icons mirror the subject-theme icons (Atom/FlaskConical/Calculator, see
 * lib/subject-theme.ts) for the subject-specific badges, so a Physics badge
 * and the Physics dashboard card read as the same thing.
 */
const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  FIRST_TEST: Footprints,
  STREAK_3: Flame,
  STREAK_7: Zap,
  PERFECT_SCORE: Trophy,
  PHYSICS_ACE: Atom,
  CHEMISTRY_WIZARD: FlaskConical,
  MATH_GENIUS: Calculator,
  XP_500: Star,
  XP_1000: Sparkles,
  ALL_ROUNDER: BookOpenCheck,
};

function AchievementChip({
  achievement,
  earned,
}: {
  achievement: AchievementView;
  earned: boolean;
}) {
  const Icon = ACHIEVEMENT_ICONS[achievement.key] ?? Award;
  return (
    <div
      title={achievement.description}
      className={`flex items-center gap-3 rounded-xl p-3 transition-colors duration-300 ${
        earned
          ? "bg-primary-tint/60 ring-1 ring-primary/15"
          : "bg-canvas ring-1 ring-hairline"
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
          earned ? "bg-primary text-white" : "bg-surface text-ink-mute"
        }`}
      >
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[13px] font-semibold ${
            earned ? "text-ink" : "text-ink-mute"
          }`}
        >
          {achievement.name}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-ink-mute">
          {achievement.description}
        </span>
      </span>
    </div>
  );
}

export default function AchievementsPanel() {
  const fetchAchievements = useCallback(
    () => apiFetch<AchievementsPayload>("/api/achievements"),
    [],
  );
  const { data, loading, error } = useApiResource(
    fetchAchievements,
    "Achievements could not be loaded.",
  );

  if (error) return null; // non-critical widget — fail quiet on the dashboard
  if (loading && !data) {
    return (
      <section className="rounded-2xl border border-hairline bg-surface p-5 shadow-[0_10px_28px_rgba(20,20,30,0.04)] sm:p-6">
        <div className="h-5 w-40 rounded-full skeleton" />
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl skeleton" />
          ))}
        </div>
      </section>
    );
  }
  if (!data) return null;

  const total = data.earned.length + data.locked.length;

  return (
    <section
      className="rounded-2xl border border-hairline bg-surface p-5 shadow-[0_10px_28px_rgba(20,20,30,0.04)] sm:p-6"
      aria-labelledby="achievements-heading"
    >
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            Achievements
          </p>
          <h2
            id="achievements-heading"
            className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink"
          >
            Badges
          </h2>
        </div>
        <span className="text-xs font-semibold text-ink-mute">
          {data.earned.length}/{total} earned
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {data.earned.map((achievement) => (
          <AchievementChip key={achievement.key} achievement={achievement} earned />
        ))}
        {data.locked.map((achievement) => (
          <AchievementChip
            key={achievement.key}
            achievement={achievement}
            earned={false}
          />
        ))}
      </div>
    </section>
  );
}
