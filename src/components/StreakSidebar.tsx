'use client';

import { format, subDays } from 'date-fns';
import { Flame, Trophy, TrendingUp, Calendar } from 'lucide-react';
import { AppData } from '@/lib/types';
import { getStreakForGoal, getCompletionRate, getDailyScore } from '@/lib/storage';

interface StreakSidebarProps {
  data: AppData;
}

export default function StreakSidebar({ data }: StreakSidebarProps) {
  const activeGoals = data.goals.filter(g => g.active);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Best streaks
  const streaks = activeGoals.map(g => ({
    goal: g,
    streak: getStreakForGoal(data, g.id),
    rate7: getCompletionRate(data, g.id, 7),
    rate30: getCompletionRate(data, g.id, 30),
  })).sort((a, b) => b.streak - a.streak);

  // Last 7 days scores
  const weekScores = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    return {
      day: format(d, 'EEE'),
      score: getDailyScore(data, dateStr),
      date: dateStr,
    };
  });

  const avgScore = weekScores.reduce((a, b) => a + b.score, 0) / 7;

  // Overall daily score
  const todayScore = getDailyScore(data, today);

  return (
    <div className="space-y-6">
      {/* Week at a Glance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">This Week</h3>
        </div>
        <div className="flex gap-1">
          {weekScores.map(({ day, score, date }) => (
            <div key={date} className="flex-1 text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{day}</div>
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                  score >= 80
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : score >= 50
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : score > 0
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {score > 0 ? `${score}` : '—'}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Avg: <span className="font-semibold">{Math.round(avgScore)}%</span>
        </div>
      </div>

      {/* Top Streaks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} className="text-orange-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Current Streaks</h3>
        </div>
        <div className="space-y-2">
          {streaks.slice(0, 5).map(({ goal, streak }) => (
            <div key={goal.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{goal.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{goal.name}</span>
              </div>
              <div className="flex items-center gap-1">
                {streak > 0 ? (
                  <>
                    <Flame size={12} className="text-orange-500" />
                    <span className="text-sm font-bold text-orange-500">{streak}d</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Rates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-emerald-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">7-Day Completion</h3>
        </div>
        <div className="space-y-2">
          {streaks.map(({ goal, rate7 }) => (
            <div key={goal.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {goal.icon} {goal.name}
                </span>
                <span className="text-xs font-medium text-gray-900 dark:text-white">{rate7}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    rate7 >= 80 ? 'bg-emerald-500' : rate7 >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${rate7}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motivational */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-lg">
        <Trophy size={20} className="mb-2" />
        <p className="text-sm font-medium">
          {todayScore >= 80
            ? 'Amazing day! Keep crushing it! 🔥'
            : todayScore >= 50
            ? 'Good progress! Push for more! 💪'
            : todayScore > 0
            ? 'Every step counts. Keep going! 📈'
            : 'Start rating your goals for today! 🎯'}
        </p>
      </div>
    </div>
  );
}
