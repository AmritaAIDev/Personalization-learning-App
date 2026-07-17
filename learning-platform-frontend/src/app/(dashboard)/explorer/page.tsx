'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useJourney, Subtopic } from '@/context/JourneyContext';
import { motion, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Lock, Play, Network, Brain } from 'lucide-react';

// --- SPIRAL LAYOUT ALGORITHM ---
// Places nodes in a dense, organic circular cluster
function generateSpiralLayout(nodes: Subtopic[], spacing: number = 200) {
  return nodes.map((node, i) => {
    // The Golden Ratio angle for tight packing
    const goldenAngle = 137.5 * (Math.PI / 180);
    const r = spacing * Math.sqrt(i);
    const theta = i * goldenAngle;
    
    return {
      ...node,
      x: r * Math.cos(theta),
      y: r * Math.sin(theta),
    };
  });
}

export default function ExplorerBubblePage() {
  const { journeyNodes, loading } = useJourney();
  const router = useRouter();
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Draggable offset state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Screen center coordinates for fisheye calculation
  const [screenCenter, setScreenCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCenter = () => {
      setScreenCenter({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      });
    };
    updateCenter();
    window.addEventListener('resize', updateCenter);
    return () => window.removeEventListener('resize', updateCenter);
  }, []);

  const layoutedNodes = useMemo(() => {
    if (!journeyNodes) return [];
    const allSubtopics = journeyNodes.flatMap(node => node.subtopics || []);
    // Sort so important nodes are closer to center (index 0)
    const sorted = [...allSubtopics].sort((a, b) => {
      if (a.nodeType === 'history') return -1;
      if (b.nodeType === 'history') return 1;
      if (a.nodeType === 'next-step') return -1;
      if (b.nodeType === 'next-step') return 1;
      return 0;
    });
    return generateSpiralLayout(sorted, 160);
  }, [journeyNodes]);

  if (loading) {
    return <div className="p-8 flex justify-center text-[#8f939b] bg-[#020617] h-[calc(100vh-3.5rem)] items-center">Igniting Universe...</div>;
  }

  return (
    <div 
      className="relative w-full h-[calc(100vh-3.5rem)] bg-[#020617] overflow-hidden"
      ref={containerRef}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* HUD Header */}
      <header className="absolute top-0 left-0 w-full p-8 z-20 pointer-events-none flex justify-between items-start">
        <div>
          <h1 className="font-heading text-3xl font-black text-white flex items-center gap-3 drop-shadow-md tracking-tight">
            <Network size={28} className="text-orange-500" />
            Knowledge Universe
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium tracking-wide">
            Drag to explore the cosmos. Center topics dilate for closer inspection.
          </p>
        </div>
      </header>

      {/* Draggable Canvas using Framer Motion */}
      <motion.div
        drag
        dragConstraints={{ left: -3000, right: 3000, top: -3000, bottom: 3000 }}
        dragElastic={0.1}
        dragMomentum={true}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)} // delay to prevent click trigger
        onDrag={(e, info) => {
          // Update offset state to trigger re-renders for the fisheye scale effect
          setOffset({ x: info.offset.x, y: info.offset.y });
        }}
        className="absolute top-1/2 left-1/2 w-0 h-0 will-change-transform cursor-grab active:cursor-grabbing"
      >
        {layoutedNodes.map((node) => {
          
          // --- FISHEYE DISTORTION OPTICS ---
          // Calculate where the node currently sits on the screen
          const screenX = screenCenter.x + node.x + offset.x;
          const screenY = screenCenter.y + node.y + offset.y;
          
          const dx = screenX - screenCenter.x;
          const dy = screenY - screenCenter.y;
          const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
          
          // Lens effect variables
          const lensRadius = 500; // Pixel radius where distortion happens
          const normalizedDist = Math.min(distanceToCenter / lensRadius, 1);
          
          // Scale: 1.8x at center, down to 0.6x at edges
          const scale = 0.6 + (1.2 * (1 - Math.pow(normalizedDist, 2))); 
          // Opacity: 1 at center, drops to 0.4 at edges
          const opacity = 0.4 + (0.6 * (1 - normalizedDist));
          
          // z-index: nodes in center should be on top
          const zIndex = Math.round((1 - normalizedDist) * 100);

          // Styling
          const isLocked = node.state === 'locked';
          const isMastered = node.state === 'completed';
          const isActive = node.nodeType === 'history';
          
          let bg = 'bg-slate-800/80';
          let border = 'border-slate-700/50';
          let glow = 'none';
          
          if (isMastered) {
            bg = 'bg-emerald-900/40';
            border = 'border-emerald-500/50';
            glow = '0 0 40px rgba(16,185,129,0.3)';
          } else if (isActive) {
            bg = 'bg-orange-900/60';
            border = 'border-orange-500/80';
            glow = '0 0 60px rgba(249,115,22,0.5)';
          } else if (!isLocked) {
            bg = 'bg-blue-900/40';
            border = 'border-blue-500/50';
            glow = '0 0 30px rgba(59,130,246,0.2)';
          }

          return (
            <div
              key={node.id}
              onClick={() => {
                if (!isDragging && !isLocked) {
                  router.push(`/arena?topic=${node.id}`);
                }
              }}
              className="absolute flex items-center justify-center transition-all duration-75"
              style={{
                left: node.x,
                top: node.y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity: opacity,
                zIndex: zIndex,
              }}
            >
              {/* The Bubble Orb */}
              <div 
                className={`relative w-28 h-28 rounded-full backdrop-blur-xl border-2 flex flex-col items-center justify-center text-center p-3 transition-colors ${bg} ${border} ${!isLocked ? 'cursor-pointer hover:border-white' : 'cursor-not-allowed grayscale'}`}
                style={{ boxShadow: glow }}
              >
                {/* 3D Glass Specular Highlight */}
                <div className="absolute top-1 left-2 w-10 h-6 bg-white/20 rounded-full blur-[4px] -rotate-45 pointer-events-none"></div>

                {isLocked ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 mb-1"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                ) : isActive ? (
                  <Brain size={24} className="text-orange-400 mb-1 animate-pulse" />
                ) : isMastered ? (
                  <div className="text-emerald-400 font-black text-xs mb-1">M</div>
                ) : (
                  <Play size={16} className="text-blue-400 mb-1" fill="currentColor" />
                )}

                <span className="text-white font-bold text-[10px] leading-tight line-clamp-3">
                  {node.name}
                </span>
                
                {node.score !== null && (
                  <span className={`text-[9px] font-black mt-1 ${isMastered ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {node.score}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
