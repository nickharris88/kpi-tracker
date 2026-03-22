'use client';

import { useState, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { Share2, Copy, Check, Trophy, Flame, Target, TrendingUp, Users } from 'lucide-react';
import { useAppData } from '../providers';
import { generateShareSummary, getCompletionRate, getStreakForGoal, getDailyScore } from '@/lib/storage';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types';

type CardTheme = 'blue' | 'purple' | 'emerald' | 'sunset';

const themes: Record<CardTheme, { from: string; to: string; accent: string }> = {
  blue: { from: 'from-blue-500', to: 'to-indigo-600', accent: 'text-blue-100' },
  purple: { from: 'from-purple-500', to: 'to-pink-600', accent: 'text-purple-100' },
  emerald: { from: 'from-emerald-500', to: 'to-teal-600', accent: 'text-emerald-100' },
  sunset: { from: 'from-orange-500', to: 'to-red-600', accent: 'text-orange-100' },
};

export default function SharePage() {
  const { data } = useAppData();
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<CardTheme>('blue');
  const [shareType, setShareType] = useState<'snapshot' | 'goals' | 'streaks'>('snapshot');
  const cardRef = useRef<HTMLDivElement>(null);

  const summary = useMemo(() => generateShareSummary(data), [data]);
  const activeGoals = data.goals.filter(g => g.active);
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayScore = getDailyScore(data, today);

  const streaks = useMemo(() => {
    return activeGoals
      .map(g => ({ goal: g, streak: getStreakForGoal(data, g.id), rate: getCompletionRate(data, g.id, 30) }))
      .sort((a, b) => b.streak - a.streak);
  }, [data, activeGoals]);

  const generateTextSummary = () => {
    const lines = [
      `KPI Tracker - ${format(new Date(), 'MMMM d, yyyy')}`,
      `${'='.repeat(40)}`,
      '',
    ];

    if (shareType === 'snapshot') {
      lines.push(`Today's Score: ${todayScore}%`);
      lines.push(`Active Streak: ${summary.streak} day${summary.streak !== 1 ? 's' : ''}`);
      lines.push(`30-Day Consistency: ${summary.consistency}%`);
      lines.push(`Goals Tracked: ${summary.totalGoals}`);
      lines.push('');
      lines.push('Top Goals (30-day):');
      summary.topGoals.forEach(g => {
        lines.push(`  ${g.icon} ${g.name}: ${g.rate}%`);
      });
    } else if (shareType === 'goals') {
      lines.push('My Goals:');
      lines.push('');
      const categories = Array.from(new Set(activeGoals.map(g => g.category)));
      categories.forEach(cat => {
        lines.push(`${CATEGORY_LABELS[cat]}:`);
        activeGoals.filter(g => g.category === cat).forEach(g => {
          const rate = getCompletionRate(data, g.id, 30);
          lines.push(`  ${g.icon} ${g.name} - ${rate}% (30d)`);
        });
        lines.push('');
      });
    } else {
      lines.push('Current Streaks:');
      lines.push('');
      streaks.forEach(({ goal, streak }) => {
        if (streak > 0) {
          lines.push(`  ${goal.icon} ${goal.name}: ${streak} day${streak !== 1 ? 's' : ''}`);
        }
      });
      const activeStreaks = streaks.filter(s => s.streak > 0);
      if (activeStreaks.length === 0) {
        lines.push('  No active streaks yet - start today!');
      }
    }

    lines.push('');
    lines.push('Tracked with KPI Tracker');
    return lines.join('\n');
  };

  const handleCopy = async () => {
    const text = generateTextSummary();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = async () => {
    const text = generateTextSummary();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My KPI Progress', text });
      } catch {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const t = themes[theme];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Share2 size={24} />
          Share Progress
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Share your goals and progress with friends</p>
      </div>

      {/* Share Type Selector */}
      <div className="flex gap-2">
        {([
          { id: 'snapshot', label: 'Daily Snapshot', icon: Trophy },
          { id: 'goals', label: 'My Goals', icon: Target },
          { id: 'streaks', label: 'Streaks', icon: Flame },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setShareType(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              shareType === id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Theme Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">Theme:</span>
        {(Object.keys(themes) as CardTheme[]).map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${themes[t].from} ${themes[t].to} transition-transform ${
              theme === t ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-gray-900 scale-110' : 'hover:scale-105'
            }`}
          />
        ))}
      </div>

      {/* Share Card Preview */}
      <div ref={cardRef} className={`bg-gradient-to-br ${t.from} ${t.to} rounded-2xl p-8 text-white shadow-xl`}>
        {shareType === 'snapshot' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${t.accent} text-sm font-medium`}>{format(new Date(), 'MMMM d, yyyy')}</p>
                <h2 className="text-3xl font-bold mt-1">Daily Progress</h2>
              </div>
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-4xl font-bold">{todayScore}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                <Flame size={20} className="mx-auto mb-1" />
                <p className="text-2xl font-bold">{summary.streak}</p>
                <p className={`text-xs ${t.accent}`}>Day Streak</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                <TrendingUp size={20} className="mx-auto mb-1" />
                <p className="text-2xl font-bold">{summary.consistency}%</p>
                <p className={`text-xs ${t.accent}`}>Consistency</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                <Target size={20} className="mx-auto mb-1" />
                <p className="text-2xl font-bold">{summary.totalGoals}</p>
                <p className={`text-xs ${t.accent}`}>Goals</p>
              </div>
            </div>

            {summary.topGoals.length > 0 && (
              <div>
                <p className={`text-sm ${t.accent} mb-2`}>Top Goals (30-day)</p>
                <div className="space-y-2">
                  {summary.topGoals.map((g, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                      <span className="text-sm font-medium">{g.icon} {g.name}</span>
                      <span className="text-sm font-bold">{g.rate}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className={`text-xs ${t.accent} text-center`}>Tracked with KPI Tracker</p>
          </div>
        )}

        {shareType === 'goals' && (
          <div className="space-y-6">
            <div>
              <p className={`${t.accent} text-sm font-medium`}>My Goals</p>
              <h2 className="text-3xl font-bold mt-1">{activeGoals.length} Active Goals</h2>
            </div>

            {Array.from(new Set(activeGoals.map(g => g.category))).map(cat => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                  <p className="text-sm font-semibold">{CATEGORY_LABELS[cat]}</p>
                </div>
                <div className="space-y-1.5">
                  {activeGoals.filter(g => g.category === cat).map(g => {
                    const rate = getCompletionRate(data, g.id, 30);
                    return (
                      <div key={g.id} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                        <span className="text-sm">{g.icon} {g.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right">{rate}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <p className={`text-xs ${t.accent} text-center`}>Tracked with KPI Tracker</p>
          </div>
        )}

        {shareType === 'streaks' && (
          <div className="space-y-6">
            <div>
              <p className={`${t.accent} text-sm font-medium`}>Current Streaks</p>
              <h2 className="text-3xl font-bold mt-1 flex items-center gap-2">
                <Flame size={28} />
                {streaks.filter(s => s.streak > 0).length} Active
              </h2>
            </div>

            <div className="space-y-2">
              {streaks.map(({ goal, streak, rate }) => (
                <div key={goal.id} className="flex items-center justify-between bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{goal.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{goal.name}</p>
                      <p className={`text-xs ${t.accent}`}>{rate}% completion (30d)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {streak > 0 ? (
                      <div className="flex items-center gap-1">
                        <Flame size={16} className="text-yellow-300" />
                        <span className="text-lg font-bold">{streak}d</span>
                      </div>
                    ) : (
                      <span className={`text-sm ${t.accent}`}>--</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {summary.streak > 0 && (
              <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-sm">Overall tracking streak</p>
                <p className="text-4xl font-bold mt-1">{summary.streak} days</p>
              </div>
            )}

            <p className={`text-xs ${t.accent} text-center`}>Tracked with KPI Tracker</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-xl font-medium transition-colors"
        >
          {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
          {copied ? 'Copied!' : 'Copy as Text'}
        </button>
        <button
          onClick={handleShareNative}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-medium transition-colors"
        >
          <Share2 size={18} />
          Share
        </button>
      </div>

      {/* Text Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Users size={18} />
          Text Preview
        </h3>
        <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-64">
          {generateTextSummary()}
        </pre>
      </div>
    </div>
  );
}
