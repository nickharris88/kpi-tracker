'use client';

import { useState, useEffect } from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { useAppData } from '@/app/providers';
import { checkBadges, Badge } from '@/lib/badges';

function BadgeCard({ badge, isNew }: { badge: Badge; isNew: boolean }) {
  const [showCelebration, setShowCelebration] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div
      className={`
        relative rounded-2xl p-6 text-center transition-all duration-500 border-2
        ${badge.earned
          ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40 border-amber-300 dark:border-amber-600 shadow-lg hover:shadow-xl hover:scale-105'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-80'
        }
      `}
    >
      {/* Celebration animation */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="animate-ping absolute w-full h-full rounded-2xl bg-yellow-400/20" />
          <div className="absolute -top-2 -right-2 animate-bounce">
            <Sparkles className="text-yellow-500" size={24} />
          </div>
          <div className="absolute -top-2 -left-2 animate-bounce delay-100">
            <Sparkles className="text-orange-500" size={20} />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 animate-bounce delay-200">
            <Sparkles className="text-amber-500" size={18} />
          </div>
        </div>
      )}

      {/* Badge Icon */}
      <div className={`text-5xl mb-3 ${badge.earned ? 'animate-none' : 'grayscale'} transition-all`}>
        {badge.icon}
      </div>

      {/* Badge Name */}
      <h3 className={`font-bold text-lg mb-1 ${
        badge.earned
          ? 'text-gray-900 dark:text-white'
          : 'text-gray-400 dark:text-gray-500'
      }`}>
        {badge.name}
      </h3>

      {/* Description or Hint */}
      <p className={`text-sm ${
        badge.earned
          ? 'text-gray-600 dark:text-gray-300'
          : 'text-gray-400 dark:text-gray-500'
      }`}>
        {badge.earned ? badge.description : badge.hint}
      </p>

      {/* Earned Date */}
      {badge.earned && badge.earnedDate && (
        <div className="mt-3 inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-medium px-3 py-1 rounded-full">
          <Trophy size={12} />
          Earned {new Date(badge.earnedDate).toLocaleDateString()}
        </div>
      )}

      {/* Locked indicator */}
      {!badge.earned && (
        <div className="mt-3 inline-flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium px-3 py-1 rounded-full">
          Locked
        </div>
      )}
    </div>
  );
}

export default function BadgesPage() {
  const { data } = useAppData();
  const badges = checkBadges(data);
  const earnedCount = badges.filter(b => b.earned).length;
  const totalCount = badges.length;
  const progressPercent = Math.round((earnedCount / totalCount) * 100);

  // Track which badges are "new" in this session
  const [seenBadges, setSeenBadges] = useState<Set<string>>(new Set());
  useEffect(() => {
    const stored = localStorage.getItem('kpi-seen-badges');
    if (stored) {
      setSeenBadges(new Set(JSON.parse(stored)));
    }
  }, []);

  useEffect(() => {
    const earnedIds = badges.filter(b => b.earned).map(b => b.id);
    if (earnedIds.length > 0) {
      const timer = setTimeout(() => {
        const merged = Array.from(seenBadges).concat(earnedIds);
        const newSeen = new Set(merged);
        setSeenBadges(newSeen);
        localStorage.setItem('kpi-seen-badges', JSON.stringify(Array.from(newSeen)));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [badges, seenBadges]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 shadow-lg shadow-amber-500/30">
          <Trophy className="text-white" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Achievements & Badges
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Celebrate your milestones! Keep tracking to unlock all badges.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Badge Progress
          </span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {earnedCount} / {totalCount} unlocked
          </span>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-2 text-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Earned Badges */}
      {earnedCount > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🏆</span> Earned Badges
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.filter(b => b.earned).map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                isNew={!seenBadges.has(badge.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {earnedCount < totalCount && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🔒</span> Locked Badges
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.filter(b => !b.earned).map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                isNew={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Motivational Footer */}
      <div className="text-center py-8">
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          {earnedCount === totalCount
            ? '🎉 Incredible! You\'ve unlocked every badge. You\'re a true champion!'
            : earnedCount > totalCount / 2
            ? '🔥 You\'re on fire! Keep pushing to unlock them all!'
            : earnedCount > 0
            ? '💪 Great start! Keep tracking to unlock more badges.'
            : '🚀 Start tracking your goals to earn your first badge!'}
        </p>
      </div>
    </div>
  );
}
