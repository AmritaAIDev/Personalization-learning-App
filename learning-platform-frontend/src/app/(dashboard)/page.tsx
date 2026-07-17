'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Brain, Lock, Play, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useJourney } from '@/context/JourneyContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const { user, journeyNodes } = useJourney();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close the search panel if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchContainerRef]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/arena?topic=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Extract history and next-steps for the panel
  const allSubtopics = journeyNodes?.flatMap(n => n.subtopics || []) || [];
  const historyTopics = allSubtopics.filter(s => s.nodeType === 'history');
  const suggestedTopics = allSubtopics.filter(s => s.nodeType === 'next-step' || s.nodeType === 'recommended').slice(0, 4);
  
  // Live filter based on search query
  const searchResults = searchQuery.trim() 
    ? allSubtopics.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-6 bg-[#fafafa] relative overflow-hidden">
      
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* User Stats Bar (Floating) */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <div className="flex items-center gap-1.5 bg-orange-50 px-4 py-2 rounded-full border border-orange-100 shadow-sm">
          <span className="text-orange-500 font-bold text-sm">🔥 {user?.streak ?? 0}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 hidden sm:inline">Day Streak</span>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 shadow-sm">
          <span className="text-blue-600 font-bold text-sm">✨ {(user?.xp ?? 0).toLocaleString()}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 hidden sm:inline">XP</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--color-primary)] px-4 py-2 rounded-full shadow-md hover:scale-105 transition-transform cursor-pointer">
          <span className="text-white font-bold text-sm">Lvl {user?.level ?? 1}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 hidden sm:inline">Scholar</span>
        </div>
      </div>

      <motion.div 
        className="w-full flex flex-col items-center text-center relative z-10"
        animate={{ y: isFocused ? -80 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight text-slate-900 mb-10">
          What do you want to master today?
        </h1>
        
        {/* Dynamic Search Container */}
        <div 
          ref={searchContainerRef}
          className="relative w-full max-w-5xl flex justify-center items-start h-[400px]"
        >
          {/* Main Search Input */}
          <motion.div 
            className="absolute top-0 z-20 w-full max-w-3xl"
            animate={{ 
              x: isFocused ? -200 : 0, 
              width: isFocused ? '50%' : '100%' 
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            <form onSubmit={handleSearch} className="w-full relative group">
              <div className={`absolute -inset-1 bg-gradient-to-r from-blue-500 to-[var(--color-primary)] rounded-full blur transition duration-1000 ${isFocused ? 'opacity-50' : 'opacity-25 group-hover:opacity-40'}`}></div>
              <div className="relative flex items-center bg-white rounded-full shadow-xl border border-slate-200 overflow-hidden">
                <Search className="absolute left-6 text-slate-400" size={24} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  placeholder="Search any concept or topic..."
                  className="w-full bg-transparent border-none py-6 pl-16 pr-32 text-lg focus:ring-0 outline-none text-slate-800 placeholder:text-slate-400"
                  autoComplete="off"
                />
                <button 
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className={`absolute right-3 bg-[var(--color-primary)] text-white font-bold px-6 py-3 rounded-full hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md ${isFocused ? 'scale-90 right-2' : ''}`}
                >
                  Start
                </button>
              </div>
            </form>
          </motion.div>

          {/* Interactive Slide-Out Results Panel */}
          <AnimatePresence>
            {isFocused && (
              <motion.div 
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 250, damping: 25, delay: 0.05 }}
                className="absolute right-0 top-0 w-[45%] h-[400px] bg-white/80 backdrop-blur-xl border border-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
              >
                <div className="p-6 border-b border-slate-200/60 bg-white/50 backdrop-blur-md">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles size={18} className="text-[var(--color-primary)]" />
                    {searchQuery.trim() ? 'Neural Matches' : 'Command Center'}
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  
                  {/* LIVE SEARCH RESULTS */}
                  {searchQuery.trim() && searchResults.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {searchResults.map(topic => (
                        <div 
                          key={topic.id}
                          onClick={() => router.push(`/arena?topic=${topic.id}`)}
                          className="group flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 cursor-pointer transition-all"
                        >
                          <span className="font-semibold text-slate-700 group-hover:text-blue-700">{topic.name}</span>
                          <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  ) : searchQuery.trim() && searchResults.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                      <p>No exact matches found.</p>
                      <p className="mt-1">Press <strong className="text-slate-600">Enter</strong> to let AI generate it!</p>
                    </div>
                  ) : (
                    <>
                      {/* DEFAULT IDLE STATE: HISTORY & SUGGESTIONS */}
                      {historyTopics.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Recent Journey</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {historyTopics.slice(0,2).map(topic => (
                              <div 
                                key={topic.id}
                                onClick={() => router.push(`/arena?topic=${topic.id}`)}
                                className="group relative bg-white border border-slate-200 rounded-xl p-3 cursor-pointer hover:border-orange-300 hover:shadow-md transition-all flex items-center justify-between"
                              >
                                <div className="absolute left-0 top-0 w-1 h-full bg-orange-400 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div>
                                  <div className="font-bold text-sm text-slate-800">{topic.name}</div>
                                  <div className="text-[9px] font-bold text-orange-500 mt-0.5 uppercase tracking-wider">
                                    Mastery: {topic.score ?? 0}/100
                                  </div>
                                </div>
                                <Brain size={16} className="text-slate-300 group-hover:text-orange-500" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {suggestedTopics.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Suggested Next Steps</h4>
                          <div className="flex flex-col gap-2">
                            {suggestedTopics.map(topic => (
                              <div 
                                key={topic.id}
                                onClick={() => { if (topic.state !== 'locked') router.push(`/arena?topic=${topic.id}`) }}
                                className={`group flex items-center justify-between p-3 rounded-xl border border-dashed transition-all ${
                                  topic.state === 'locked' ? 'border-slate-200 bg-slate-50/50 grayscale opacity-60 cursor-not-allowed' : 'border-blue-200 bg-blue-50/30 cursor-pointer hover:bg-white hover:shadow-sm hover:border-blue-400'
                                }`}
                              >
                                <span className={`font-semibold text-sm ${topic.state === 'locked' ? 'text-slate-500' : 'text-slate-700'}`}>{topic.name}</span>
                                {topic.state === 'locked' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                ) : (
                                  <Play size={14} className="text-blue-500 opacity-50 group-hover:opacity-100" fill="currentColor" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
