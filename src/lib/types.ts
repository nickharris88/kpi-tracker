export type RAGStatus = 'red' | 'amber' | 'green' | null;

export interface Goal {
  id: string;
  name: string;
  category: 'fitness' | 'nutrition' | 'learning' | 'wellbeing' | 'custom';
  icon: string;
  target?: string;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  ratings: Record<string, RAGStatus>; // goalId -> status
  notes: string;
  runTime?: number; // seconds for 5K
  runDistance?: number; // km
}

export interface AppData {
  goals: Goal[];
  entries: Record<string, DailyEntry>; // date -> entry
  settings: {
    darkMode: boolean;
    target5kTime: number; // seconds (20 min = 1200)
  };
}

export const DEFAULT_GOALS: Goal[] = [
  { id: 'spanish', name: 'Learn Spanish', category: 'learning', icon: '🇪🇸', target: 'Daily practice', order: 0, active: true, createdAt: new Date().toISOString() },
  { id: 'pressups', name: '25 Press Ups', category: 'fitness', icon: '💪', target: '25 reps', order: 1, active: true, createdAt: new Date().toISOString() },
  { id: 'situps', name: '25 Sit Ups', category: 'fitness', icon: '🏋️', target: '25 reps', order: 2, active: true, createdAt: new Date().toISOString() },
  { id: 'squats', name: '25 Squats', category: 'fitness', icon: '🦵', target: '25 reps', order: 3, active: true, createdAt: new Date().toISOString() },
  { id: 'supplements', name: 'Take Supplements', category: 'nutrition', icon: '💊', target: 'Daily vitamins', order: 4, active: true, createdAt: new Date().toISOString() },
  { id: 'breakfast', name: 'Healthy Breakfast', category: 'nutrition', icon: '🥣', target: 'Nutritious meal', order: 5, active: true, createdAt: new Date().toISOString() },
  { id: 'lunch', name: 'Healthy Lunch', category: 'nutrition', icon: '🥗', target: 'Balanced meal', order: 6, active: true, createdAt: new Date().toISOString() },
  { id: 'dinner', name: 'Healthy Dinner', category: 'nutrition', icon: '🍽️', target: 'Nutritious meal', order: 7, active: true, createdAt: new Date().toISOString() },
  { id: 'kindness', name: 'Be a Nice Person', category: 'wellbeing', icon: '😊', target: 'Daily kindness', order: 8, active: true, createdAt: new Date().toISOString() },
];

export const CATEGORY_COLORS: Record<string, string> = {
  fitness: '#3B82F6',
  nutrition: '#10B981',
  learning: '#8B5CF6',
  wellbeing: '#F59E0B',
  custom: '#6B7280',
};

export const CATEGORY_LABELS: Record<string, string> = {
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  learning: 'Learning',
  wellbeing: 'Wellbeing',
  custom: 'Custom',
};
