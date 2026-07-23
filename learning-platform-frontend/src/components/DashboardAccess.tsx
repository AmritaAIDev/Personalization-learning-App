'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/** Browser-level route gate; every protected API route is also enforced server-side. */
export default function DashboardAccess({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-[#fbfbfd]">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#52525b]" role="status">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#3f6f57]" />
          Loading your learning workspace…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
