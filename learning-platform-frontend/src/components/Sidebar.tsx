'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Atom,
  BookOpen,
  ClipboardCheck,
  Compass,
  HelpCircle,
  Home,
  LoaderCircle,
  LogOut,
  Map,
  NotebookTabs,
  PenLine,
  SquarePen,
  Timer,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/diagnostic-types';
import WorkspaceSelector from '@/components/WorkspaceSelector';

const navigation: Array<{
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: readonly UserRole[];
}> = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Journey', href: '/journey', icon: Map },
  { label: 'Learn', href: '/learn', icon: Compass },
  { label: 'Practice', href: '/practice', icon: SquarePen },
  { label: 'Tests', href: '/tests', icon: Timer },
  { label: 'Notebook', href: '/notebook', icon: NotebookTabs },
  { label: 'Doubts', href: '/doubts', icon: HelpCircle },
  { label: 'Baseline', href: '/diagnostic', icon: ClipboardCheck },
  { label: 'Curriculum', href: '/topics', icon: BookOpen },
  { label: 'Content', href: '/content', icon: PenLine, roles: ['admin'] },
];

const workspaceLabels = new Set(['Learn', 'Practice', 'Tests', 'Notebook', 'Doubts']);
const overviewLabels = new Set(['Dashboard', 'Journey']);
const planningLabels = new Set(['Baseline', 'Curriculum', 'Content']);

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
    <aside className="fixed inset-x-0 bottom-0 z-40 flex h-[68px] w-full items-center border-t border-hairline bg-surface/85 px-2 backdrop-blur-xl md:sticky md:top-0 md:h-screen md:w-[76px] md:shrink-0 md:flex-col md:border-r md:border-t-0 md:bg-surface md:px-3 md:py-6 md:backdrop-blur-none lg:w-[272px] lg:px-4 lg:py-7">
      <Link
        href="/"
        className="mb-8 hidden items-center gap-2.5 md:flex md:justify-center lg:justify-start lg:px-2"
        aria-label="JEE AI Competency Engine dashboard"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <Atom className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="hidden leading-none lg:block">
          <span className="block text-[15px] font-semibold tracking-tight text-ink">JEE AI</span>
        </span>
      </Link>

      <nav
        className="flex min-w-0 flex-1 items-center justify-around gap-1 md:block md:w-full md:space-y-1 lg:hidden"
        aria-label="Student navigation"
      >
        {navigation
          .filter((item) => !item.roles || item.roles.includes(user?.role ?? 'student'))
          .map(({ label, href, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            const workspaceItem = workspaceLabels.has(label);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`group flex h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-[10px] font-medium transition-all duration-200 md:h-10 md:flex-row md:justify-center md:gap-3 md:text-[13.5px] lg:justify-start lg:px-3 ${workspaceItem ? 'lg:hidden' : ''} ${
                  active
                    ? 'text-primary md:bg-primary-tint'
                    : 'text-ink-mute hover:text-ink md:hover:bg-canvas'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                <span className="truncate md:hidden lg:block">{label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="hidden w-full lg:block">
        <SidebarSection
          title="Overview"
          items={navigation.filter((item) => overviewLabels.has(item.label))}
          pathname={pathname}
        />
        <div className="my-6 border-t border-hairline" />
        <WorkspaceSelector />
        <div className="my-6 border-t border-hairline" />
        <SidebarSection
          title="Learning plan"
          items={navigation.filter(
            (item) =>
              planningLabels.has(item.label) &&
              (!item.roles || item.roles.includes(user?.role ?? 'student')),
          )}
          pathname={pathname}
        />
      </div>

      <div className="mt-auto hidden w-full md:block">
        {error && (
          <p className="mb-3 hidden text-xs text-primary lg:block" role="alert">
            {error}
          </p>
        )}
        <Link
          href="/profile"
          className="mb-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-canvas md:justify-center lg:justify-start"
          title="Profile"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-sm font-semibold text-ink-soft ring-1 ring-hairline">
            {user?.name?.charAt(0).toUpperCase() ?? <UserRound className="h-4 w-4" />}
          </span>
          <span className="hidden min-w-0 lg:block">
            <span className="block truncate text-[13.5px] font-semibold text-ink">{user?.name}</span>
            <span className="block truncate text-xs text-ink-mute">Level {user?.level}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isSigningOut}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium text-ink-mute transition-colors hover:bg-canvas hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 md:justify-center lg:justify-start"
        >
          {isSigningOut ? (
            <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
          )}
          <span className="hidden lg:block">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: typeof navigation;
  pathname: string;
}) {
  return (
    <section>
      <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-mute">{title}</p>
      <nav className="space-y-1" aria-label={title}>
        {items.map(({ label, href, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary-tint text-primary shadow-[0_6px_16px_rgba(20,20,30,0.035)]'
                  : 'text-ink-soft hover:bg-canvas hover:text-ink'
              }`}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
