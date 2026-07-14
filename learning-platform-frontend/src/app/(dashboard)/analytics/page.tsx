import React from 'react';

export default function AnalyticsPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center px-8 border-b border-[#e4e5e7] bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <h1 className="font-heading text-lg font-bold text-[#111214]">History & Analytics</h1>
      </header>
      <div className="p-8">
        <div className="mx-auto max-w-5xl h-full flex flex-col gap-6">
          <p className="text-[#6b6e75]">This page will show the student&apos;s performance logs and areas requiring spaced repetition.</p>
        </div>
      </div>
    </>
  );
}
