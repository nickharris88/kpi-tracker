'use client';

import { useState } from 'react';
import { AgeRange, Gender, UserProfile, Goal } from '@/lib/types';
import { getSuggestedGoals, GoalSuggestion, suggestionToGoal } from '@/lib/goal-suggestions';
import { ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile, goals: Goal[]) => void;
}

const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: '13-17', label: '13–17' },
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
  { value: '55-64', label: '55–64' },
  { value: '65+', label: '65+' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const CATEGORY_LABELS: Record<string, string> = {
  fitness: 'Fitness',
  nutrition: 'Nutrition',
  learning: 'Learning',
  wellbeing: 'Wellbeing',
};

const CATEGORY_COLORS: Record<string, string> = {
  fitness: 'bg-blue-100 text-blue-700 border-blue-300',
  nutrition: 'bg-green-100 text-green-700 border-green-300',
  learning: 'bg-purple-100 text-purple-700 border-purple-300',
  wellbeing: 'bg-amber-100 text-amber-700 border-amber-300',
};

const CATEGORY_COLORS_SELECTED: Record<string, string> = {
  fitness: 'bg-blue-500 text-white border-blue-500',
  nutrition: 'bg-green-500 text-white border-green-500',
  learning: 'bg-purple-500 text-white border-purple-500',
  wellbeing: 'bg-amber-500 text-white border-amber-500',
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState<AgeRange | ''>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [selectedGoalIds, setSelectedGoalIds] = useState<Set<string>>(new Set());
  const [customGoalName, setCustomGoalName] = useState('');
  const [customGoals, setCustomGoals] = useState<GoalSuggestion[]>([]);

  const suggestions = ageRange && gender
    ? getSuggestedGoals(ageRange, gender)
    : [];

  const allSuggestions = [...suggestions, ...customGoals];

  const toggleGoal = (id: string) => {
    setSelectedGoalIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCustomGoal = () => {
    if (!customGoalName.trim()) return;
    const id = `custom-${Date.now()}`;
    const custom: GoalSuggestion = {
      id,
      name: customGoalName.trim(),
      category: 'custom',
      icon: '⭐',
      target: 'Daily goal',
      tags: ['all'],
    };
    setCustomGoals(prev => [...prev, custom]);
    setSelectedGoalIds(prev => new Set(prev).add(id));
    setCustomGoalName('');
  };

  const handleFinish = () => {
    const profile: UserProfile = {
      name: name.trim(),
      ageRange: ageRange as AgeRange,
      gender: gender as Gender,
      onboardingComplete: true,
    };
    const goals: Goal[] = allSuggestions
      .filter(s => selectedGoalIds.has(s.id))
      .map((s, i) => suggestionToGoal(s, i));
    onComplete(profile, goals);
  };

  const canProceedStep0 = name.trim().length > 0 && ageRange !== '' && gender !== '';
  const canProceedStep1 = selectedGoalIds.size > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-8 bg-blue-500' : i < step ? 'w-2 bg-blue-300' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome & Profile */}
        {step === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <span className="text-5xl mb-4 block">🎯</span>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to KPI Tracker</h1>
              <p className="text-gray-500 dark:text-gray-400">Let&apos;s set you up with some personal goals to track every day.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">What&apos;s your name?</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-lg text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Age range</label>
                <div className="grid grid-cols-4 gap-2">
                  {AGE_RANGES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setAgeRange(value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        ageRange === value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                <div className="grid grid-cols-4 gap-2">
                  {GENDERS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setGender(value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        gender === value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Choose Your Goals <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Goal Selection */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Choose Your Goals</h2>
              <p className="text-gray-500 dark:text-gray-400">Pick the goals you&apos;d like to track daily. You can always change these later.</p>
            </div>

            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
              {(['fitness', 'nutrition', 'learning', 'wellbeing'] as const).map(category => {
                const categoryGoals = allSuggestions.filter(s => s.category === category);
                if (categoryGoals.length === 0) return null;
                return (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {CATEGORY_LABELS[category]}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categoryGoals.map(s => {
                        const selected = selectedGoalIds.has(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleGoal(s.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                              selected
                                ? CATEGORY_COLORS_SELECTED[category]
                                : CATEGORY_COLORS[category] + ' hover:shadow-sm'
                            }`}
                          >
                            <span className="text-xl flex-shrink-0">{s.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${selected ? 'text-white' : ''}`}>{s.name}</div>
                              <div className={`text-xs ${selected ? 'text-white/80' : 'opacity-70'}`}>{s.target}</div>
                            </div>
                            {selected && <Check size={18} className="flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Custom goals section */}
              {customGoals.filter(g => g.category === 'custom').length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {customGoals.map(s => {
                      const selected = selectedGoalIds.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleGoal(s.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                            selected
                              ? 'bg-gray-600 text-white border-gray-600'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:shadow-sm'
                          }`}
                        >
                          <span className="text-xl flex-shrink-0">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${selected ? 'text-white' : ''}`}>{s.name}</div>
                          </div>
                          {selected && <Check size={18} />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomGoals(prev => prev.filter(g => g.id !== s.id));
                              setSelectedGoalIds(prev => {
                                const next = new Set(prev);
                                next.delete(s.id);
                                return next;
                              });
                            }}
                            className="opacity-60 hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Add custom goal */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={customGoalName}
                onChange={e => setCustomGoalName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomGoal()}
                placeholder="Add your own goal..."
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm text-gray-900 dark:text-white"
              />
              <button
                onClick={addCustomGoal}
                disabled={!customGoalName.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setStep(0)}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <div className="text-sm text-gray-500">
                {selectedGoalIds.size} goal{selectedGoalIds.size !== 1 ? 's' : ''} selected
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Review <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">🚀</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">You&apos;re all set, {name.trim()}!</h2>
              <p className="text-gray-500 dark:text-gray-400">Here are the goals you&apos;ll be tracking:</p>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
              {allSuggestions
                .filter(s => selectedGoalIds.has(s.id))
                .map(s => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                    <span className="ml-auto text-xs text-gray-400 capitalize">{s.category}</span>
                  </div>
                ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
              >
                <ChevronLeft size={16} /> Change Goals
              </button>
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors text-lg"
              >
                Start Tracking!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
