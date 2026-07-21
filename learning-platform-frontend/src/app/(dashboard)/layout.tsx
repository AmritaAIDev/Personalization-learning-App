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
      <div className="flex min-h-screen bg-[#fafafa] font-sans selection:bg-[#e31540] selection:text-white">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-[72px] md:pb-0 bg-[radial-gradient(circle_at_top_right,rgba(227,21,64,0.055),transparent_30rem)]">
          {children}
        </main>
      </div>
    </DashboardAccess>
  );
}
