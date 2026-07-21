'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Atom,
  BookOpen,
  ClipboardCheck,
  Compass,
  History,
  Home,
  LoaderCircle,
  LogOut,
  PlayCircle,
  UserRound,
  WandSparkles,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/diagnostic-types';

const navigation: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: readonly UserRole[];
}> = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Learn', href: '/learn', icon: Compass },
  { label: 'Practice', href: '/arena', icon: PlayCircle },
  { label: 'Baseline', href: '/diagnostic', icon: ClipboardCheck },
  { label: 'Curriculum', href: '/topics', icon: BookOpen },
  { label: 'History', href: '/profile', icon: History },
  { label: 'Content', href: '/content', icon: WandSparkles, roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setIsSigningOut(true);
    try {
      await logout();
      router.replace('/login');
      router.refresh();
    } catch {
      setError('Could not sign out. Please try again.');
      setIsSigningOut(false);
    }
  };

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] w-full items-center border-t border-[#4a4b50] bg-[#313337] px-2 text-[#d6d7da] shadow-[0_-12px_30px_rgba(49,51,55,0.15)] md:sticky md:top-0 md:h-screen md:w-[84px] md:shrink-0 md:flex-col md:border-r md:border-t-0 md:px-3 md:py-5 lg:w-64 lg:px-4">
      <Link
        href="/"
        className="mb-8 hidden items-center justify-center gap-3 text-white lg:flex lg:justify-start"
        aria-label="JEE AI Competency Engine dashboard"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e31540] text-white shadow-[0_10px_24px_rgba(227,21,64,0.32)]">
          <Atom className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="hidden leading-tight lg:block">
          <span className="block font-heading text-xl font-bold tracking-tight">JEE AI</span>
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#f7b9c8]">Competency engine</span>
        </span>
      </Link>

      <nav className="flex min-w-0 flex-1 items-center justify-around gap-1 md:block md:w-full md:space-y-2" aria-label="Student navigation">
        {navigation.filter((item) => !item.roles || item.roles.includes(user?.role ?? 'student')).map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={`flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-bold transition-colors md:flex-row md:justify-center md:gap-3 md:text-sm lg:justify-start lg:px-3 ${
                active
                  ? 'bg-[#e31540] text-white shadow-[0_10px_20px_rgba(227,21,64,0.24)]'
                  : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate md:hidden lg:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden w-full md:block">
        {error && <p className="mb-3 hidden text-xs text-[#f7b9c8] lg:block" role="alert">{error}</p>}
        <Link href="/profile" className="mb-3 flex items-center justify-center gap-3 rounded-xl p-2 hover:bg-white/10 lg:justify-start" title="Profile">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#4a4b50] text-sm font-bold text-[#f7b9c8]">
            {user?.name?.charAt(0).toUpperCase() ?? <UserRound className="h-4 w-4" />}
          </span>
          <span className="hidden min-w-0 lg:block">
            <span className="block truncate text-sm font-semibold text-white">{user?.name}</span>
            <span className="block truncate text-xs text-[#aeb0b5]">Level {user?.level}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isSigningOut}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#aeb0b5] transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 lg:justify-start"
        >
          {isSigningOut ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <LogOut className="h-5 w-5" aria-hidden="true" />}
          <span className="hidden lg:block">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
