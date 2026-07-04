'use client';

import { AppData, DEFAULT_GOALS, DailyEntry, Goal, RAGStatus, isGoalScheduledForDate, isWeeklyGoal } from './types';

const STORAGE_KEY = 'kpi-tracker-data';

function getDefaultData(): AppData {
  return {
    profile: {
      name: '',
      ageRange: 'prefer-not-to-say',
      gender: 'prefer-not-to-say',
      onboardingComplete: false,
    },
    goals: DEFAULT_GOALS,
    entries: {},
    settings: {
      darkMode: false,
      target5kTime: 1200, // 20 minutes
    },
  };
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    return JSON.parse(raw) as AppData;
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getEntry(data: AppData, date: string): DailyEntry {
  return data.entries[date] || { date, ratings: {}, notes: '', runTime: undefined, runDistance: undefined };
}

export function setRating(data: AppData, date: string, goalId: string, status: RAGStatus): AppData {
  const entry = getEntry(data, date);
  const newRatings = { ...entry.ratings, [goalId]: status };
  const newEntry = { ...entry, ratings: newRatings, ratedAt: entry.ratedAt || new Date().toISOString() };
  return { ...data, entries: { ...data.entries, [date]: newEntry } };
}

// Batch-set ratings for multiple goals in one update (quick log)
export function setMultipleRatings(data: AppData, date: string, ratings: Record<string, RAGStatus>): AppData {
  const entry = getEntry(data, date);
  const newEntry = {
    ...entry,
    ratings: { ...entry.ratings, ...ratings },
    ratedAt: entry.ratedAt || new Date().toISOString(),
  };
  return { ...data, entries: { ...data.entries, [date]: newEntry } };
}

// Days since the user last rated anything — null if no entries at all
export function getDaysSinceLastEntry(data: AppData): number | null {
  const dates = Object.keys(data.entries)
    .filter(d => {
      const e = data.entries[d];
      return e && Object.values(e.ratings).some(r => r);
    })
    .sort();
  if (dates.length === 0) return null;
  const last = new Date(dates[dates.length - 1] + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - last.getTime()) / 86400000);
}

export function setNotes(data: AppData, date: string, notes: string): AppData {
  const entry = getEntry(data, date);
  return { ...data, entries: { ...data.entries, [date]: { ...entry, notes } } };
}

export function setRunData(data: AppData, date: string, runTime?: number, runDistance?: number): AppData {
  const entry = getEntry(data, date);
  return { ...data, entries: { ...data.entries, [date]: { ...entry, runTime, runDistance } } };
}

export function addGoal(data: AppData, goal: Omit<Goal, 'id' | 'order' | 'createdAt'>): AppData {
  const id = `custom-${Date.now()}`;
  const order = data.goals.length;
  const newGoal: Goal = { ...goal, id, order, createdAt: new Date().toISOString() };
  return { ...data, goals: [...data.goals, newGoal] };
}

export function updateGoal(data: AppData, goalId: string, updates: Partial<Goal>): AppData {
  return {
    ...data,
    goals: data.goals.map(g => g.id === goalId ? { ...g, ...updates } : g),
  };
}

export function removeGoal(data: AppData, goalId: string): AppData {
  return {
    ...data,
    goals: data.goals.filter(g => g.id !== goalId),
  };
}

export function toggleDarkMode(data: AppData): AppData {
  return {
    ...data,
    settings: { ...data.settings, darkMode: !data.settings.darkMode },
  };
}

// Consistency: how many days in the period did the user actually rate any goal
export function getConsistencyRate(data: AppData, days: number): number {
  const today = new Date();
  let daysRated = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = data.entries[dateStr];
    if (entry && Object.values(entry.ratings).some(r => r !== null)) {
      daysRated++;
    }
  }
  return days === 0 ? 0 : Math.round((daysRated / days) * 100);
}

// Week-over-week score change
export function getWeekOverWeekChange(data: AppData): { current: number; previous: number; change: number } {
  const today = new Date();
  let currentTotal = 0, prevTotal = 0;
  for (let i = 0; i < 7; i++) {
    const cur = new Date(today);
    cur.setDate(cur.getDate() - i);
    currentTotal += getDailyScore(data, cur.toISOString().split('T')[0]);

    const prev = new Date(today);
    prev.setDate(prev.getDate() - 7 - i);
    prevTotal += getDailyScore(data, prev.toISOString().split('T')[0]);
  }
  const current = Math.round(currentTotal / 7);
  const previous = Math.round(prevTotal / 7);
  return { current, previous, change: current - previous };
}

// Get score for a specific goal over time (for sparklines / trend)
export function getGoalScoresOverTime(data: AppData, goalId: string, days: number): { date: string; value: number }[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    const entry = data.entries[dateStr];
    const rating = entry?.ratings[goalId];
    return {
      date: dateStr,
      value: rating === 'green' ? 100 : rating === 'amber' ? 50 : rating === 'red' ? 0 : -1,
    };
  });
}

// Get category scores over time
export function getCategoryScoresOverTime(data: AppData, category: string, days: number): { date: string; score: number }[] {
  const today = new Date();
  const categoryGoals = data.goals.filter(g => g.active && g.category === category);
  if (categoryGoals.length === 0) return [];

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().split('T')[0];
    const entry = data.entries[dateStr];
    if (!entry) return { date: dateStr, score: 0 };
    let score = 0;
    for (const g of categoryGoals) {
      const r = entry.ratings[g.id];
      if (r === 'green') score += 100;
      else if (r === 'amber') score += 50;
    }
    return { date: dateStr, score: Math.round(score / categoryGoals.length) };
  });
}

// Generate a text summary for sharing
export function generateShareSummary(data: AppData): {
  overallScore: number;
  streak: number;
  topGoals: { name: string; icon: string; rate: number }[];
  consistency: number;
  totalGoals: number;
  daysTracked: number;
} {
  const activeGoals = data.goals.filter(g => g.active);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const overallScore = getDailyScore(data, todayStr);

  // Best overall streak (consecutive days with score > 0, skipping days with no scheduled goals)
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const scheduledGoals = activeGoals.filter(g => isGoalScheduledForDate(g, d));
    if (scheduledGoals.length === 0) continue;
    const ds = d.toISOString().split('T')[0];
    if (getDailyScore(data, ds) > 0) streak++;
    else break;
  }

  const topGoals = activeGoals
    .map(g => ({ name: g.name, icon: g.icon, rate: getCompletionRate(data, g.id, 30) }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  const consistency = getConsistencyRate(data, 30);
  const daysTracked = Object.keys(data.entries).length;

  return { overallScore, streak, topGoals, consistency, totalGoals: activeGoals.length, daysTracked };
}

// --- Week helpers (Monday-start weeks) ---

function getWeekStart(d: Date): Date {
  const date = new Date(d);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

// How many greens a goal has in the week containing dateInWeek
export function getWeeklyGreenCount(data: AppData, goalId: string, dateInWeek: Date): number {
  const start = getWeekStart(dateInWeek);
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    if (data.entries[ds]?.ratings[goalId] === 'green') count++;
  }
  return count;
}

// Weekly goal progress for display: { count, target }
export function getWeeklyProgress(data: AppData, goal: Goal, dateInWeek: Date): { count: number; target: number } {
  return {
    count: getWeeklyGreenCount(data, goal.id, dateInWeek),
    target: goal.weeklyTarget || 3,
  };
}

// Consecutive weeks (including current if already met) hitting the weekly target
function getWeeklyStreakForGoal(data: AppData, goal: Goal): number {
  const target = goal.weeklyTarget || 3;
  const thisWeek = getWeekStart(new Date());
  let streak = 0;
  // Current week counts if met; if still in progress it doesn't break the streak
  if (getWeeklyGreenCount(data, goal.id, thisWeek) >= target) streak++;
  for (let w = 1; w < 104; w++) {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() - 7 * w);
    if (getWeeklyGreenCount(data, goal.id, d) >= target) streak++;
    else break;
  }
  return streak;
}

// Analytics helpers
// Streaks are forgiving: a single missed scheduled day is auto-frozen and won't
// break an ongoing streak — two consecutive misses will. Today unrated never breaks.
// Weekly goals count consecutive weeks hitting their target instead of days.
export function getStreakForGoal(data: AppData, goalId: string): number {
  const goal = data.goals.find(g => g.id === goalId);
  if (goal && isWeeklyGoal(goal)) return getWeeklyStreakForGoal(data, goal);

  const today = new Date();
  let streak = 0;
  let consecutiveMisses = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Skip days the goal is not scheduled for
    if (goal && !isGoalScheduledForDate(goal, d)) continue;
    const dateStr = d.toISOString().split('T')[0];
    const rating = data.entries[dateStr]?.ratings[goalId];
    if (rating === 'green') {
      streak++;
      consecutiveMisses = 0;
    } else if (i === 0 && !rating) {
      // Today not rated yet — day still in progress, doesn't break the streak
      continue;
    } else {
      consecutiveMisses++;
      // Streak freeze only protects an ongoing streak; it can't start one
      if (consecutiveMisses >= 2 || streak === 0) break;
    }
  }
  return streak;
}

// Best streak the goal has ever had (scans full history)
export function getBestStreakForGoal(data: AppData, goalId: string): number {
  const goal = data.goals.find(g => g.id === goalId);
  const dates = Object.keys(data.entries).sort();
  if (dates.length === 0) return 0;
  const current = getStreakForGoal(data, goalId);

  if (goal && isWeeklyGoal(goal)) {
    const target = goal.weeklyTarget || 3;
    let best = 0, run = 0;
    const firstWeek = getWeekStart(new Date(dates[0] + 'T00:00:00'));
    const lastWeek = getWeekStart(new Date());
    for (const w = new Date(firstWeek); w <= lastWeek; w.setDate(w.getDate() + 7)) {
      if (getWeeklyGreenCount(data, goalId, w) >= target) {
        run++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
    }
    return Math.max(best, current);
  }

  let best = 0, run = 0;
  const start = new Date(dates[0] + 'T00:00:00');
  const today = new Date();
  for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    if (goal && !isGoalScheduledForDate(goal, d)) continue;
    const ds = d.toISOString().split('T')[0];
    if (data.entries[ds]?.ratings[goalId] === 'green') {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  // Current streak can exceed strict-best thanks to streak freezes
  return Math.max(best, current);
}

export function getCompletionRate(data: AppData, goalId: string, days: number): number {
  const goal = data.goals.find(g => g.id === goalId);
  const today = new Date();
  let completed = 0;
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    // Skip days the goal is not scheduled for
    if (goal && !isGoalScheduledForDate(goal, d)) continue;
    const dateStr = d.toISOString().split('T')[0];
    const entry = data.entries[dateStr];
    if (entry?.ratings[goalId]) {
      total++;
      if (entry.ratings[goalId] === 'green') completed++;
    }
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function getDailyScore(data: AppData, date: string): number {
  const entry = data.entries[date];
  if (!entry) return 0;
  const dateObj = new Date(date + 'T00:00:00');
  const scoreGoals = data.goals.filter(g => {
    if (!g.active) return false;
    // Weekly goals only count toward the day's score when actually logged that day
    if (isWeeklyGoal(g)) return !!entry.ratings[g.id];
    return isGoalScheduledForDate(g, dateObj);
  });
  if (scoreGoals.length === 0) return 0;
  let score = 0;
  for (const goal of scoreGoals) {
    const rating = entry.ratings[goal.id];
    if (rating === 'green') score += 100;
    else if (rating === 'amber') score += 50;
  }
  return Math.round(score / scoreGoals.length);
}
