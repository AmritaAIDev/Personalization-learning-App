'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Subtopic {
  name: string;
  score: number | null;
}

export interface JourneyNode {
  id: string;
  name: string;
  subject: string;
  state: 'locked' | 'active' | 'completed';
  score?: number | null;
  subtopics?: Subtopic[];
}

interface JourneyContextType {
  journeyNodes: JourneyNode[];
  loading: boolean;
  refreshJourney: () => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [journeyNodes, setJourneyNodes] = useState<JourneyNode[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchJourney = () => {
    setLoading(true);
    fetch(`${API_URL}/api/sessions/journey/mock-user`)
      .then(res => res.json())
      .then(data => {
        setJourneyNodes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch journey:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJourney();
  }, []);

  return (
    <JourneyContext.Provider value={{ journeyNodes, loading, refreshJourney: fetchJourney }}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (context === undefined) {
    throw new Error('useJourney must be used within a JourneyProvider');
  }
  return context;
}
