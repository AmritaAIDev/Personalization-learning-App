"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Admins get a purpose-built console (student review + content authoring),
 * never the learner workspace — the sidebar already hides those links, this
 * closes the gap for anyone who types or bookmarks a learner URL directly.
 */
const ADMIN_ALLOWED_PREFIXES = ["/admin", "/content", "/profile"];

function isAllowedForAdmin(pathname: string): boolean {
  return ADMIN_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Browser-level route gate; every protected API route is also enforced server-side. */
export default function DashboardAccess({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const blockedForAdmin = user?.role === "admin" && !isAllowedForAdmin(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (blockedForAdmin) {
      router.replace("/admin");
    }
  }, [loading, router, user, blockedForAdmin]);

  if (loading || !user || blockedForAdmin) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-canvas">
        <div
          className="flex items-center gap-3 text-sm font-semibold text-ink-soft"
          role="status"
        >
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          {blockedForAdmin
            ? "Redirecting to the admin console…"
            : "Loading your learning workspace…"}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
