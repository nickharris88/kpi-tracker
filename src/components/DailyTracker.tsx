'use client';

import { useState } from 'react';
import { format, addDays, subDays, isToday, isFuture } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, MessageSquare, Flame } from 'lucide-react';
import { AppData, RAGStatus, CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types';
import { getEntry, getDailyScore, getStreakForGoal } from '@/lib/storage';
import RAGSmiley from './RAGSmiley';

interface DailyTrackerProps {
  data: AppData;
  onRatingChange: (date: string, goalId: string, status: RAGStatus) => void;
  onNotesChange: (date: string, notes: string) => void;
}

export default function DailyTracker({ data, onRatingChange, onNotesChange }: DailyTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNotes, setShowNotes] = useState(false);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const entry = getEntry(data, dateStr);
  const score = getDailyScore(data, dateStr);
  const activeGoals = data.goals.filter(g => g.active);

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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
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
          </div>
          <div className="text-right">
            <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center">
              <span className={`text-4xl font-bold ${score >= 80 ? 'text-white' : score >= 50 ? 'text-yellow-200' : 'text-red-200'}`}>
                {score > 0 ? (score >= 80 ? '😄' : score >= 50 ? '😐' : '😞') : '⚪'}
              </span>
            </div>
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
              return (
                <div
                  key={goal.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{goal.name}</p>
                      {goal.target && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{goal.target}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {streak > 0 && (
                      <div className="flex items-center gap-1 text-orange-500 text-sm font-medium">
                        <Flame size={14} />
                        {streak}
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

      {/* Notes Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors w-full"
        >
          <MessageSquare size={18} />
          <span className="font-medium">Daily Notes</span>
          {entry.notes && <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">Has notes</span>}
        </button>
        {showNotes && (
          <textarea
            value={entry.notes}
            onChange={(e) => onNotesChange(dateStr, e.target.value)}
            placeholder="How was your day? Any reflections..."
            className="mt-3 w-full h-24 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 border-0 focus:ring-2 focus:ring-blue-500 resize-none"
          />
        )}
      </div>
    </div>
  );
}
