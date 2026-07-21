'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { AuthenticatedUser } from '@/lib/diagnostic-types';

export interface Subtopic {
  id?: string;
  name: string;
  score: number | null;
  state?: 'locked' | 'active' | 'completed';
  nodeType?: 'history' | 'prerequisite' | 'next-step' | 'recommended';
  prerequisites?: { id: string, name: string, score: number }[];
}

export interface JourneyNode {
  id: string;
  name: string;
  subject: string;
  state: 'locked' | 'active' | 'completed';
  score?: number | null;
  subtopics?: Subtopic[];
}

export type UserStats = AuthenticatedUser;

interface JourneyContextType {
  journeyNodes: JourneyNode[];
  user: UserStats | null;
  loading: boolean;
  refreshJourney: () => Promise<void>;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [journeyNodes, setJourneyNodes] = useState<JourneyNode[]>([]);
  const { user, loading: authLoading } = useAuth();

  const fetchJourney = useCallback(async () => {
    if (authLoading || !user) return;
    try {
      const journeyData = await apiFetch<JourneyNode[]>('/api/sessions/journey');
      setJourneyNodes(Array.isArray(journeyData) ? journeyData : []);
    } catch (error) {
      console.error('Failed to fetch the learner journey.', error);
      setJourneyNodes([]);
    }
  }, [authLoading, user]);

  useEffect(() => {
    const loadJourney = async () => {
      await fetchJourney();
    };
    void loadJourney();
  }, [fetchJourney]);

  return (
    <JourneyContext.Provider value={{ journeyNodes: user ? journeyNodes : [], user, loading: authLoading, refreshJourney: fetchJourney }}>
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
