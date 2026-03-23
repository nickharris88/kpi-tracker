'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Moon, Sun } from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, User } from 'firebase/auth';
import { getAuthInstance, getGoogleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { AppData, RAGStatus, Goal, UserProfile } from '@/lib/types';
import { loadUserData, saveUserData, subscribeToUserData } from '@/lib/firestore-storage';
import {
  loadData, saveData, setRating, setNotes, setRunData as setRunDataHelper,
  addGoal as addGoalHelper, updateGoal as updateGoalHelper, removeGoal as removeGoalHelper,
  toggleDarkMode as toggleDarkModeHelper,
} from '@/lib/storage';
import Onboarding from '@/components/Onboarding';

interface AppContextType {
  data: AppData;
  user: User | null;
  signIn: () => Promise<void>;
  setGoalRating: (date: string, goalId: string, status: RAGStatus) => void;
  setDayNotes: (date: string, notes: string) => void;
  setRunData: (date: string, runTime?: number, runDistance?: number) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'order' | 'createdAt'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  removeGoal: (goalId: string) => void;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function getDefaultData(): AppData {
  return {
    profile: {
      name: '',
      ageRange: 'prefer-not-to-say',
      gender: 'prefer-not-to-say',
      onboardingComplete: false,
    },
    goals: [],
    entries: {},
    settings: {
      darkMode: false,
      target5kTime: 1200,
    },
  };
}

function DarkModeToggle({ darkMode, onToggle }: { darkMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [firebaseAvailable, setFirebaseAvailable] = useState(true);
  const [earlyDarkMode, setEarlyDarkMode] = useState(false);

  // Load early dark mode preference from localStorage before auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kpi-dark-mode');
      if (stored === 'true') {
        setEarlyDarkMode(true);
      } else if (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setEarlyDarkMode(true);
      }
    }
  }, []);

  const toggleEarlyDarkMode = useCallback(() => {
    setEarlyDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('kpi-dark-mode', String(next));
      return next;
    });
  }, []);

  // Auth listener
  useEffect(() => {
    // Check if Firebase is configured
    if (typeof window === 'undefined' || !isFirebaseConfigured()) {
      setFirebaseAvailable(false);
      setAuthReady(true);
      // Fall back to localStorage
      const localData = loadData();
      // Migrate old data without profile
      if (!localData.profile) {
        (localData as AppData).profile = {
          name: '',
          ageRange: 'prefer-not-to-say',
          gender: 'prefer-not-to-say',
          onboardingComplete: localData.goals && localData.goals.length > 0,
        };
      }
      setData(localData as AppData);
      return;
    }

    const unsub = onAuthStateChanged(getAuthInstance(), async (u) => {
      // Treat anonymous users as not logged in — require Google sign-in
      if (u && u.isAnonymous) {
        setData(getDefaultData());
        setAuthReady(true);
        return;
      }
      setUser(u);
      if (u) {
        // Try loading from Firestore
        const firestoreData = await loadUserData(u.uid);
        if (firestoreData) {
          setData(firestoreData);
        } else {
          // Check for existing localStorage data to migrate
          const localData = loadData();
          if (localData.goals && localData.goals.length > 0 && localData.entries && Object.keys(localData.entries).length > 0) {
            // Migrate local data with profile
            const migrated: AppData = {
              ...localData,
              profile: (localData as AppData).profile || {
                name: '',
                ageRange: 'prefer-not-to-say',
                gender: 'prefer-not-to-say',
                onboardingComplete: true,
              },
            };
            await saveUserData(u.uid, migrated);
            setData(migrated);
          } else {
            // Brand new user
            setData(getDefaultData());
          }
        }
      } else {
        // Not signed in — show login screen
        setData(getDefaultData());
      }
      setAuthReady(true);
    });

    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time sync from Firestore
  useEffect(() => {
    if (!user || !firebaseAvailable) return;
    const unsub = subscribeToUserData(user.uid, (remoteData) => {
      if (remoteData) {
        setData(remoteData);
      }
    });
    return () => unsub();
  }, [user, firebaseAvailable]);

  const persist = useCallback((newData: AppData) => {
    setData(newData);
    if (user && firebaseAvailable) {
      saveUserData(user.uid, newData);
    } else {
      saveData(newData);
    }
  }, [user, firebaseAvailable]);

  const handleOnboardingComplete = useCallback((profile: UserProfile, goals: Goal[]) => {
    const newData: AppData = {
      profile,
      goals,
      entries: {},
      settings: { darkMode: false, target5kTime: 1200 },
    };
    persist(newData);
  }, [persist]);

  const signIn = useCallback(async () => {
    try {
      await signInWithPopup(getAuthInstance(), getGoogleProvider());
    } catch (err) {
      console.error('Google sign-in failed:', err);
    }
  }, []);

  if (!authReady || data === null) {
    return (
      <div className={earlyDarkMode ? 'dark' : ''}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <DarkModeToggle darkMode={earlyDarkMode} onToggle={toggleEarlyDarkMode} />
          <div className="text-center">
            <div className="animate-pulse text-4xl mb-4">🎯</div>
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if no user
  if (!user && firebaseAvailable) {
    return (
      <div className={earlyDarkMode ? 'dark' : ''}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <DarkModeToggle darkMode={earlyDarkMode} onToggle={toggleEarlyDarkMode} />
          <div className="text-center max-w-sm mx-auto px-6">
            <div className="text-6xl mb-6">🎯</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">KPI Tracker</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Track your personal goals and habits. Sync across all your devices.</p>
            <button
              onClick={signIn}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl px-6 py-3 text-gray-700 dark:text-gray-200 font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show onboarding if not completed
  if (!data.profile?.onboardingComplete) {
    return (
      <div className={earlyDarkMode ? 'dark' : ''}>
        <DarkModeToggle darkMode={earlyDarkMode} onToggle={toggleEarlyDarkMode} />
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  const ctx: AppContextType = {
    data,
    user,
    signIn,
    setGoalRating: (date, goalId, status) => persist(setRating(data, date, goalId, status)),
    setDayNotes: (date, notes) => persist(setNotes(data, date, notes)),
    setRunData: (date, runTime, runDistance) => persist(setRunDataHelper(data, date, runTime, runDistance)),
    addGoal: (goal) => persist(addGoalHelper(data, goal)),
    updateGoal: (goalId, updates) => persist(updateGoalHelper(data, goalId, updates)),
    removeGoal: (goalId) => persist(removeGoalHelper(data, goalId)),
    toggleDarkMode: () => persist(toggleDarkModeHelper(data)),
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useAppData(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used within AppProvider');
  return ctx;
}
