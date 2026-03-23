export type RAGStatus = 'red' | 'amber' | 'green' | null;

export type AgeRange = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | 'prefer-not-to-say';
export type Gender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

export type GoalSchedule = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface UserProfile {
  name: string;
  ageRange: AgeRange;
  gender: Gender;
  onboardingComplete: boolean;
}

export interface Goal {
  id: string;
  name: string;
  category: 'fitness' | 'nutrition' | 'learning' | 'wellbeing' | 'custom';
  icon: string;
  target?: string;
  order: number;
  active: boolean;
  createdAt: string;
  schedule?: GoalSchedule;
  scheduleDays?: number[]; // 0=Sun, 1=Mon, ... 6=Sat — used when schedule is 'custom'
}

/** Day labels for schedule display (index matches JS getDay: 0=Sun) */
export const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LABELS_SINGLE = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Returns true if a goal is scheduled for the given date */
export function isGoalScheduledForDate(goal: Goal, date: Date): boolean {
  const schedule = goal.schedule || 'daily';
  if (schedule === 'daily') return true;
  const day = date.getDay(); // 0=Sun ... 6=Sat
  if (schedule === 'weekdays') return day >= 1 && day <= 5;
  if (schedule === 'weekends') return day === 0 || day === 6;
  // custom
  const days = goal.scheduleDays || [];
  return days.includes(day);
}

/** Returns a human-readable label for a goal's schedule */
export function getScheduleLabel(goal: Goal): string {
  const schedule = goal.schedule || 'daily';
  if (schedule === 'daily') return 'Daily';
  if (schedule === 'weekdays') return 'Weekdays';
  if (schedule === 'weekends') return 'Weekends';
  const days = goal.scheduleDays || [];
  if (days.length === 0) return 'No days';
  if (days.length === 7) return 'Daily';
  return days
    .slice()
    .sort((a, b) => a - b)
    .map(d => DAY_LABELS_SHORT[d])
    .join(', ');
}

export interface DailyEntry {
  date: string; // YYYY-MM-DD
  ratings: Record<string, RAGStatus>; // goalId -> status
  notes: string;
  runTime?: number; // seconds for 5K
  runDistance?: number; // km
}

export interface SharingConfig {
  enabled: boolean;
  shareCode: string;
  sharedWith: string[]; // email addresses of accountability partners
}

export interface SharedDashboard {
  ownerUid: string;
  ownerName: string;
  goals: Goal[];
  entries: Record<string, DailyEntry>;
  updatedAt: string;
}

export interface AppData {
  profile: UserProfile;
  goals: Goal[];
  entries: Record<string, DailyEntry>; // date -> entry
  settings: {
    darkMode: boolean;
    target5kTime: number; // seconds (20 min = 1200)
  };
  badges?: Record<string, { earned: boolean; earnedDate: string }>;
  sharing?: SharingConfig;
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
