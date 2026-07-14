import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#fafafa] font-sans selection:bg-[#111214] selection:text-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 relative bg-[#fafafa] overflow-hidden">
        
        {/* Background Grid Pattern */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-x-0 top-[-12rem] h-[34rem] bg-[radial-gradient(circle_at_top,rgba(49,51,55,0.03),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(49,51,55,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(49,51,55,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,white,transparent_80%)]"></div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
