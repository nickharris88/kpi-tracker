'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Edit3, Check, X, Sparkles, CalendarDays } from 'lucide-react';
import { Goal, GoalSchedule, CATEGORY_COLORS, CATEGORY_LABELS, DAY_LABELS_SINGLE, getScheduleLabel } from '@/lib/types';
import { useAppData } from '@/app/providers';
import { getSuggestedGoals, GoalSuggestion, suggestionToGoal } from '@/lib/goal-suggestions';

const CATEGORY_OPTIONS = ['fitness', 'nutrition', 'learning', 'wellbeing', 'custom'] as const;
const ICON_OPTIONS = ['🎯', '💪', '🏋️', '🦵', '🏃', '💊', '🥣', '🥗', '🍽️', '😊', '📚', '🇪🇸', '🧘', '💤', '💧', '🎨', '🎵', '📝', '🧠', '⭐'];

export default function GoalsPage() {
  const { data, addGoal, updateGoal, removeGoal } = useAppData();
  const [showAdd, setShowAdd] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    category: 'custom' as Goal['category'],
    icon: '🎯',
    target: '',
    active: true,
    schedule: 'daily' as GoalSchedule,
    scheduleDays: [] as number[],
  });

  const existingGoalIds = new Set(data.goals.map(g => g.id));
  const suggestions = getSuggestedGoals(
    data.profile?.ageRange || 'prefer-not-to-say',
    data.profile?.gender || 'prefer-not-to-say'
  ).filter(s => !existingGoalIds.has(s.id));

  const addSuggestion = (suggestion: GoalSuggestion) => {
    const goal = suggestionToGoal(suggestion, data.goals.length);
    addGoal(goal);
  };

  const handleAdd = () => {
    if (!newGoal.name.trim()) return;
    addGoal(newGoal);
    setNewGoal({ name: '', category: 'custom', icon: '🎯', target: '', active: true, schedule: 'daily', scheduleDays: [] });
    setShowAdd(false);
  };

  const activeGoals = data.goals.filter(g => g.active);
  const inactiveGoals = data.goals.filter(g => !g.active);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your daily KPI goals</p>
        </div>
        <div className="flex items-center gap-2">
          {suggestions.length > 0 && (
            <button
              onClick={() => { setShowSuggestions(!showSuggestions); setShowAdd(false); }}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Sparkles size={18} />
              <span className="hidden sm:inline">Browse</span>
            </button>
          )}
          <button
            onClick={() => { setShowAdd(!showAdd); setShowSuggestions(false); }}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Custom</span>
          </button>
        </div>
      </div>

      {/* Add Goal Form */}
      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">New Goal</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={newGoal.name}
                onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="e.g., Read 30 minutes"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target</label>
              <input
                type="text"
                value={newGoal.target}
                onChange={e => setNewGoal({ ...newGoal, target: e.target.value })}
                placeholder="e.g., 30 minutes daily"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={newGoal.category}
                onChange={e => setNewGoal({ ...newGoal, category: e.target.value as Goal['category'] })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
              <div className="flex flex-wrap gap-1">
                {ICON_OPTIONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewGoal({ ...newGoal, icon })}
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors ${
                      newGoal.icon === icon
                        ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule</label>
            <SchedulePicker
              schedule={newGoal.schedule}
              scheduleDays={newGoal.scheduleDays}
              onScheduleChange={(schedule) => setNewGoal({ ...newGoal, schedule })}
              onScheduleDaysChange={(scheduleDays) => setNewGoal({ ...newGoal, scheduleDays })}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newGoal.name.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium"
            >
              Add Goal
            </button>
          </div>
        </div>
      )}

      {/* Browse Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Add a Suggested Goal</h3>
          {(['fitness', 'nutrition', 'learning', 'wellbeing'] as const).map(category => {
            const categoryGoals = suggestions.filter(s => s.category === category);
            if (categoryGoals.length === 0) return null;
            return (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {CATEGORY_LABELS[category]}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoryGoals.map(s => (
                    <button
                      key={s.id}
                      onClick={() => addSuggestion(s)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-xl flex-shrink-0">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.target}</p>
                      </div>
                      <Plus size={16} className="text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Goals */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Active Goals ({activeGoals.length})
        </h2>
        <div className="space-y-2">
          {activeGoals.map(goal => (
            <GoalRow
              key={goal.id}
              goal={goal}
              isEditing={editingId === goal.id}
              onEdit={() => setEditingId(goal.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={(updates) => { updateGoal(goal.id, updates); setEditingId(null); }}
              onToggleActive={() => updateGoal(goal.id, { active: false })}
              onRemove={() => removeGoal(goal.id)}
            />
          ))}
        </div>
      </div>

      {/* Inactive Goals */}
      {inactiveGoals.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Inactive Goals ({inactiveGoals.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {inactiveGoals.map(goal => (
              <div
                key={goal.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{goal.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white line-through">{goal.name}</p>
                    <p className="text-xs text-gray-500">{CATEGORY_LABELS[goal.category]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateGoal(goal.id, { active: true })}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Reactivate
                  </button>
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="p-1 text-red-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const SCHEDULE_PRESETS: { value: GoalSchedule; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'custom', label: 'Custom' },
];

function SchedulePicker({
  schedule,
  scheduleDays,
  onScheduleChange,
  onScheduleDaysChange,
}: {
  schedule: GoalSchedule;
  scheduleDays: number[];
  onScheduleChange: (s: GoalSchedule) => void;
  onScheduleDaysChange: (d: number[]) => void;
}) {
  const toggleDay = (day: number) => {
    if (scheduleDays.includes(day)) {
      onScheduleDaysChange(scheduleDays.filter(d => d !== day));
    } else {
      onScheduleDaysChange([...scheduleDays, day]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {SCHEDULE_PRESETS.map(preset => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onScheduleChange(preset.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              schedule === preset.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {schedule === 'custom' && (
        <div className="flex gap-1">
          {DAY_LABELS_SINGLE.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                scheduleDays.includes(idx)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalRow({
  goal,
  isEditing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onToggleActive,
  onRemove,
}: {
  goal: Goal;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (updates: Partial<Goal>) => void;
  onToggleActive: () => void;
  onRemove: () => void;
}) {
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(goal.target || '');
  const [editSchedule, setEditSchedule] = useState<GoalSchedule>(goal.schedule || 'daily');
  const [editScheduleDays, setEditScheduleDays] = useState<number[]>(goal.scheduleDays || []);

  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 border-blue-400 dark:border-blue-500 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xl">{goal.icon}</span>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
          />
          <input
            type="text"
            value={editTarget}
            onChange={e => setEditTarget(e.target.value)}
            placeholder="Target"
            className="w-40 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Schedule</label>
          <SchedulePicker
            schedule={editSchedule}
            scheduleDays={editScheduleDays}
            onScheduleChange={setEditSchedule}
            onScheduleDaysChange={setEditScheduleDays}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancelEdit} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
          <button
            onClick={() => onUpdate({
              name: editName,
              target: editTarget,
              schedule: editSchedule,
              scheduleDays: editSchedule === 'custom' ? editScheduleDays : undefined,
            })}
            className="p-1 text-emerald-500 hover:text-emerald-600"
          >
            <Check size={18} />
          </button>
        </div>
      </div>
    );
  }

  const scheduleLabel = getScheduleLabel(goal);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <GripVertical size={16} className="text-gray-300 dark:text-gray-600" />
        <span className="text-xl">{goal.icon}</span>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{goal.name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: CATEGORY_COLORS[goal.category] + '20',
                color: CATEGORY_COLORS[goal.category],
              }}
            >
              {CATEGORY_LABELS[goal.category]}
            </span>
            {goal.target && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{goal.target}</span>
            )}
            {scheduleLabel !== 'Daily' && (
              <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                <CalendarDays size={12} />
                {scheduleLabel}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <Edit3 size={16} />
        </button>
        <button onClick={onToggleActive} className="p-1.5 text-gray-400 hover:text-amber-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Deactivate">
          <X size={16} />
        </button>
        <button onClick={onRemove} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
