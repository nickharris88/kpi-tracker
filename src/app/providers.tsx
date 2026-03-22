'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppData, RAGStatus, Goal } from '@/lib/types';
import {
  loadData, saveData, setRating, setNotes, setRunData as setRunDataHelper,
  addGoal as addGoalHelper, updateGoal as updateGoalHelper, removeGoal as removeGoalHelper,
  toggleDarkMode as toggleDarkModeHelper,
} from '@/lib/storage';

interface AppContextType {
  data: AppData;
  setGoalRating: (date: string, goalId: string, status: RAGStatus) => void;
  setDayNotes: (date: string, notes: string) => void;
  setRunData: (date: string, runTime?: number, runDistance?: number) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'order' | 'createdAt'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  removeGoal: (goalId: string) => void;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    setData(loadData());
  }, []);

  const persist = useCallback((newData: AppData) => {
    setData(newData);
    saveData(newData);
  }, []);

  const ctx: AppContextType | null = data ? {
    data,
    setGoalRating: (date, goalId, status) => persist(setRating(data, date, goalId, status)),
    setDayNotes: (date, notes) => persist(setNotes(data, date, notes)),
    setRunData: (date, runTime, runDistance) => persist(setRunDataHelper(data, date, runTime, runDistance)),
    addGoal: (goal) => persist(addGoalHelper(data, goal)),
    updateGoal: (goalId, updates) => persist(updateGoalHelper(data, goalId, updates)),
    removeGoal: (goalId) => persist(removeGoalHelper(data, goalId)),
    toggleDarkMode: () => persist(toggleDarkModeHelper(data)),
  } : null;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-2xl">🎯</div>
      </div>
    );
  }

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useAppData(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used within AppProvider');
  return ctx;
}
