"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { JourneyProvider, useJourney, Subtopic } from "@/context/JourneyContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Play, Network, Brain } from "lucide-react";

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
  return (
    <JourneyProvider>
      <ExplorerBubbleContent />
    </JourneyProvider>
  );
}

function ExplorerBubbleContent() {
  const { journeyNodes, loading, error, refreshJourney } = useJourney();
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
        y: window.innerHeight / 2,
      });
    };
    updateCenter();
    window.addEventListener("resize", updateCenter);
    return () => window.removeEventListener("resize", updateCenter);
  }, []);

  const layoutedNodes = useMemo(() => {
    if (!journeyNodes) return [];
    const allSubtopics = journeyNodes.flatMap((node) => node.subtopics || []);
    // Sort so important nodes are closer to center (index 0)
    const sorted = [...allSubtopics].sort((a, b) => {
      if (a.nodeType === "history") return -1;
      if (b.nodeType === "history") return 1;
      if (a.nodeType === "next-step") return -1;
      if (b.nodeType === "next-step") return 1;
      return 0;
    });
    return generateSpiralLayout(sorted, 160);
  }, [journeyNodes]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-ink-mute bg-canvas h-[calc(100vh-3.5rem)] items-center">
        Loading your knowledge universe...
      </div>
    );
  }

  if (layoutedNodes.length === 0) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
        <p className="text-lg font-semibold text-ink">
          {error ? "The universe could not be charted" : "Your universe is empty"}
        </p>
        <p className="max-w-md text-sm text-ink-mute">
          {error ??
            "Complete a diagnostic or a learning session and your topics will appear here."}
        </p>
        {error ? (
          <button
            type="button"
            onClick={() => void refreshJourney()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-strong"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[calc(100vh-3.5rem)] bg-canvas overflow-hidden"
      ref={containerRef}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.06] rounded-full blur-[150px] pointer-events-none"></div>

      {/* HUD Header */}
      <header className="absolute top-0 left-0 w-full p-8 z-20 pointer-events-none flex justify-between items-start">
        <div>
          <h1 className="font-heading page-title text-ink flex items-center gap-3">
            <Network size={28} className="text-primary" />
            Knowledge Universe
          </h1>
          <p className="text-sm text-ink-mute mt-2 font-medium tracking-wide">
            Drag to explore. Topics near the center are your closest focus.
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
          const scale = 0.6 + 1.2 * (1 - Math.pow(normalizedDist, 2));
          // Opacity: 1 at center, drops to 0.4 at edges
          const opacity = 0.4 + 0.6 * (1 - normalizedDist);

          // z-index: nodes in center should be on top
          const zIndex = Math.round((1 - normalizedDist) * 100);

          // Styling
          const isLocked = node.state === "locked";
          const isMastered = node.state === "completed";
          const isActive = node.nodeType === "history";

          let bg = "bg-white";
          let border = "border-hairline";
          let glow = "none";

          if (isMastered) {
            bg = "bg-emerald-50";
            border = "border-emerald-300";
            glow = "0 0 32px rgba(16,185,129,0.18)";
          } else if (isActive) {
            bg = "bg-amber-50";
            border = "border-amber-400";
            glow = "0 0 40px rgba(217,119,6,0.22)";
          } else if (!isLocked) {
            bg = "bg-primary-tint";
            border = "border-primary/40";
            glow = "0 0 26px rgba(63,111,87,0.14)";
          }

          return (
            <div
              key={node.id}
              role="button"
              tabIndex={isLocked ? -1 : 0}
              aria-disabled={isLocked}
              aria-label={
                isLocked
                  ? `${node.name} (locked)`
                  : `Open ${node.name}`
              }
              onClick={() => {
                if (!isDragging && !isLocked) {
                  router.push(`/arena?topic=${node.id}`);
                }
              }}
              onKeyDown={(event) => {
                if (isLocked) return;
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                router.push(`/arena?topic=${node.id}`);
              }}
              className="absolute flex items-center justify-center rounded-full transition-[transform,opacity] duration-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
                className={`relative w-28 h-28 rounded-full backdrop-blur-xl border-2 flex flex-col items-center justify-center text-center p-3 shadow-sm transition-colors ${bg} ${border} ${!isLocked ? "cursor-pointer hover:border-primary/60" : "cursor-not-allowed grayscale opacity-70"}`}
                style={{ boxShadow: glow }}
              >
                {isLocked ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-ink-mute mb-1"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                ) : isActive ? (
                  <Brain
                    size={24}
                    className="text-amber-600 mb-1 animate-pulse"
                  />
                ) : isMastered ? (
                  <div className="text-emerald-600 font-black text-xs mb-1">
                    M
                  </div>
                ) : (
                  <Play
                    size={16}
                    className="text-primary mb-1"
                    fill="currentColor"
                  />
                )}

                <span className="text-ink font-bold text-[10px] leading-tight line-clamp-3">
                  {node.name}
                </span>

                {node.score !== null && (
                  <span
                    className={`text-[9px] font-black mt-1 ${isMastered ? "text-emerald-600" : "text-primary"}`}
                  >
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
