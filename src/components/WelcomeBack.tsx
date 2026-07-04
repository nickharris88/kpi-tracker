'use client';

import { useState } from 'react';
import { Sparkles, Archive, Check } from 'lucide-react';
import { AppData, getScheduleLabel } from '@/lib/types';
import { getBestStreakForGoal } from '@/lib/storage';

interface WelcomeBackProps {
  data: AppData;
  daysAway: number;
  onComplete: (keptGoalIds: string[]) => void;
}

export default function WelcomeBack({ data, daysAway, onComplete }: WelcomeBackProps) {
  const activeGoals = data.goals.filter(g => g.active);
  const [kept, setKept] = useState<Set<string>>(new Set(activeGoals.map(g => g.id)));

  const toggle = (id: string) => {
    setKept(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const awayLabel = daysAway >= 60
    ? `${Math.round(daysAway / 30)} months`
    : daysAway >= 14
    ? `${Math.round(daysAway / 7)} weeks`
    : `${daysAway} days`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8">
      <div className="max-w-lg w-full space-y-6">
        {/* Hero */}
        <div className="text-center">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back{data.profile.name ? `, ${data.profile.name}` : ''}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            It&apos;s been {awayLabel} — and that&apos;s completely fine.
            Life happens. What matters is you&apos;re here now.
          </p>
        </div>

        {/* Records preserved */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-1">
            <Sparkles size={16} />
            Your history is safe
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All {Object.keys(data.entries).length} days you tracked and every best-streak
            record are preserved. Today is just a fresh page, not a blank book.
          </p>
        </div>

        {/* Goal review */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Still working on these?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Untick anything that no longer fits — it gets archived, not deleted, and you can
            bring it back any time from the Goals page.
          </p>
          <div className="space-y-2">
            {activeGoals.map(goal => {
              const isKept = kept.has(goal.id);
              const best = getBestStreakForGoal(data, goal.id);
              return (
                <button
                  key={goal.id}
                  onClick={() => toggle(goal.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isKept
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 opacity-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                    isKept ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {isKept ? <Check size={14} /> : <Archive size={12} className="text-gray-400" />}
                  </div>
                  <span className="text-xl flex-shrink-0">{goal.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm text-gray-900 dark:text-white ${!isKept ? 'line-through' : ''}`}>
                      {goal.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getScheduleLabel(goal)}
                      {best > 0 && <> · best streak {best}{goal.schedule === 'weekly' ? 'w' : 'd'} 🏆</>}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => onComplete(Array.from(kept))}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl px-6 py-4 shadow-lg shadow-blue-500/25 transition-all"
        >
          Start fresh today 🚀
        </button>
        <p className="text-center text-xs text-gray-400">
          {kept.size} of {activeGoals.length} goals staying active
        </p>
      </div>
    </div>
  );
}
