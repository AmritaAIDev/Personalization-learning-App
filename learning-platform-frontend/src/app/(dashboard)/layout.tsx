import React from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardAccess from '@/components/DashboardAccess';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAccess>
      <div className="flex min-h-screen bg-canvas font-sans">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      </div>
    </DashboardAccess>
  );
}
