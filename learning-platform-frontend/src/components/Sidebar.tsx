'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Syllabus', path: '/topics' },
    { name: 'Arena', path: '/arena' },
    { name: 'Analytics', path: '/analytics' },
  ];

  const [user, setUser] = React.useState<{name: string, email: string} | null>(null);

  React.useEffect(() => {
    fetch('http://localhost:4000/api/users/me')
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error("Failed to fetch user:", err));
  }, []);

  return (
    <aside className="hidden md:flex w-[160px] flex-col bg-white z-20 border-r border-[#e4e5e7]">
      <div className="flex h-16 shrink-0 items-center px-6">
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link 
              key={item.name}
              href={item.path} 
              className={`flex items-center px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors border border-transparent ${
                isActive 
                  ? 'bg-[#f4f5f7] text-[#111214]' 
                  : 'text-[#6b6e75] hover:bg-[#f4f5f7] hover:text-[#111214]'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 bg-[#fcfcfc]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111214] text-xs font-bold text-white">
            {user ? user.name.charAt(0) : '...'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-[#111214] truncate">{user ? user.name : 'Loading...'}</span>
            <span className="text-xs text-[#6b6e75] truncate">{user ? user.email : ''}</span>
          </div>
        </div>
        <Link href="/login" className="mt-3 flex w-full justify-center items-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#111214] bg-white border border-[#e4e5e7] hover:border-[#111214] rounded-lg transition-colors shadow-sm">
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
