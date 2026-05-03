'use client';

import { AppData, isGoalScheduledForDate } from './types';
import { getDailyScore, getStreakForGoal } from './storage';

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  hint: string;
}

export interface BadgeStatus {
  earned: boolean;
  earnedDate?: string;
}

export interface Badge extends BadgeDefinition {
  earned: boolean;
  earnedDate?: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-flame',
    name: 'First Flame',
    description: 'Completed your first day of tracking',
    icon: '\uD83D\uDD25',
    hint: 'Rate at least one goal to earn this badge',
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: '7-day streak on any goal',
    icon: '\uD83D\uDCC5',
    hint: 'Keep a goal green for 7 days straight',
  },
  {
    id: 'month-master',
    name: 'Month Master',
    description: '30-day streak on any goal',
    icon: '\uD83C\uDFC5',
    hint: 'Keep a goal green for 30 days straight',
  },
  {
    id: 'perfect-day',
    name: 'Perfect Day',
    description: 'Rated every goal and scored 100%',
    icon: '\uD83D\uDCAF',
    hint: 'Rate every scheduled goal and get them all green',
  },
  {
    id: 'perfect-week',
    name: 'Perfect Week',
    description: '100% score every day for a week',
    icon: '\u2B50',
    hint: 'Get a perfect score 7 days in a row',
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Logged a rating before 9am',
    icon: '\uD83C\uDF05',
    hint: 'Log your goals before 9am to earn this',
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: '90%+ average score for 30 days',
    icon: '\uD83C\uDFAF',
    hint: 'Maintain a 90%+ average score over 30 days',
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: '100 days tracked',
    icon: '\uD83C\uDFC6',
    hint: 'Track your goals for 100 days',
  },
  {
    id: 'all-green',
    name: 'All Green',
    description: 'All active goals green \u2014 including unscheduled ones',
    icon: '\uD83C\uDF08',
    hint: 'Get green on every single active goal in one day, even those not scheduled',
  },
  {
    id: 'comeback-kid',
    name: 'Comeback Kid',
    description: 'Got green after 3+ days of red on a goal',
    icon: '\uD83D\uDD04',
    hint: 'Bounce back from a rough patch on any goal',
  },
  {
    id: 'goal-setter',
    name: 'Goal Setter',
    description: 'Created 5 or more active goals',
    icon: '\uD83D\uDCAA',
    hint: 'Have at least 5 active goals',
  },
];

export function checkBadges(data: AppData): Badge[] {
  const existingBadges = data.badges || {};
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const activeGoals = data.goals.filter(g => g.active);
  const entryDates = Object.keys(data.entries).sort();

  function isEarned(badgeId: string): { earned: boolean; earnedDate?: string } {
    // If already earned, keep it
    if (existingBadges[badgeId]?.earned) {
      return { earned: true, earnedDate: existingBadges[badgeId].earnedDate };
    }

    switch (badgeId) {
      case 'first-flame': {
        for (const date of entryDates) {
          const entry = data.entries[date];
          if (entry && Object.values(entry.ratings).some(r => r !== null && r !== undefined)) {
            return { earned: true, earnedDate: date };
          }
        }
        return { earned: false };
      }

      case 'week-warrior': {
        for (const goal of data.goals) {
          if (getStreakForGoal(data, goal.id) >= 7) {
            return { earned: true, earnedDate: todayStr };
          }
        }
        return { earned: false };
      }

      case 'month-master': {
        for (const goal of data.goals) {
          if (getStreakForGoal(data, goal.id) >= 30) {
            return { earned: true, earnedDate: todayStr };
          }
        }
        return { earned: false };
      }

      case 'perfect-day': {
        // All scheduled goals must be rated, and all green
        for (const date of entryDates) {
          const entry = data.entries[date];
          if (!entry) continue;
          const dateObj = new Date(date + 'T00:00:00');
          const scheduled = activeGoals.filter(g => isGoalScheduledForDate(g, dateObj));
          if (scheduled.length === 0) continue;
          const allRated = scheduled.every(g => entry.ratings[g.id] !== null && entry.ratings[g.id] !== undefined);
          const allGreen = scheduled.every(g => entry.ratings[g.id] === 'green');
          if (allRated && allGreen) {
            return { earned: true, earnedDate: date };
          }
        }
        return { earned: false };
      }

      case 'perfect-week': {
        for (let i = 0; i <= entryDates.length - 7; i++) {
          let perfect = true;
          const startDate = new Date(entryDates[i]);
          let lastDate = entryDates[i];
          for (let d = 0; d < 7; d++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(checkDate.getDate() + d);
            const dateStr = checkDate.toISOString().split('T')[0];
            if (getDailyScore(data, dateStr) !== 100) {
              perfect = false;
              break;
            }
            lastDate = dateStr;
          }
          if (perfect && activeGoals.length > 0) {
            return { earned: true, earnedDate: lastDate };
          }
        }
        return { earned: false };
      }

      case 'early-bird': {
        for (const date of entryDates) {
          const entry = data.entries[date];
          if (!entry?.ratedAt) continue;
          const ratedHour = new Date(entry.ratedAt).getHours();
          if (ratedHour < 9 && Object.values(entry.ratings).some(r => r !== null && r !== undefined)) {
            return { earned: true, earnedDate: date };
          }
        }
        return { earned: false };
      }

      case 'consistency-king': {
        // 90%+ average score over last 30 days
        if (entryDates.length < 30) return { earned: false };
        let totalScore = 0;
        let daysChecked = 0;
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const score = getDailyScore(data, dateStr);
          if (data.entries[dateStr]) {
            totalScore += score;
            daysChecked++;
          }
        }
        if (daysChecked >= 25 && totalScore / daysChecked >= 90) {
          return { earned: true, earnedDate: todayStr };
        }
        return { earned: false };
      }

      case 'century-club': {
        const daysTracked = Object.keys(data.entries).filter(date => {
          const entry = data.entries[date];
          return entry && Object.values(entry.ratings).some(r => r !== null && r !== undefined);
        }).length;
        if (daysTracked >= 100) {
          return { earned: true, earnedDate: todayStr };
        }
        return { earned: false };
      }

      case 'all-green': {
        // All active goals green — even ones not scheduled for that day
        if (activeGoals.length === 0) return { earned: false };
        for (const date of entryDates) {
          const entry = data.entries[date];
          if (!entry) continue;
          const allGreen = activeGoals.every(g => entry.ratings[g.id] === 'green');
          if (allGreen) {
            return { earned: true, earnedDate: date };
          }
        }
        return { earned: false };
      }

      case 'comeback-kid': {
        for (const goal of data.goals) {
          const sortedDates = Object.keys(data.entries).sort();
          let redStreak = 0;
          for (const date of sortedDates) {
            const rating = data.entries[date]?.ratings[goal.id];
            if (rating === 'red') {
              redStreak++;
            } else if (rating === 'green' && redStreak >= 3) {
              return { earned: true, earnedDate: date };
            } else {
              redStreak = 0;
            }
          }
        }
        return { earned: false };
      }

      case 'goal-setter': {
        if (activeGoals.length >= 5) {
          return { earned: true, earnedDate: todayStr };
        }
        return { earned: false };
      }

      default:
        return { earned: false };
    }
  }

  return BADGE_DEFINITIONS.map(def => {
    const status = isEarned(def.id);
    return {
      ...def,
      earned: status.earned,
      earnedDate: status.earnedDate,
    };
  });
}

export function getNewlyEarnedBadges(oldData: AppData, newData: AppData): Badge[] {
  const oldBadges = checkBadges(oldData);
  const newBadges = checkBadges(newData);

  return newBadges.filter(nb => {
    const oldBadge = oldBadges.find(ob => ob.id === nb.id);
    return nb.earned && (!oldBadge || !oldBadge.earned);
  });
}
