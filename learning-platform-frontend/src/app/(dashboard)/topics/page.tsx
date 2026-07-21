'use client';

import React, { useState } from 'react';
import { Search, ChevronRight, Lock, CheckCircle2, PlayCircle, Sparkles, BookOpen, FlaskConical, Calculator, Trophy, Medal, Award, Flame } from 'lucide-react';
import Link from 'next/link';
import { useJourney, JourneyNode, Subtopic } from '@/context/JourneyContext';

export default function SyllabusPage() {
  const { journeyNodes, loading } = useJourney();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

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

  const getThemeForSubject = (subject: string) => {
    const s = subject.toLowerCase();
    if (s.includes('physic')) return { bg: 'bg-blue-500', text: 'text-blue-500', hex: '#3b82f6', icon: <BookOpen className="text-blue-500" size={32} /> };
    if (s.includes('chemist')) return { bg: 'bg-orange-500', text: 'text-orange-500', hex: '#f97316', icon: <FlaskConical className="text-orange-500" size={32} /> };
    if (s.includes('math')) return { bg: 'bg-emerald-500', text: 'text-emerald-500', hex: '#10b981', icon: <Calculator className="text-emerald-500" size={32} /> };
    return { bg: 'bg-[var(--color-primary)]', text: 'text-[var(--color-primary)]', hex: '#e31540', icon: <Flame className="text-[var(--color-primary)]" size={32} /> };
  };

  const getMasteryBadge = (mastery: number) => {
    if (mastery >= 90) return { name: 'Diamond', icon: <Trophy size={14} className="text-blue-500" />, color: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (mastery >= 70) return { name: 'Gold', icon: <Award size={14} className="text-yellow-600" />, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    if (mastery >= 40) return { name: 'Silver', icon: <Medal size={14} className="text-gray-500" />, color: 'bg-gray-100 text-gray-700 border-gray-200' };
    return { name: 'Bronze', icon: <Medal size={14} className="text-orange-500" />, color: 'bg-orange-50 text-orange-700 border-orange-200' };
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-[#8f939b]">Loading Skill Tree...</div>;
  }

  const renderChapterCard = (chapter: JourneyNode) => {
    const isLocked = chapter.state === 'locked';
    const isActive = chapter.state === 'active';
    const isCompleted = chapter.state === 'completed';

    return (
      <div key={chapter.id} className={`snap-start shrink-0 w-[300px] sm:w-[350px] bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] relative group flex flex-col ${isActive ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/10' : 'border-[#e4e5e7]'}`}>
        
        <div className="flex justify-between items-start mb-4">
          <h3 className={`font-heading text-[15px] font-bold leading-snug line-clamp-2 ${isLocked ? 'text-[#8f939b]' : 'text-foreground'}`}>{chapter.name}</h3>
          <div className="shrink-0 ml-2 bg-[#f4f5f7] p-1.5 rounded-full">
            {isLocked && <Lock size={16} className="text-[#8f939b]" />}
            {isCompleted && <CheckCircle2 size={16} className="text-green-500" />}
            {isActive && <Sparkles size={16} className="text-orange-500 animate-pulse" />}
          </div>
        </div>

        <div className="flex-1 space-y-2 mt-auto">
          {chapter.subtopics && chapter.subtopics.slice(0, 3).map((sub: Subtopic, i: number) => {
            const isMatch = searchQuery && sub.name.toLowerCase().includes(searchQuery.toLowerCase());
            return (
              <div key={i} className={`flex items-center justify-between p-2 rounded-lg transition-all text-xs ${
                isLocked ? 'bg-[#f4f5f7] opacity-50' : 
                isMatch ? 'bg-blue-50 ring-1 ring-blue-500 text-blue-700 font-bold' :
                'bg-[#f4f5f7] hover:bg-[#e4e5e7] text-[#313337] cursor-pointer'
              }`}>
                <span className="truncate pr-2 font-medium">{sub.name}</span>
                {!isLocked && (
                  <Link href={sub.id ? `/arena?topic=${sub.id}` : `/arena?topic=${chapter.id}`} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle size={14} className="text-foreground" />
                  </Link>
                )}
              </div>
            );
          })}
          {chapter.subtopics && chapter.subtopics.length > 3 && (
            <div className="text-[10px] text-center font-bold text-[#8f939b] pt-1">
              +{chapter.subtopics.length - 3} MORE TOPICS
            </div>
          )}
        </div>
        
        {isActive && (
          <Link href={`/arena?topic=${chapter.id}`} className="mt-4 block w-full text-center bg-[var(--color-primary)] text-white text-xs font-bold py-2 rounded-lg shadow-md hover:bg-[var(--color-primary-light)] transition-colors">
            Continue Learning
          </Link>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 justify-between border-b border-[#e4e5e7]/50">
        <h1 className="font-heading text-lg font-bold text-foreground flex items-center">
          {selectedSubject ? (
            <button onClick={() => setSelectedSubject(null)} className="flex items-center hover:text-[var(--color-primary)] transition-colors mr-2">
              <ChevronRight className="rotate-180 mr-1" size={18} /> Back
            </button>
          ) : 'Syllabus Hub'}
        </h1>
        
        {/* Global Search */}
        <div className="relative w-64 hidden sm:block">
          <input 
            type="text" 
            placeholder="Search topics..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f4f5f7] border border-transparent rounded-full py-1.5 pl-9 pr-4 text-xs focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] outline-none transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f939b]" size={14} />
        </div>
      </header>

      <div className="p-6 h-[calc(100vh-3.5rem)] overflow-y-auto relative bg-[#fafafa]">
        {selectedSubject && (
          <div
            className="absolute inset-0 pointer-events-none transition-colors duration-1000 opacity-20"
            style={{ background: `radial-gradient(circle at top right, ${getThemeForSubject(selectedSubject).hex}33, transparent 40%)` }}
          ></div>
        )}
        
        <div className="mx-auto max-w-6xl flex flex-col gap-8 pb-20 relative z-10">

          {!selectedSubject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map(subject => {
                const stats = getSubjectStats(subject);
                const theme = getThemeForSubject(subject);
                const badge = getMasteryBadge(stats.averageMastery);

                return (
                  <div 
                    key={subject}
                    onClick={() => setSelectedSubject(subject)}
                    className="group cursor-pointer rounded-3xl bg-white border border-[#e4e5e7] p-6 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-transparent hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col min-h-[280px]"
                  >
                    <div className={`absolute -right-10 -top-10 w-40 h-40 opacity-5 rounded-full ${theme.bg} group-hover:opacity-10 group-hover:scale-150 transition-all duration-700`}></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-[#f8f9fa] p-3 rounded-2xl border border-[#e4e5e7] shadow-sm">
                        {theme.icon}
                      </div>
                      
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shadow-sm ${badge.color}`}>
                        {badge.icon} {badge.name} Mastery
                      </div>
                    </div>

                    <div className="flex-1">
                      <h2 className="font-heading text-2xl font-bold text-foreground mb-1">{subject}</h2>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8f939b]">JEE Advanced Core</p>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <div className={`text-3xl font-heading font-black tracking-tight ${theme.text}`}>{stats.averageMastery}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground">{stats.completed}/{stats.total} <span className="text-[#8f939b] font-medium">Done</span></div>
                        </div>
                      </div>
                      
                      <div className="h-2.5 w-full bg-[#f4f5f7] rounded-full overflow-hidden flex shadow-inner">
                        <div className={`h-full ${theme.bg}`} style={{ width: `${(stats.completed / stats.total) * 100}%` }}></div>
                        <div className="h-full bg-[var(--color-primary)] animate-pulse" style={{ width: `${(stats.active / stats.total) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#e4e5e7]">
                    {getThemeForSubject(selectedSubject).icon}
                  </div>
                  <div>
                    <h2 className={`font-heading text-3xl font-bold text-foreground`}>{selectedSubject} Matrix</h2>
                    <p className="text-sm font-medium text-[#6b6e75] mt-1">Select a chapter to enter the Arena.</p>
                  </div>
                </div>
                
                <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border bg-white shadow-sm ${getMasteryBadge(getSubjectStats(selectedSubject).averageMastery).color}`}>
                  {getMasteryBadge(getSubjectStats(selectedSubject).averageMastery).icon}
                  <span className="font-bold text-sm">Level: {getMasteryBadge(getSubjectStats(selectedSubject).averageMastery).name}</span>
                </div>
              </div>

              {/* In Progress / Active */}
              {getSubjectStats(selectedSubject).chapters.filter(c => c.state === 'active').length > 0 && (
                <div className="mb-10">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4 pl-3 border-l-4 border-orange-500 flex items-center gap-2">
                    <Sparkles size={18} className="text-orange-500" /> In Progress
                  </h3>
                  <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar snap-x snap-mandatory px-1">
                    {getSubjectStats(selectedSubject).chapters.filter(c => c.state === 'active').map(renderChapterCard)}
                  </div>
                </div>
              )}

              {/* Completed */}
              {getSubjectStats(selectedSubject).chapters.filter(c => c.state === 'completed').length > 0 && (
                <div className="mb-10">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4 pl-3 border-l-4 border-green-500 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-500" /> Completed
                  </h3>
                  <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar snap-x snap-mandatory px-1">
                    {getSubjectStats(selectedSubject).chapters.filter(c => c.state === 'completed').map(renderChapterCard)}
                  </div>
                </div>
              )}

              {/* Locked / Up Next */}
              {getSubjectStats(selectedSubject).chapters.filter(c => c.state === 'locked').length > 0 && (
                <div className="mb-10 opacity-70 hover:opacity-100 transition-opacity duration-300">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4 pl-3 border-l-4 border-[#8f939b] flex items-center gap-2">
                    <Lock size={18} className="text-[#8f939b]" /> Locked & Upcoming
                  </h3>
                  <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar snap-x snap-mandatory px-1">
                    {getSubjectStats(selectedSubject).chapters.filter(c => c.state === 'locked').map(renderChapterCard)}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </>
  );
}
