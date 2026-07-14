'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Subtopic {
  id?: string;
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

export interface UserStats {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
}

interface JourneyContextType {
  journeyNodes: JourneyNode[];
  user: UserStats | null;
  loading: boolean;
  refreshJourney: () => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [journeyNodes, setJourneyNodes] = useState<JourneyNode[]>([]);
  const [user, setUser] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJourney = () => {
    setLoading(true);
    // Load the journey map and the current student's stats together
    Promise.all([
      fetch(`${API_URL}/api/sessions/journey/mock-user`).then(res => res.json()),
      fetch(`${API_URL}/api/users/me`).then(res => res.json()),
    ])
      .then(([journeyData, userData]) => {
        setJourneyNodes(Array.isArray(journeyData) ? journeyData : []);
        setUser(userData && userData.id ? userData : null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch student data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJourney();
  }, []);

  return (
    <JourneyContext.Provider value={{ journeyNodes, user, loading, refreshJourney: fetchJourney }}>
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
