'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Volume2, Mic, Settings } from 'lucide-react';

export default function AvatarRenderer({ 
  isSpeaking = false, 
  duixData,
  tutorMessage 
}: { 
  isSpeaking?: boolean;
  duixData?: { conversationId: string; token: string } | null;
  tutorMessage?: string;
}) {
  const [status, setStatus] = useState<'initializing' | 'ready' | 'speaking' | 'error'>('initializing');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const duixRef = useRef<any>(null);
  const lastSpokenRef = useRef<string | null>(null);

  const addLog = (msg: string) => {
    setDebugLogs(prev => [...prev.slice(-4), msg]);
    console.log(msg);
  };

  useEffect(() => {
    if (!duixData) {
      addLog('Waiting for backend token...');
      return;
    }

    let mounted = true;
    addLog(`Got token, initializing SDK for conv: ${duixData.conversationId}`);

    const initDuix = async () => {
      try {
        // Dynamically import to avoid SSR window issues
        const DuixModule = (await import('duix-guiji-light')).default;
        const duixInstance = new DuixModule();
        duixRef.current = duixInstance;

        duixInstance.on('initialSuccess', () => {
          if (!mounted) return;
          addLog('initialSuccess fired, calling start()');
          // Must start with muted: true if no user interaction has occurred
          duixInstance.start({ openAsr: false, muted: true })
            .then((res: any) => {
              addLog(`Start success`);
              if (mounted) setStatus('ready');
            })
            .catch((err: any) => {
              addLog(`Start error: ${JSON.stringify(err)}`);
              if (mounted) setStatus('error');
            });
        });

        duixInstance.on('show', () => {
          addLog('show event fired');
          if (mounted) setStatus('ready');
        });
        
        duixInstance.on('error', (err: any) => {
          addLog(`DUIX Error: ${JSON.stringify(err)}`);
          if (mounted) setStatus('error');
        });

        addLog('Calling duix.init()...');
        // Initialize SDK
        duixInstance.init({
          sign: duixData.token,
          containerLable: '.duix-container',
          conversationId: duixData.conversationId,
          platform: 'duix.com'
        }).then(() => {
          addLog('init() promise resolved');
        }).catch((err: any) => {
          addLog(`init() catch: ${JSON.stringify(err)}`);
          if (mounted) setStatus('error');
        });

      } catch (e: any) {
        addLog(`SDK Load Failed: ${e?.message}`);
        if (mounted) setStatus('error');
      }
    };

    initDuix();

    return () => {
      mounted = false;
      if (duixRef.current) {
        try {
          duixRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [duixData]);

  // Handle incoming tutor messages
  useEffect(() => {
    if (tutorMessage && tutorMessage !== lastSpokenRef.current && status === 'ready') {
      lastSpokenRef.current = tutorMessage;
      if (duixRef.current) {
        addLog(`Speaking: ${tutorMessage.substring(0, 20)}...`);
        duixRef.current.speak({ content: tutorMessage }).catch((e: any) => addLog(`Speak error: ${e}`));
      }
    }
  }, [tutorMessage, status]);

  // Handle speaking state visualization
  useEffect(() => {
    if (status !== 'initializing' && status !== 'error') {
      setStatus(isSpeaking ? 'speaking' : 'ready');
    }
  }, [isSpeaking, status]);

  const handleUnmute = () => {
    if (duixRef.current) {
      duixRef.current.setVideoMuted(false);
      if (duixRef.current.resume) duixRef.current.resume();
      addLog('Unmuted manually');
      // Speak a test message so user hears it immediately
      duixRef.current.speak({ content: "I am ready and listening." });
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#111214] shadow-2xl border border-white/10 group flex-shrink-0">
      
      <style dangerouslySetInnerHTML={{__html: `
        .duix-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .duix-container video, .duix-container canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          background: transparent !important;
        }
      `}} />
      
      {/* The actual DUIX video container */}
      <div className="duix-container absolute inset-0 z-0"></div>

      {/* Dynamic Background Glow when active */}
      <div className={`absolute inset-0 z-10 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent transition-opacity duration-1000 pointer-events-none ${status === 'speaking' ? 'opacity-100' : 'opacity-30'}`}></div>
      
      {/* Placeholder Avatar Visual (only shows if SDK is not ready yet) */}
      {status === 'initializing' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-[#111214]">
          <div className="relative animate-pulse">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              <User size={48} className="text-white/60" />
            </div>
          </div>
        </div>
      )}

      {/* Debug Logs Overlay */}
      <div className="absolute top-12 left-4 z-30 pointer-events-none text-left">
        {debugLogs.map((log, i) => (
          <div key={i} className="text-[10px] font-mono text-green-400 bg-black/60 px-1.5 py-0.5 rounded mb-1 whitespace-pre-wrap max-w-[90%]">
            &gt; {log}
          </div>
        ))}
      </div>

      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-[#111214]">
          <div className="text-red-400 font-medium text-sm">Failed to load Avatar</div>
        </div>
      )}

      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative flex h-2 w-2">
            {status === 'speaking' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${status === 'initializing' ? 'bg-orange-500' : status === 'error' ? 'bg-red-500' : 'bg-green-500'}`}></span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
            {status === 'initializing' ? 'Syncing...' : status === 'error' ? 'Disconnected' : 'Tutor Active'}
          </span>
        </div>
        <button className="text-white/60 hover:text-white transition-colors pointer-events-auto" onClick={handleUnmute}>
          <Volume2 size={14} />
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 w-full p-4 flex justify-center items-center gap-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto">
        <button className="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-all text-sm font-semibold border border-white/10 shadow-lg" onClick={handleUnmute}>
          Click to Unmute
        </button>
      </div>
    </div>
  );
}
