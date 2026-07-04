'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { format, addDays, subDays, isToday, isFuture } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, MessageSquare, Flame, Trophy, X } from 'lucide-react';
import { AppData, RAGStatus, CATEGORY_COLORS, CATEGORY_LABELS, isGoalScheduledForDate, isWeeklyGoal } from '@/lib/types';
import { getEntry, getDailyScore, getStreakForGoal, getWeeklyProgress } from '@/lib/storage';
import { BADGE_DEFINITIONS, Badge } from '@/lib/badges';
import { CalendarDays } from 'lucide-react';
import RAGSmiley from './RAGSmiley';

interface DailyTrackerProps {
  data: AppData;
  onRatingChange: (date: string, goalId: string, status: RAGStatus) => void;
  onBatchRatingChange: (date: string, ratings: Record<string, RAGStatus>) => void;
  onNotesChange: (date: string, notes: string) => void;
}

function BadgeToast({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-2xl px-6 py-4 shadow-2xl shadow-amber-500/30 flex items-center gap-4 min-w-[300px] max-w-md">
        <span className="text-4xl">{badge.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className="text-white" size={16} />
            <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Badge Unlocked!</span>
          </div>
          <p className="text-white font-bold text-lg truncate">{badge.name}</p>
          <p className="text-white/80 text-sm truncate">{badge.description}</p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors flex-shrink-0">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default function DailyTracker({ data, onRatingChange, onBatchRatingChange, onNotesChange }: DailyTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNotes, setShowNotes] = useState(true);
  const [badgeToast, setBadgeToast] = useState<Badge | null>(null);
  const prevBadgesRef = useRef<Set<string>>(new Set());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const entry = getEntry(data, dateStr);
  const score = getDailyScore(data, dateStr);
  const allActiveGoals = data.goals.filter(g => g.active);
  const activeGoals = allActiveGoals.filter(g => isGoalScheduledForDate(g, selectedDate));
  const hiddenCount = allActiveGoals.length - activeGoals.length;

  // Detect newly earned badges from persisted data.badges (avoids expensive recalculation)
  const dismissToast = useCallback(() => setBadgeToast(null), []);

  useEffect(() => {
    if (!data.badges) return;
    const earnedIds = new Set(
      Object.entries(data.badges).filter(([, v]) => v.earned).map(([k]) => k)
    );

    // On first render, just capture the current state
    if (prevBadgesRef.current.size === 0 && earnedIds.size > 0) {
      prevBadgesRef.current = earnedIds;
      return;
    }

    // Find newly earned badge
    const newBadge = Array.from(earnedIds).find(id => !prevBadgesRef.current.has(id));
    if (newBadge) {
      const def = BADGE_DEFINITIONS.find(b => b.id === newBadge);
      if (def) {
        setBadgeToast({ ...def, earned: true, earnedDate: data.badges![newBadge].earnedDate });
      }
    }

    prevBadgesRef.current = earnedIds;
  }, [data.badges]);

  // Group goals by category
  const groupedGoals = activeGoals.reduce((acc, goal) => {
    if (!acc[goal.category]) acc[goal.category] = [];
    acc[goal.category].push(goal);
    return acc;
  }, {} as Record<string, typeof activeGoals>);

  const getScoreEmoji = () => {
    if (score >= 80) return '🔥';
    if (score >= 50) return '💪';
    if (score > 0) return '📈';
    return '🎯';
  };

  const completedCount = activeGoals.filter(g => entry.ratings[g.id] === 'green').length;
  const ratedCount = activeGoals.filter(g => entry.ratings[g.id]).length;
  const unratedGoals = activeGoals.filter(g => !entry.ratings[g.id]);

  const handleAllGreen = () => {
    const ratings: Record<string, RAGStatus> = {};
    for (const g of unratedGoals) ratings[g.id] = 'green';
    onBatchRatingChange(dateStr, ratings);
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <Calendar size={18} className="text-gray-400" />
            <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
              <span className="hidden sm:inline">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              <span className="sm:hidden">{format(selectedDate, 'EEE, MMM d')}</span>
            </h2>
          </div>
          {isToday(selectedDate) && (
            <span className="text-sm text-blue-500 font-medium">Today</span>
          )}
        </div>

        <button
          onClick={() => !isFuture(addDays(selectedDate, 1)) && setSelectedDate(addDays(selectedDate, 1))}
          className={`p-2 rounded-lg transition-colors ${
            isFuture(addDays(selectedDate, 1))
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          disabled={isFuture(addDays(selectedDate, 1))}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Daily Score Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Daily Score</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{score}%</span>
              <span className="text-2xl">{getScoreEmoji()}</span>
            </div>
            <p className="text-blue-100 mt-1">
              {completedCount}/{activeGoals.length} goals achieved &middot; {ratedCount}/{activeGoals.length} rated
            </p>
            {unratedGoals.length > 0 && !isFuture(selectedDate) && (
              <button
                onClick={handleAllGreen}
                className="mt-3 inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                ✅ Mark {ratedCount > 0 ? 'the rest' : 'all'} green
              </button>
            )}
          </div>
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
              <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="7" />
              <circle
                cx="48" cy="48" r="42" fill="none"
                stroke="white" strokeWidth="7" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - score / 100)}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-3xl">
              {score > 0 ? (score >= 80 ? '😄' : score >= 50 ? '😐' : '😞') : '⚪'}
            </span>
          </div>
        </div>
      </div>

      {/* Goals by Category */}
      {Object.entries(groupedGoals).map(([category, goals]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[category] }}
            />
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {CATEGORY_LABELS[category] || category}
            </h3>
          </div>

          <div className="grid gap-3">
            {goals.map(goal => {
              const streak = getStreakForGoal(data, goal.id);
              const weekly = isWeeklyGoal(goal) ? getWeeklyProgress(data, goal, selectedDate) : null;
              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <span className="text-2xl flex-shrink-0">{goal.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{goal.name}</p>
                    {goal.target && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{goal.target}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {weekly && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        weekly.count >= weekly.target
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {weekly.count}/{weekly.target} wk
                      </span>
                    )}
                    {streak > 0 && (
                      <div className="flex items-center gap-1 text-orange-500 text-sm font-medium">
                        <Flame size={14} />
                        {streak}{weekly ? 'w' : ''}
                      </div>
                    )}
                    <RAGSmiley
                      status={entry.ratings[goal.id] || null}
                      onClick={(status) => onRatingChange(dateStr, goal.id, status)}
                      size="md"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Hidden goals notice */}
      {hiddenCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
          <CalendarDays size={16} className="flex-shrink-0" />
          <span>{hiddenCount} goal{hiddenCount > 1 ? 's' : ''} not scheduled for {format(selectedDate, 'EEEE')}</span>
        </div>
      )}

      {/* Notes Section */}
      <NotesSection
        notes={entry.notes}
        showNotes={showNotes}
        onToggle={() => setShowNotes(!showNotes)}
        onSave={(notes) => onNotesChange(dateStr, notes)}
      />

      {/* Badge Toast */}
      {badgeToast && <BadgeToast badge={badgeToast} onClose={dismissToast} />}
    </div>
  );
}

function NotesSection({ notes, showNotes, onToggle, onSave }: {
  notes: string;
  showNotes: boolean;
  onToggle: () => void;
  onSave: (notes: string) => void;
}) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const handleBlur = () => {
    if (localNotes !== notes) {
      onSave(localNotes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors w-full"
      >
        <MessageSquare size={18} />
        <span className="font-medium">Daily Notes</span>
        {notes && <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">Has notes</span>}
        <span className="flex-1" />
        {saved && <span className="text-xs text-emerald-500 font-medium">Saved</span>}
      </button>
      {showNotes && (
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={handleBlur}
          placeholder="How was your day? Any reflections..."
          className="mt-3 w-full h-24 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 border-0 focus:ring-2 focus:ring-blue-500 resize-none"
        />
      )}
    </div>
  );
}
