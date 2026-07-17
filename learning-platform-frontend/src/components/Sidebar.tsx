'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useJourney } from '@/context/JourneyContext';
import { Search, Compass, Target, BarChart2, LogOut, ChevronRight, Play, Sparkles, Lock, Home } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, journeyNodes } = useJourney();

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Search', icon: Search, action: () => setIsPanelOpen(!isPanelOpen) },
    { name: 'Explorer', icon: Compass, path: '/explorer' },
    { name: 'Arena', icon: Target, path: '/arena' },
    { name: 'Analytics', icon: BarChart2, path: '/analytics' },
  ];

  // Extract history and next-steps for the panel
  const allSubtopics = journeyNodes?.flatMap(n => n.subtopics || []) || [];
  const historyTopics = allSubtopics.filter(s => s.nodeType === 'history');
  const suggestedTopics = allSubtopics.filter(s => s.nodeType === 'next-step' || s.nodeType === 'recommended').slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsPanelOpen(false);
    router.push(`/arena?topic=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="relative z-50 flex h-full">
      {/* Main Sidebar */}
      <aside className="flex w-[80px] flex-col items-center py-6 bg-slate-900 border-r border-white/10 shadow-2xl relative z-20">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-orange-500 shadow-lg mb-8">
          <Sparkles className="text-white" size={24} />
        </div>
        
        <nav className="flex-1 flex flex-col items-center gap-6 mt-4 w-full">
          {navItems.map((item) => {
            const isActive = item.path ? pathname === item.path : (item.name === 'Search' && isPanelOpen);
            
            // Inline icon rendering to completely avoid Turbopack named export mapping bugs
            const renderIcon = (name: string, active: boolean) => {
              const className = `mb-1 transition-transform ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'group-hover:scale-110'}`;
              switch(name) {
                case 'Dashboard': return <Home size={24} className={className} />;
                case 'Search': return <Search size={24} className={className} />;
                case 'Explorer': return <Compass size={24} className={className} />;
                case 'Arena': return <Target size={24} className={className} />;
                case 'Analytics': return <BarChart2 size={24} className={className} />;
                default: return <div className={className}>?</div>;
              }
            };

            return (
              <button 
                key={item.name}
                onClick={() => {
                  if (item.action) item.action();
                  else if (item.path) {
                    setIsPanelOpen(false);
                    router.push(item.path);
                  }
                }}
                className={`relative group flex flex-col items-center justify-center w-full py-3 transition-all ${
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-full bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                )}
                {renderIcon(item.name, isActive)}
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto w-full flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-white shadow-inner">
            {user?.name?.charAt(0) || '?'}
          </div>
          <Link href="/login" className="text-slate-600 hover:text-red-400 transition-colors">
            <LogOut size={20} />
          </Link>
        </div>
      </aside>

      {/* Slide-out Interactive Panel */}
      <div 
        className={`absolute left-[80px] top-0 h-full w-[400px] bg-white/70 backdrop-blur-3xl border-r border-white/40 shadow-2xl transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-10 flex flex-col ${
          isPanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-8 pb-4">
          <h2 className="text-2xl font-black text-slate-900 mb-6 font-heading tracking-tight">Explore</h2>
          
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <Search className="absolute left-4 text-slate-400" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any topic..."
                className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-sm font-medium focus:ring-0 outline-none text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
          
          {/* Recent History */}
          {historyTopics.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Your Journey</h3>
              <div className="flex flex-col gap-3">
                {historyTopics.map(topic => (
                  <div 
                    key={topic.id}
                    onClick={() => { setIsPanelOpen(false); router.push(`/arena?topic=${topic.id}`); }}
                    className="group relative bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-orange-300 hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full rounded-tr-xl"></div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-800 group-hover:text-orange-600 transition-colors">{topic.name}</span>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-orange-500 transform group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">
                      Mastery: <span className={topic.score && topic.score >= 80 ? 'text-green-500' : 'text-orange-500'}>{topic.score ?? 0}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested / Fog of War */}
          {suggestedTopics.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Suggested For You</h3>
              <div className="flex flex-col gap-3">
                {suggestedTopics.map(topic => (
                  <div 
                    key={topic.id}
                    onClick={() => {
                      if (topic.state !== 'locked') {
                        setIsPanelOpen(false);
                        router.push(`/arena?topic=${topic.id}`);
                      }
                    }}
                    className={`group relative bg-slate-50/80 border border-slate-200 border-dashed rounded-xl p-4 transition-all ${
                      topic.state === 'locked' ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:border-blue-400 hover:bg-white hover:shadow-md hover:-translate-y-1'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${topic.state === 'locked' ? 'bg-slate-300' : 'bg-blue-400 glow'}`}></div>
                        <span className={`font-bold text-sm ${topic.state === 'locked' ? 'text-slate-500' : 'text-slate-700'}`}>{topic.name}</span>
                      </div>
                      {!topic.state || topic.state !== 'locked' ? (
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={10} className="text-blue-600 ml-0.5" fill="currentColor" />
                        </div>
                      ) : (
                        <Lock size={14} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Backdrop for mobile (optional) */}
      {isPanelOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-0 md:hidden"
          onClick={() => setIsPanelOpen(false)}
        ></div>
      )}
    </div>
  );
}
