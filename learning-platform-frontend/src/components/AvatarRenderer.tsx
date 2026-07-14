'use client';

import React, { useState, useEffect } from 'react';
import { User, Volume2, Mic, Settings } from 'lucide-react';

export default function AvatarRenderer() {
  const [status, setStatus] = useState<'initializing' | 'ready' | 'speaking'>('initializing');

  useEffect(() => {
    // Simulate SDK initialization
    const timer = setTimeout(() => {
      setStatus('ready');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-[#111214] shadow-2xl border border-white/10 group">
      {/* Dynamic Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent transition-opacity duration-1000 ${status === 'speaking' ? 'opacity-100' : 'opacity-30'}`}></div>
      
      {/* Placeholder Avatar Visual */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`relative transition-transform duration-700 ${status === 'speaking' ? 'scale-105' : 'scale-100'}`}>
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)]">
            <User size={48} className={`text-white/60 transition-all ${status === 'speaking' ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : ''}`} />
          </div>
          {/* Speaking rings */}
          {status === 'speaking' && (
            <>
              <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-ping" style={{ animationDuration: '2s' }}></div>
              <div className="absolute -inset-4 rounded-full border border-purple-400/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
            </>
          )}
        </div>
      </div>

      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            {status !== 'initializing' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'initializing' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
            {status === 'initializing' ? 'Neural Link Syncing...' : 'Tutor Active'}
          </span>
        </div>
        <button className="text-white/60 hover:text-white transition-colors">
          <Settings size={14} />
        </button>
      </div>

      {/* Bottom Controls (Mock) */}
      <div className="absolute bottom-0 left-0 w-full p-4 flex justify-center items-center gap-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all">
          <Mic size={16} />
        </button>
        <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all">
          <Volume2 size={16} />
        </button>
      </div>
      
      {/* SDK Drop-in Hint */}
      <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none">
        <span className="text-[10px] text-white/30 font-medium">Duix SDK Container Target</span>
      </div>
    </div>
  );
}
