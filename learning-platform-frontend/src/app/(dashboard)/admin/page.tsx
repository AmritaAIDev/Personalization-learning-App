"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CircleAlert,
  Flame,
  GraduationCap,
  LoaderCircle,
  ShieldCheck,
  Trophy,
  UserRoundCheck,
  UserRoundCog,
  UserRoundX,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiFetch } from "@/lib/api";
import type { UserRole } from "@/lib/diagnostic-types";
import type { AdminOverview, AdminUserRecord } from "@/lib/admin-types";
import StudentDetailDrawer from "@/components/admin/StudentDetailDrawer";

export default function AdminConsolePage() {
  const { user, refreshAuth } = useAuth();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    void Promise.allSettled([
      apiFetch<{ users: AdminUserRecord[] }>("/api/users", {
        memoryCacheTtlMs: 0,
      }),
      apiFetch<AdminOverview>("/api/admin/overview", { memoryCacheTtlMs: 0 }),
    ])
      .then(([usersResult, overviewResult]) => {
        if (!active) return;
        if (usersResult.status === "fulfilled") {
          setUsers(usersResult.value.users);
          setError(null);
        } else {
          setError("The student directory could not be loaded.");
        }
        if (overviewResult.status === "fulfilled") {
          setOverview(overviewResult.value);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.role]);

  const updateRole = async (userId: string, role: UserRole) => {
    if (actingId) return;
    setActingId(userId);
    setError(null);
    setNotice(null);
    try {
      await apiFetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setUsers((current) =>
        current.map((u) => (u.id === userId ? { ...u, role } : u)),
      );
      setNotice(
        role === "admin"
          ? "User promoted to admin."
          : "User demoted to student.",
      );
      if (userId === user?.id) void refreshAuth();
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : "The role could not be updated.",
      );
    } finally {
      setActingId(null);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl items-center p-6 sm:p-10">
        <section className="w-full rounded-[2rem] border border-hairline bg-surface p-8 text-center shadow-[0_18px_45px_rgba(20,20,30,0.07)] sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-tint text-primary">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-ink">
            Admin access required
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-ink-soft">
            The admin console is restricted to platform administrators.
          </p>
        </section>
      </div>
    );
  }

  const students = users.filter((u) => u.role === "student");

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
      <header className="flex flex-col gap-4 border-b border-hairline pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[13px] font-medium text-ink-mute">
            Platform administration
          </p>
          <h1 className="mt-2 font-heading page-title text-ink">
            Admin console
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            Review every learner&apos;s progress and history, and manage
            administrator access. Curriculum and question authoring live
            under Content.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-primary-tint px-3 py-2 text-xs font-bold text-emerald-800 lg:self-auto">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Admin-only
        </span>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" aria-hidden="true" />}
          label="Students"
          value={overview?.totalStudents ?? students.length}
        />
        <StatCard
          icon={<Flame className="h-4 w-4" aria-hidden="true" />}
          label="Active today"
          value={overview?.activeToday ?? 0}
        />
        <StatCard
          icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
          label="Avg level"
          value={overview?.avgLevel ?? 0}
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
          label="Avg XP"
          value={overview?.avgXp ?? 0}
        />
      </div>

      {error ? (
        <p
          className="mt-6 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700"
          role="alert"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      {notice ? (
        <p
          className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-semibold text-emerald-800"
          role="status"
        >
          <UserRoundCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      <section className="mt-6 rounded-[1.75rem] border border-hairline bg-surface p-5 shadow-[0_14px_34px_rgba(20,20,30,0.05)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-tint text-primary">
            <UserRoundCog className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold text-ink">
              All accounts
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              {users.length} registered user{users.length === 1 ? "" : "s"}.
              Click a row to review a student&apos;s history and path.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-5 space-y-3" aria-label="Loading users">
            <div className="h-20 rounded-2xl skeleton" />
            <div className="h-20 rounded-2xl skeleton" />
          </div>
        ) : users.length === 0 ? (
          <p className="mt-5 rounded-xl bg-canvas px-4 py-8 text-center text-sm leading-6 text-ink-soft">
            No accounts have been created yet.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-[0.12em] text-ink-mute">
                  <th className="border-b border-hairline px-3 py-3">User</th>
                  <th className="border-b border-hairline px-3 py-3">Role</th>
                  <th className="border-b border-hairline px-3 py-3">Level</th>
                  <th className="border-b border-hairline px-3 py-3">XP</th>
                  <th className="border-b border-hairline px-3 py-3">Streak</th>
                  <th className="border-b border-hairline px-3 py-3">Joined</th>
                  <th className="border-b border-hairline px-3 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="cursor-pointer align-middle transition hover:bg-canvas"
                    onClick={() => setViewingId(u.id)}
                  >
                    <td className="border-b border-hairline px-3 py-3">
                      <p className="font-semibold text-ink">{u.name}</p>
                      <p className="text-xs text-ink-mute">{u.email}</p>
                    </td>
                    <td className="border-b border-hairline px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                          u.role === "admin"
                            ? "bg-primary-tint text-emerald-800"
                            : "bg-canvas text-ink-soft"
                        }`}
                      >
                        {u.role === "admin" ? (
                          <UserRoundCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <UserRoundX className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {u.role === "admin" ? "Admin" : "Student"}
                      </span>
                    </td>
                    <td className="border-b border-hairline px-3 py-3 font-semibold text-ink">
                      {u.level}
                    </td>
                    <td className="border-b border-hairline px-3 py-3 text-ink-soft">
                      {u.xp.toLocaleString()}
                    </td>
                    <td className="border-b border-hairline px-3 py-3 text-ink-soft">
                      {u.streak} day{u.streak === 1 ? "" : "s"}
                    </td>
                    <td className="border-b border-hairline px-3 py-3 text-ink-soft">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td
                      className="border-b border-hairline px-3 py-3 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={actingId === u.id || (u.id === user?.id && u.role === "admin")}
                        title={
                          u.id === user?.id && u.role === "admin"
                            ? "You cannot demote your own administrator role."
                            : undefined
                        }
                        onClick={() =>
                          void updateRole(
                            u.id,
                            u.role === "admin" ? "student" : "admin",
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-hairline px-3 py-2 text-xs font-bold text-ink-soft hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actingId === u.id ? (
                          <LoaderCircle
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : u.role === "admin" ? (
                          <UserRoundX className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <UserRoundCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <StudentDetailDrawer studentId={viewingId} onClose={() => setViewingId(null)} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-mute">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary-tint text-primary">
          {icon}
        </span>
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
