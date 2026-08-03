'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch, LEARNING_DATA_UPDATED_EVENT } from '@/lib/api';
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
  const [journeyLoading, setJourneyLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const fetchJourney = useCallback(async (force = false) => {
    if (authLoading) return;
    if (!user) {
      setJourneyNodes([]);
      setJourneyLoading(false);
      return;
    }
    setJourneyLoading(true);
    try {
      const journeyData = await apiFetch<JourneyNode[]>(
        '/api/sessions/journey',
        force ? {} : { memoryCacheTtlMs: 45_000 },
      );
      setJourneyNodes(Array.isArray(journeyData) ? journeyData : []);
    } catch (error) {
      console.error('Failed to fetch the learner journey.', error);
      setJourneyNodes([]);
    } finally {
      setJourneyLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    const loadJourney = async () => {
      await fetchJourney();
    };
    void loadJourney();
  }, [fetchJourney]);

  useEffect(() => {
    const refreshOnLearningMutation = () => void fetchJourney(true);
    window.addEventListener(LEARNING_DATA_UPDATED_EVENT, refreshOnLearningMutation);
    return () => window.removeEventListener(LEARNING_DATA_UPDATED_EVENT, refreshOnLearningMutation);
  }, [fetchJourney]);

  return (
    <JourneyContext.Provider value={{ journeyNodes: user ? journeyNodes : [], user, loading: authLoading || journeyLoading, refreshJourney: () => fetchJourney(true) }}>
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
