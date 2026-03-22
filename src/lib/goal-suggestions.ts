import { Goal, AgeRange, Gender } from './types';

export interface GoalSuggestion {
  id: string;
  name: string;
  category: Goal['category'];
  icon: string;
  target: string;
  tags: string[]; // used for filtering by profile
}

const ALL_SUGGESTIONS: GoalSuggestion[] = [
  // Fitness
  { id: 'pressups', name: '25 Press Ups', category: 'fitness', icon: '💪', target: '25 reps', tags: ['all'] },
  { id: 'situps', name: '25 Sit Ups', category: 'fitness', icon: '🏋️', target: '25 reps', tags: ['all'] },
  { id: 'squats', name: '25 Squats', category: 'fitness', icon: '🦵', target: '25 reps', tags: ['all'] },
  { id: 'run-5k', name: 'Run / Jog', category: 'fitness', icon: '🏃', target: 'Get moving', tags: ['all'] },
  { id: 'daily-walk', name: '30 Minute Walk', category: 'fitness', icon: '🚶', target: '30 minutes', tags: ['all', 'gentle'] },
  { id: 'yoga', name: 'Yoga / Stretching', category: 'fitness', icon: '🧘', target: '15 minutes', tags: ['all', 'gentle'] },
  { id: 'steps-10k', name: '10,000 Steps', category: 'fitness', icon: '👟', target: '10k steps', tags: ['all'] },
  { id: 'swim', name: 'Go Swimming', category: 'fitness', icon: '🏊', target: 'Swim session', tags: ['all'] },

  // Nutrition
  { id: 'breakfast', name: 'Healthy Breakfast', category: 'nutrition', icon: '🥣', target: 'Nutritious meal', tags: ['all'] },
  { id: 'lunch', name: 'Healthy Lunch', category: 'nutrition', icon: '🥗', target: 'Balanced meal', tags: ['all'] },
  { id: 'dinner', name: 'Healthy Dinner', category: 'nutrition', icon: '🍽️', target: 'Nutritious meal', tags: ['all'] },
  { id: 'no-alcohol', name: 'No Alcohol', category: 'nutrition', icon: '🚫🍺', target: 'Stay dry', tags: ['adult'] },
  { id: 'no-fizzy', name: 'No Fizzy Drinks', category: 'nutrition', icon: '🚫🥤', target: 'Water instead', tags: ['all'] },
  { id: 'water', name: 'Drink 2L Water', category: 'nutrition', icon: '💧', target: '2 litres', tags: ['all'] },
  { id: 'supplements', name: 'Take Supplements', category: 'nutrition', icon: '💊', target: 'Daily vitamins', tags: ['all'] },
  { id: 'no-junk', name: 'No Junk Food', category: 'nutrition', icon: '🚫🍔', target: 'Eat clean', tags: ['all'] },
  { id: 'fruit-veg', name: '5 Fruit & Veg', category: 'nutrition', icon: '🍎', target: '5 a day', tags: ['all'] },

  // Learning
  { id: 'french', name: 'Learn French', category: 'learning', icon: '🇫🇷', target: 'Daily practice', tags: ['all'] },
  { id: 'spanish', name: 'Learn Spanish', category: 'learning', icon: '🇪🇸', target: 'Daily practice', tags: ['all'] },
  { id: 'german', name: 'Learn German', category: 'learning', icon: '🇩🇪', target: 'Daily practice', tags: ['all'] },
  { id: 'coding-ai', name: 'Learn Coding with AI', category: 'learning', icon: '🤖', target: 'Daily session', tags: ['all'] },
  { id: 'reading', name: 'Read 30 Minutes', category: 'learning', icon: '📚', target: '30 minutes', tags: ['all'] },
  { id: 'instrument', name: 'Practice an Instrument', category: 'learning', icon: '🎸', target: '20 minutes', tags: ['all'] },
  { id: 'journaling', name: 'Write in Journal', category: 'learning', icon: '📝', target: 'Daily entry', tags: ['all'] },
  { id: 'podcast', name: 'Listen to a Podcast', category: 'learning', icon: '🎧', target: '1 episode', tags: ['all'] },

  // Wellbeing
  { id: 'meditate', name: 'Meditate', category: 'wellbeing', icon: '🧘‍♂️', target: '10 minutes', tags: ['all'] },
  { id: 'kindness', name: 'Be a Nice Person', category: 'wellbeing', icon: '😊', target: 'Daily kindness', tags: ['all'] },
  { id: 'sleep-8h', name: 'Sleep 8 Hours', category: 'wellbeing', icon: '😴', target: '8 hours', tags: ['all'] },
  { id: 'screen-limit', name: 'Limit Screen Time', category: 'wellbeing', icon: '📵', target: 'Under 2 hours', tags: ['all'] },
  { id: 'gratitude', name: 'Gratitude Practice', category: 'wellbeing', icon: '🙏', target: '3 things', tags: ['all'] },
  { id: 'no-social', name: 'No Social Media', category: 'wellbeing', icon: '🚫📱', target: 'Stay offline', tags: ['all'] },
  { id: 'outdoors', name: 'Spend Time Outdoors', category: 'wellbeing', icon: '🌳', target: '30 minutes', tags: ['all'] },
  { id: 'connect', name: 'Connect with Someone', category: 'wellbeing', icon: '💬', target: 'Call or meet', tags: ['all'] },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSuggestedGoals(ageRange: AgeRange, gender: Gender): GoalSuggestion[] {
  const isAdult = ageRange !== '13-17';
  const isOlder = ageRange === '55-64' || ageRange === '65+';

  return ALL_SUGGESTIONS.filter(s => {
    // Filter out alcohol for under 18s
    if (!isAdult && s.tags.includes('adult')) return false;
    return true;
  }).sort((a, b) => {
    // Boost gentle exercises for older users
    if (isOlder) {
      const aGentle = a.tags.includes('gentle') ? -1 : 0;
      const bGentle = b.tags.includes('gentle') ? -1 : 0;
      if (aGentle !== bGentle) return aGentle - bGentle;
    }
    return 0;
  });
}

export function suggestionToGoal(suggestion: GoalSuggestion, order: number): Goal {
  return {
    id: suggestion.id,
    name: suggestion.name,
    category: suggestion.category,
    icon: suggestion.icon,
    target: suggestion.target,
    order,
    active: true,
    createdAt: new Date().toISOString(),
  };
}
