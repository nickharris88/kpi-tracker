'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Share2, Copy, Check, Trophy, Flame, Target, TrendingUp, Users, Link2, RefreshCw, Eye } from 'lucide-react';
import { useAppData } from '@/app/providers';
import { generateShareSummary, getCompletionRate, getStreakForGoal, getDailyScore } from '@/lib/storage';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types';
import { generateShareCode, updateSharedDashboard, deleteSharedDashboard } from '@/lib/firestore-storage';

type CardTheme = 'blue' | 'purple' | 'emerald' | 'sunset';

const themes: Record<CardTheme, { from: string; to: string; accent: string }> = {
  blue: { from: 'from-blue-500', to: 'to-indigo-600', accent: 'text-blue-100' },
  purple: { from: 'from-purple-500', to: 'to-pink-600', accent: 'text-purple-100' },
  emerald: { from: 'from-emerald-500', to: 'to-teal-600', accent: 'text-emerald-100' },
  sunset: { from: 'from-orange-500', to: 'to-red-600', accent: 'text-orange-100' },
};

export default function SharePage() {
  const { data, user, updateSharing } = useAppData();
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
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

  const sharingEnabled = data.sharing?.enabled ?? false;
  const shareCode = data.sharing?.shareCode ?? '';

  const getShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/shared/${shareCode}`;
  }, [shareCode]);

  const handleToggleSharing = useCallback(async () => {
    if (sharingEnabled) {
      // Disable sharing
      if (shareCode) {
        await deleteSharedDashboard(shareCode);
      }
      updateSharing({ enabled: false, shareCode: '', sharedWith: [] });
    } else {
      // Enable sharing
      const code = generateShareCode();
      updateSharing({ enabled: true, shareCode: code, sharedWith: [] });
      // The shared dashboard will be created on next persist via saveUserData
      if (user) {
        const newData = { ...data, sharing: { enabled: true, shareCode: code, sharedWith: [] } };
        await updateSharedDashboard(user.uid, newData);
      }
    }
  }, [sharingEnabled, shareCode, updateSharing, user, data]);

  const handleRegenerateCode = useCallback(async () => {
    if (shareCode) {
      await deleteSharedDashboard(shareCode);
    }
    const newCode = generateShareCode();
    updateSharing({ enabled: true, shareCode: newCode, sharedWith: data.sharing?.sharedWith ?? [] });
    if (user) {
      const newData = { ...data, sharing: { enabled: true, shareCode: newCode, sharedWith: data.sharing?.sharedWith ?? [] } };
      await updateSharedDashboard(user.uid, newData);
    }
  }, [shareCode, updateSharing, user, data]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(getShareUrl());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

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

      {/* Accountability Partner Section */}
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-indigo-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Accountability Partner</h3>
            </div>
            <button
              onClick={handleToggleSharing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                sharingEnabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  sharingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Share a live, read-only view of your dashboard with friends or accountability partners. They can see your goals, streaks, and daily progress without needing to log in.
          </p>

          {sharingEnabled && shareCode && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                <Link2 size={16} className="text-gray-400 flex-shrink-0" />
                <code className="text-sm text-indigo-600 dark:text-indigo-400 flex-1 truncate">
                  {getShareUrl()}
                </code>
                <button
                  onClick={handleCopyLink}
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Copy link"
                >
                  {linkCopied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-gray-400" />}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRegenerateCode}
                  className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <RefreshCw size={14} />
                  Regenerate link
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <a
                  href={getShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  <Eye size={14} />
                  Preview shared view
                </a>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Firestore Security Rules Note */}
      {user && sharingEnabled && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">Firestore Security Rules</p>
          <p className="text-xs text-amber-600 dark:text-amber-300">
            Ensure your Firestore rules allow public reads on <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">/shared/&#123;code&#125;</code> while restricting writes to the owner. See the project README for the recommended rules.
          </p>
        </div>
      )}
    </div>
  );
}
