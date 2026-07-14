'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Lock, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useJourney, JourneyNode, Subtopic } from '@/context/JourneyContext';

export default function SyllabusPage() {
  const { journeyNodes, loading } = useJourney();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Dynamically derive subjects from the backend data
  const subjects = Array.from(new Set(journeyNodes.map(n => n.subject))).filter(Boolean);
  
  const getSubjectStats = (subject: string) => {
    const chapters = journeyNodes.filter(n => n.subject === subject);
    const completed = chapters.filter(c => c.state === 'completed').length;
    const active = chapters.filter(c => c.state === 'active').length;
    const locked = chapters.filter(c => c.state === 'locked').length;
    const totalScore = chapters.reduce((sum, c) => sum + (c.score || 0), 0);
    const averageMastery = chapters.length > 0 && (completed > 0 || active > 0) ? Math.round(totalScore / (completed + active)) : 0;
    
    return { chapters, completed, active, locked, total: chapters.length, averageMastery };
  };

  // Dynamic theme generator for any subject that might come from the DB
  const getThemeForSubject = (subject: string) => {
    const themes = [
      { bg: 'bg-blue-500', text: 'text-blue-500', accent: 'border-blue-500/20', hex: '#3b82f6' },
      { bg: 'bg-orange-500', text: 'text-orange-500', accent: 'border-orange-500/20', hex: '#f97316' },
      { bg: 'bg-emerald-500', text: 'text-emerald-500', accent: 'border-emerald-500/20', hex: '#10b981' },
      { bg: 'bg-purple-500', text: 'text-purple-500', accent: 'border-purple-500/20', hex: '#a855f7' },
      { bg: 'bg-pink-500', text: 'text-pink-500', accent: 'border-pink-500/20', hex: '#ec4899' }
    ];
    // Hash the subject name to consistently pick a theme
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % themes.length;
    return themes[index];
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-[#8f939b]">Loading Skill Tree...</div>;
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 justify-between">
        <h1 className="font-heading text-lg font-bold text-[#111214]">
          {selectedSubject ? (
            <button onClick={() => setSelectedSubject(null)} className="flex items-center hover:text-blue-600 transition-colors">
              <ChevronRight className="rotate-180 mr-1" size={18} /> Back to Hub
            </button>
          ) : 'Skill Tree Hub'}
        </h1>
        
        {/* Global Search */}
        <div className="relative w-64">
          <input 
            type="text" 
            placeholder="Search subtopics (e.g. Limits)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f4f5f7] border-none rounded-full py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-[#111214] outline-none"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f939b]" size={14} />
        </div>
      </header>

      <div className="p-6 h-[calc(100vh-3.5rem)] overflow-y-auto relative">
        {selectedSubject && (
          <div
            className="absolute inset-0 pointer-events-none transition-colors duration-1000"
            style={{ background: `linear-gradient(to bottom, transparent, ${getThemeForSubject(selectedSubject).hex}0d)` }}
          ></div>
        )}
        <div className="mx-auto max-w-5xl flex flex-col gap-8 pb-20 relative z-10">

          {!selectedSubject ? (
            // TIER 1: The Bento Box Subject Hub
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subjects.map(subject => {
                const stats = getSubjectStats(subject);
                const theme = getThemeForSubject(subject);
                return (
                  <div 
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className="group cursor-pointer rounded-3xl bg-white border border-[#e4e5e7] p-6 shadow-sm hover:shadow-2xl hover:border-transparent hover:-translate-y-2 transition-all duration-300 relative overflow-hidden flex flex-col min-h-[300px]"
                    style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                  >
                    <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 ${theme.bg} group-hover:opacity-30 transition-opacity duration-500`}></div>
                    
                    <div className="flex-1">
                      <h2 className="font-heading text-2xl font-bold text-[#111214] mb-2 group-hover:translate-x-2 transition-transform duration-300">{subject}</h2>
                      <p className="text-sm font-medium text-[#6b6e75]">JEE Advanced Core</p>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <div className={`text-4xl font-heading font-bold ${theme.text}`}>{stats.averageMastery}%</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8f939b]">Mastery</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#111214]">{stats.completed}/{stats.total}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8f939b]">Chapters</div>
                        </div>
                      </div>
                      
                      {/* Mini Progress Bar */}
                      <div className="h-2 w-full bg-[#f4f5f7] rounded-full overflow-hidden flex">
                        <div className={`h-full ${theme.bg}`} style={{ width: `${(stats.completed / stats.total) * 100}%` }}></div>
                        <div className="h-full bg-[#111214]" style={{ width: `${(stats.active / stats.total) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // TIER 2: The Vertical Skill Tree
            <div className="flex flex-col items-center relative">
              <div className="w-full text-center mb-12">
                <h2 className={`font-heading text-4xl font-bold ${getThemeForSubject(selectedSubject).text}`}>{selectedSubject} Path</h2>
                <p className="text-sm text-[#6b6e75] mt-2">Master each node to unlock the next chapter.</p>
              </div>

              {/* Vertical Path Line */}
              <div className="absolute top-32 bottom-0 w-1 bg-[#e4e5e7] rounded-full z-0 left-1/2 -translate-x-1/2"></div>

              {getSubjectStats(selectedSubject).chapters.map((chapter, index) => {
                const isLeft = index % 2 === 0;
                const isLocked = chapter.state === 'locked';
                const isActive = chapter.state === 'active';
                const isCompleted = chapter.state === 'completed';

                return (
                  <div key={chapter.id} className={`w-full max-w-3xl relative z-10 flex items-center justify-between mb-16 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                    
                    {/* Chapter Card */}
                    <div className={`w-[45%] bg-white rounded-2xl p-5 shadow-lg border ${isActive ? 'border-[#111214] ring-4 ring-[#111214]/5' : 'border-[#e4e5e7]'} transition-all hover:scale-[1.02] relative group`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`font-heading text-lg font-bold ${isLocked ? 'text-[#8f939b]' : 'text-[#111214]'}`}>{chapter.name}</h3>
                        {isLocked && <Lock size={16} className="text-[#8f939b]" />}
                        {isCompleted && <CheckCircle2 size={18} className="text-green-500" />}
                        {isActive && <Sparkles size={18} className="text-orange-500 animate-pulse" />}
                      </div>

                      {/* Subtopics List */}
                      <div className="space-y-2 mt-4">
                        {chapter.subtopics && chapter.subtopics.map((sub: Subtopic, i: number) => {
                          const isMatch = searchQuery && sub.name.toLowerCase().includes(searchQuery.toLowerCase());
                          const isMuted = searchQuery && !isMatch;

                          return (
                            <div key={i} className={`flex items-center justify-between p-2 rounded-lg transition-all duration-300 ${
                              isLocked ? 'bg-[#f4f5f7] opacity-50' : 
                              isMatch ? 'bg-blue-50 ring-2 ring-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-[1.02] z-10 relative' :
                              isMuted ? 'bg-[#f8f9fa] opacity-20 grayscale' :
                              'bg-[#f8f9fa] hover:bg-[#f0f1f3] cursor-pointer'
                            }`}>
                              <span className="text-xs font-semibold text-[#313337]">{sub.name}</span>
                              {!isLocked && (
                                <Link href={sub.id ? `/arena?topic=${sub.id}` : `/arena?topic=${chapter.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <PlayCircle size={14} className="text-[#111214]" />
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Node Dot on the central line */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                      <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 border-white shadow-md' :
                        isActive ? 'bg-[#111214] border-white ring-4 ring-[#111214]/20 shadow-md' :
                        'bg-white border-[#e4e5e7]'
                      }`}>
                        {isCompleted && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        {isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                      </div>
                    </div>

                    {/* Empty Space for the other side */}
                    <div className="w-[45%]"></div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
