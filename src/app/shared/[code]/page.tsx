'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Target, Flame, TrendingUp, Eye } from 'lucide-react';
import { loadSharedDashboard } from '@/lib/firestore-storage';
import { SharedDashboard, isGoalScheduledForDate, CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types';

function getStreakForGoalFromShared(dashboard: SharedDashboard, goalId: string): number {
  const goal = dashboard.goals.find(g => g.id === goalId);
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (goal && !isGoalScheduledForDate(goal, d)) continue;
    const dateStr = d.toISOString().split('T')[0];
    const entry = dashboard.entries[dateStr];
    if (entry?.ratings[goalId] === 'green') {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getDailyScoreFromShared(dashboard: SharedDashboard, date: string): number {
  const entry = dashboard.entries[date];
  if (!entry) return 0;
  const activeGoals = dashboard.goals.filter(g => g.active);
  if (activeGoals.length === 0) return 0;
  let score = 0;
  for (const goal of activeGoals) {
    const rating = entry.ratings[goal.id];
    if (rating === 'green') score += 100;
    else if (rating === 'amber') score += 50;
  }
  return Math.round(score / activeGoals.length);
}

function getOverallStreak(dashboard: SharedDashboard): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    if (getDailyScoreFromShared(dashboard, ds) > 0) streak++;
    else break;
  }
  return streak;
}

function getCompletionRateFromShared(dashboard: SharedDashboard, goalId: string, days: number): number {
  const goal = dashboard.goals.find(g => g.id === goalId);
  const today = new Date();
  let completed = 0;
  let total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (goal && !isGoalScheduledForDate(goal, d)) continue;
    const dateStr = d.toISOString().split('T')[0];
    const entry = dashboard.entries[dateStr];
    if (entry?.ratings[goalId]) {
      total++;
      if (entry.ratings[goalId] === 'green') completed++;
    }
  }
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export default function SharedViewPage() {
  const params = useParams();
  const code = params.code as string;
  const [dashboard, setDashboard] = useState<SharedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    loadSharedDashboard(code).then((data) => {
      if (data) {
        setDashboard(data);
      } else {
        setError(true);
      }
      setLoading(false);
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  }, [code]);

  const today = new Date().toISOString().split('T')[0];

  const todayScore = useMemo(() => {
    if (!dashboard) return 0;
    return getDailyScoreFromShared(dashboard, today);
  }, [dashboard, today]);

  const overallStreak = useMemo(() => {
    if (!dashboard) return 0;
    return getOverallStreak(dashboard);
  }, [dashboard]);

  const activeGoals = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.goals.filter(g => g.active);
  }, [dashboard]);

  const goalStreaks = useMemo(() => {
    if (!dashboard) return [];
    return activeGoals
      .map(g => ({
        goal: g,
        streak: getStreakForGoalFromShared(dashboard, g.id),
        rate: getCompletionRateFromShared(dashboard, g.id, 30),
        todayStatus: dashboard.entries[today]?.ratings[g.id] ?? null,
      }))
      .sort((a, b) => b.streak - a.streak);
  }, [dashboard, activeGoals, today]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">...</div>
          <p className="text-gray-400 text-sm">Loading shared dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="text-5xl mb-4">?</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400">
            This shared dashboard does not exist or has been disabled by its owner.
          </p>
        </div>
      </div>
    );
  }

  const categories = Array.from(new Set(activeGoals.map(g => g.category)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-medium mb-4">
            <Eye size={14} />
            Read-only view
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            This is {dashboard.ownerName}&apos;s KPI Tracker
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Last updated {format(new Date(dashboard.updatedAt), 'MMMM d, yyyy \'at\' h:mm a')}
          </p>
        </div>

        {/* Today's Score */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium">{format(new Date(), 'MMMM d, yyyy')}</p>
              <h2 className="text-2xl font-bold mt-1">Today&apos;s Progress</h2>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-3xl font-bold">{todayScore}%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
              <Flame size={18} className="mx-auto mb-1" />
              <p className="text-xl font-bold">{overallStreak}</p>
              <p className="text-xs text-indigo-200">Day Streak</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
              <Target size={18} className="mx-auto mb-1" />
              <p className="text-xl font-bold">{activeGoals.length}</p>
              <p className="text-xs text-indigo-200">Active Goals</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
              <TrendingUp size={18} className="mx-auto mb-1" />
              <p className="text-xl font-bold">{Object.keys(dashboard.entries).length}</p>
              <p className="text-xs text-indigo-200">Days Tracked</p>
            </div>
          </div>
        </div>

        {/* Goals by Category */}
        {categories.map(cat => (
          <div key={cat} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
              <h3 className="font-semibold text-gray-900 dark:text-white">{CATEGORY_LABELS[cat]}</h3>
            </div>
            <div className="space-y-2">
              {goalStreaks
                .filter(({ goal }) => goal.category === cat)
                .map(({ goal, streak, rate, todayStatus }) => (
                  <div key={goal.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{goal.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{goal.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {rate}% completion (30d)
                          {streak > 0 && (
                            <span className="ml-2 text-amber-500">{streak}d streak</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {todayStatus === 'green' && (
                        <span className="inline-block w-6 h-6 rounded-full bg-emerald-500" title="Green" />
                      )}
                      {todayStatus === 'amber' && (
                        <span className="inline-block w-6 h-6 rounded-full bg-amber-500" title="Amber" />
                      )}
                      {todayStatus === 'red' && (
                        <span className="inline-block w-6 h-6 rounded-full bg-red-500" title="Red" />
                      )}
                      {!todayStatus && (
                        <span className="inline-block w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600" title="Not rated" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Shared via KPI Tracker
          </p>
        </div>
      </div>
    </div>
  );
}
