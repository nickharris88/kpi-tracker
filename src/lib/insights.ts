'use client';

import { AppData } from './types';
import { getDailyScore, getCompletionRate, getConsistencyRate, getBestStreakForGoal } from './storage';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  score: number;
  dayOfWeek: number; // 0=Mon ... 6=Sun (display rows)
  weekIndex: number;
  inFuture: boolean;
}

// GitHub-style heatmap: last 52 weeks, columns = weeks, rows = Mon-Sun
export function getYearHeatmap(data: AppData): { cells: HeatmapCell[]; monthLabels: { weekIndex: number; label: string }[] } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // End on the Sunday of the current week
  const end = new Date(today);
  end.setDate(end.getDate() + (7 - ((end.getDay() + 6) % 7)) - 1);
  // Start 52 weeks before, on a Monday
  const start = new Date(end);
  start.setDate(start.getDate() - 52 * 7 + 1);

  const cells: HeatmapCell[] = [];
  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;

  for (let i = 0; i < 52 * 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    const weekIndex = Math.floor(i / 7);
    const dayOfWeek = i % 7; // 0=Mon since start is a Monday
    if (dayOfWeek === 0 && d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth();
      monthLabels.push({ weekIndex, label: d.toLocaleDateString('en-GB', { month: 'short' }) });
    }
    cells.push({
      date: ds,
      score: d > today ? -1 : getDailyScore(data, ds),
      dayOfWeek,
      weekIndex,
      inFuture: d > today,
    });
  }
  return { cells, monthLabels };
}

export interface Insight {
  icon: string;
  title: string;
  detail: string;
}

// Personal insights from the last 8 weeks of data
export function getInsights(data: AppData): Insight[] {
  const insights: Insight[] = [];
  const activeGoals = data.goals.filter(g => g.active);
  const today = new Date();

  // Average score per weekday over last 8 weeks
  const weekdayTotals: number[] = Array(7).fill(0);
  const weekdayCounts: number[] = Array(7).fill(0);
  for (let i = 0; i < 56; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (!data.entries[ds]) continue;
    weekdayTotals[d.getDay()] += getDailyScore(data, ds);
    weekdayCounts[d.getDay()]++;
  }
  const weekdayAvgs = weekdayTotals.map((t, i) => (weekdayCounts[i] >= 2 ? t / weekdayCounts[i] : -1));
  const validDays = weekdayAvgs.filter(a => a >= 0);
  if (validDays.length >= 4) {
    const bestDay = weekdayAvgs.indexOf(Math.max(...weekdayAvgs));
    const worstDay = weekdayAvgs.indexOf(Math.min(...weekdayAvgs.map(a => (a < 0 ? 999 : a))));
    insights.push({
      icon: '📅',
      title: `${DAY_NAMES[bestDay]}s are your power day`,
      detail: `You average ${Math.round(weekdayAvgs[bestDay])}% on ${DAY_NAMES[bestDay]}s vs ${Math.round(weekdayAvgs[worstDay])}% on ${DAY_NAMES[worstDay]}s. Plan your hardest goals accordingly.`,
    });
  }

  // Strongest and weakest goal (30-day completion)
  if (activeGoals.length >= 2) {
    const rates = activeGoals
      .map(g => ({ goal: g, rate: getCompletionRate(data, g.id, 30) }))
      .filter(r => r.rate > 0)
      .sort((a, b) => b.rate - a.rate);
    if (rates.length >= 2) {
      const top = rates[0];
      const bottom = rates[rates.length - 1];
      insights.push({
        icon: top.goal.icon,
        title: `${top.goal.name} is your rock`,
        detail: `${top.rate}% completion over 30 days. Meanwhile ${bottom.goal.icon} ${bottom.goal.name} is at ${bottom.rate}% — maybe make it smaller or move it to a weekly target?`,
      });
    }
  }

  // Consistency trend: this week vs last week
  const thisWeekRated = countRatedDays(data, 0, 7);
  const lastWeekRated = countRatedDays(data, 7, 14);
  if (thisWeekRated > lastWeekRated && lastWeekRated > 0) {
    insights.push({
      icon: '📈',
      title: 'Momentum is building',
      detail: `You logged ${thisWeekRated} days this week vs ${lastWeekRated} last week. Showing up is the whole game.`,
    });
  }

  // Best-ever streak callout
  const bestOverall = activeGoals
    .map(g => ({ goal: g, best: getBestStreakForGoal(data, g.id) }))
    .sort((a, b) => b.best - a.best)[0];
  if (bestOverall && bestOverall.best >= 7) {
    insights.push({
      icon: '🏆',
      title: `Your record: ${bestOverall.best} days of ${bestOverall.goal.name}`,
      detail: `You've done it before, which means you can do it again. The streak freeze system has your back on off days.`,
    });
  }

  return insights.slice(0, 3);
}

function countRatedDays(data: AppData, fromDaysAgo: number, toDaysAgo: number): number {
  const today = new Date();
  let count = 0;
  for (let i = fromDaysAgo; i < toDaysAgo; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const e = data.entries[ds];
    if (e && Object.values(e.ratings).some(r => r)) count++;
  }
  return count;
}

export interface MonthlyRecap {
  monthLabel: string;
  daysTracked: number;
  avgScore: number;
  perfectDays: number;
  totalGreens: number;
  bestGoal: { name: string; icon: string; rate: number } | null;
  consistency: number;
}

// Recap of the last 30 days
export function getMonthlyRecap(data: AppData): MonthlyRecap {
  const today = new Date();
  const activeGoals = data.goals.filter(g => g.active);
  let daysTracked = 0;
  let scoreTotal = 0;
  let perfectDays = 0;
  let totalGreens = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const entry = data.entries[ds];
    if (!entry || !Object.values(entry.ratings).some(r => r)) continue;
    daysTracked++;
    const score = getDailyScore(data, ds);
    scoreTotal += score;
    if (score === 100) perfectDays++;
    totalGreens += Object.values(entry.ratings).filter(r => r === 'green').length;
  }

  const rates = activeGoals
    .map(g => ({ name: g.name, icon: g.icon, rate: getCompletionRate(data, g.id, 30) }))
    .sort((a, b) => b.rate - a.rate);

  return {
    monthLabel: 'Last 30 days',
    daysTracked,
    avgScore: daysTracked > 0 ? Math.round(scoreTotal / daysTracked) : 0,
    perfectDays,
    totalGreens,
    bestGoal: rates.length > 0 && rates[0].rate > 0 ? rates[0] : null,
    consistency: getConsistencyRate(data, 30),
  };
}
