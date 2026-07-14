'use client';

import React, { useState, useEffect } from 'react';
import { Play, Target } from 'lucide-react';
import Link from 'next/link';
import { useJourney, JourneyNode, Subtopic } from '@/context/JourneyContext';

export default function DashboardPage() {
  const { journeyNodes: rawJourneyNodes, loading } = useJourney();
  const [journeyNodes, setJourneyNodes] = useState<JourneyNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (rawJourneyNodes.length > 0) {
      const processWindow = (nodes: JourneyNode[]) => {
        // Find the active node to determine the current subject
        const activeIdx = nodes.findIndex((n: JourneyNode) => n.state === 'active');
        const activeNode = activeIdx !== -1 ? nodes[activeIdx] : nodes[0];
        const currentSubject = activeNode?.subject || 'Physics';

        // Filter nodes to only show the current active subject
        const subjectNodes = nodes.filter(n => n.subject === currentSubject);

        if (subjectNodes.length <= 6) return subjectNodes;
        
        const newActiveIdx = subjectNodes.findIndex((n: JourneyNode) => n.state === 'active');
        const centerIdx = newActiveIdx !== -1 ? newActiveIdx : subjectNodes.length - 1;
        
        let start = Math.max(0, centerIdx - 2);
        const end = Math.min(subjectNodes.length, start + 6);
        if (end - start < 6) start = Math.max(0, end - 6);
        return subjectNodes.slice(start, end);
      };

      setJourneyNodes(processWindow(rawJourneyNodes));
    } else {
      setJourneyNodes([]);
    }
  }, [rawJourneyNodes]);
  return (
    <>
      {/* Top Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between px-6 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#e4e5e7]">
        <h1 className="font-heading text-lg font-bold text-[#111214]">Overview</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full border border-orange-100 shadow-sm">
            <span className="text-orange-500 font-bold text-sm">🔥 3</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 hidden sm:inline">Day Streak</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 shadow-sm">
            <span className="text-blue-600 font-bold text-sm">✨ 1,250</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 hidden sm:inline">XP</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#111214] px-3 py-1 rounded-full shadow-[0_4px_10px_rgba(17,18,20,0.2)] hover:scale-105 transition-transform cursor-pointer">
            <span className="text-white font-bold text-sm">Lvl 5</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 hidden sm:inline">Scholar</span>
          </div>
        </div>
      </header>

      <div className="p-4">
        <div className="mx-auto max-w-5xl h-full flex flex-col gap-3">
          
          {/* 1. The Resume Banner */}
          {(() => {
            const defaultActive = journeyNodes.find(n => n.state === 'active') || journeyNodes[0];
            const activeNode = selectedNodeId ? journeyNodes.find(n => n.id === selectedNodeId) || defaultActive : defaultActive;
            
            if (!activeNode) return null;

            const isLocked = activeNode.state === 'locked';
            const isCompleted = activeNode.state === 'completed';

            return (
              <div className="rounded-2xl border border-[#e4e5e7] bg-white p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden transition-all duration-300">
                {/* Subtle background decoration */}
                <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_right,rgba(49,51,55,0.04),transparent_70%)] pointer-events-none"></div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`flex h-2 w-2 rounded-full ${isCompleted ? 'bg-green-500' : isLocked ? 'bg-gray-400' : 'bg-orange-500'}`}></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#8f939b]">
                      {isCompleted ? 'Mastered' : isLocked ? 'Locked Chapter' : 'Needs Attention'}
                    </span>
                  </div>
                  <h2 className="font-heading text-xl font-bold text-[#111214] mb-1">
                    {activeNode.name}
                  </h2>
                  <p className="text-xs text-[#6b6e75] max-w-lg leading-relaxed">
                    {isCompleted 
                      ? "You have already mastered this chapter. You can review it at any time to refresh your memory." 
                      : isLocked 
                      ? "Complete the previous chapters to unlock this content."
                      : "You have active subtopics to practice in this chapter. Jump into the arena to master them!"}
                  </p>
                </div>
                
                {isLocked ? (
                  <div className="shrink-0 flex items-center gap-2 rounded-full bg-[#f4f5f7] px-5 py-3 text-xs font-bold text-[#8f939b] cursor-not-allowed">
                    <Target size={14} />
                    Locked
                  </div>
                ) : (
                  <Link href={`/arena?topic=${activeNode.id}`} className="shrink-0 flex items-center gap-2 rounded-full bg-[#111214] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_16px_rgba(49,51,55,0.12)] transition-all hover:-translate-y-px hover:bg-[#313337]">
                    <Play size={14} fill="currentColor" />
                    {isCompleted ? 'Review Chapter' : 'Practice Chapter'}
                  </Link>
                )}
              </div>
            );
          })()}



          {/* 3. Learning Journey Map */}
          <div className="flex flex-col mt-0 relative z-30">
            <div className="px-6 py-2 flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-[#111214]">Your Learning Journey</h3>
            </div>
            
            <div className="relative w-full px-28 pb-24 pt-16">
              <div className="w-full relative flex items-center justify-between">
                
                {/* Connecting Energy Line */}
                <svg className="absolute top-1/2 left-0 w-full h-12 -translate-y-1/2 z-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 40">
                  {/* Base Track */}
                  <path d="M0,20 L1000,20" fill="none" stroke="#e4e5e7" strokeWidth="4" strokeLinecap="round" />
                  {/* Glowing Completed Track */}
                  <path d="M0,20 L500,20" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  {/* Active Energy Pulse */}
                  <path d="M0,20 L1000,20" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeDasharray="100 900" strokeDashoffset="0" className="opacity-60 drop-shadow-[0_0_12px_rgba(34,197,94,0.8)] animate-energy-dash" />
                </svg>

                {/* Nodes */}
                {loading || journeyNodes.length === 0 ? (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold text-[#8f939b] bg-[#f8f9fa] px-4 py-2 rounded-full shadow-sm z-20">
                    {loading ? 'Loading journey...' : 'No journey data found.'}
                  </div>
                ) : journeyNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  
                  return (
                    <div 
                      onClick={() => setSelectedNodeId(node.id)} 
                      key={node.id} 
                      className="relative z-10 flex flex-col items-center group cursor-pointer"
                    >
                      
                      {/* The Dot */}
                      <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-md ${isSelected ? 'scale-125' : 'group-hover:scale-110'} ${
                        node.state === 'completed' ? 'bg-green-500 border-white shadow-[0_0_15px_rgba(34,197,94,0.4)]' :
                        node.state === 'active' ? 'bg-[#111214] border-white shadow-[0_0_20px_rgba(17,18,20,0.6)]' :
                        'bg-[#f4f5f7] border-[#e4e5e7]'
                      }`}>
                        {node.state === 'completed' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        {node.state === 'active' && (
                          <>
                            <div className="w-2.5 h-2.5 bg-white rounded-full relative z-10"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-[#111214] animate-ping opacity-20 scale-150"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping opacity-30" style={{ animationDelay: '0.5s' }}></div>
                          </>
                        )}
                        {node.state === 'locked' && <div className="w-2 h-2 bg-[#c9cbcf] rounded-full"></div>}
                      </div>

                      {/* Node Label */}
                      <div className="absolute top-10 whitespace-nowrap flex flex-col items-center">
                        <span className={`text-sm font-bold mt-2 ${
                          node.state === 'completed' ? 'text-[#111214]' :
                          node.state === 'active' ? 'text-[#111214]' :
                          'text-[#8f939b]'
                        }`}>
                          {node.name}
                        </span>
                        {node.state !== 'locked' && node.score != null && (
                          <span className={`text-xs font-semibold ${
                            node.state === 'completed' ? 'text-green-600' : 'text-orange-500'
                          }`}>
                            {node.score}% Mastery
                          </span>
                        )}
                        {node.state === 'active' && node.score == null && (
                          <span className="text-xs font-semibold text-orange-500">
                            Not started
                          </span>
                        )}
                      </div>

                      {/* Interactive Sub-topics Tooltip (Hover) */}
                      <div className={`absolute bottom-full mb-14 left-1/2 -translate-x-1/2 w-56 transition-all duration-200 z-50 pointer-events-none ${
                        isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                      }`}>
                        <div className="bg-[#111214]/95 backdrop-blur-md rounded-xl p-4 shadow-xl border border-white/10">
                          <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-3 border-b border-white/10 pb-2">{node.name}</h4>
                          <div className="flex flex-col gap-2">
                            {node.subtopics && node.subtopics.map((sub: Subtopic, i: number) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-[13px] font-medium text-white/80">{sub.name}</span>
                                {sub.score === null ? (
                                  <span className="text-[11px] font-bold text-white/40">🔒 Locked</span>
                                ) : sub.score >= 80 ? (
                                  <span className="text-[11px] font-bold text-green-400">✓ {sub.score}%</span>
                                ) : (
                                  <span className="text-[11px] font-bold text-orange-400">⚠️ {sub.score}%</span>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#111214]/95 rotate-45 border-b border-r border-white/10"></div>
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* Final Goal Node */}
                {!loading && journeyNodes.length > 0 && (
                  <div className="relative z-10 flex flex-col items-center opacity-50">
                     <div className="w-12 h-12 rounded-full border-4 border-[#e4e5e7] bg-white flex items-center justify-center shadow-sm">
                        <Target size={20} className="text-[#8f939b]" />
                     </div>
                     <span className="absolute top-14 whitespace-nowrap text-xs font-bold uppercase tracking-widest text-[#8f939b]">Mastery</span>
                  </div>
                )}

              </div>
            </div>
            
            {/* Legend */}
            <div className="px-6 py-2 bg-transparent flex items-center gap-6 justify-center">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 <span className="text-xs font-bold text-[#6b6e75] uppercase tracking-wider">Completed</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-[#111214] ring-2 ring-[#111214]/20"></div>
                 <span className="text-xs font-bold text-[#6b6e75] uppercase tracking-wider">Active</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full border-2 border-[#e4e5e7] bg-white"></div>
                 <span className="text-xs font-bold text-[#6b6e75] uppercase tracking-wider">Locked</span>
               </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
