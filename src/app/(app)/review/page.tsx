'use client';

import { useState, useMemo } from 'react';
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, addWeeks,
  subMonths, addMonths, eachDayOfInterval, getDay, isAfter,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, Minus,
  Award, AlertTriangle, Flame, BarChart3, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts';
import { Goal, DailyEntry, CATEGORY_COLORS, CATEGORY_LABELS, RAGStatus } from '@/lib/types';
import { getDailyScore, getStreakForGoal } from '@/lib/storage';
import { useAppData } from '@/app/providers';

type ViewMode = 'weekly' | 'monthly';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface DayScore {
  date: string;
  dayName: string;
  fullDayName: string;
  score: number;
  entry: DailyEntry | undefined;
}

interface GoalPerf {
  goal: Goal;
  green: number;
  amber: number;
  red: number;
  unrated: number;
  streak: number;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  dailyScores: DayScore[];
  avgScore: number;
  bestDay: DayScore;
  worstDay: DayScore | null;
  goalPerformance: GoalPerf[];
  missedGoals: GoalPerf[];
  prevAvg: number;
  weekChange: number;
}

interface MonthDayScore {
  date: string;
  label: string;
  score: number;
  dayOfWeek: number;
  entry: DailyEntry | undefined;
}

interface WeekSummary {
  weekLabel: string;
  avgScore: number;
}

interface GoalRate {
  goal: Goal;
  rate: number;
  green: number;
  total: number;
}

interface CategoryBreakdownItem {
  category: string;
  label: string;
  color: string;
  rate: number;
}

interface DayAverage {
  day: string;
  avg: number;
  count: number;
}

interface MonthData {
  monthStart: Date;
  monthEnd: Date;
  dailyScores: MonthDayScore[];
  trendData: { date: string; score: number }[];
  weeks: WeekSummary[];
  bestWeek: WeekSummary | null;
  goalRates: GoalRate[];
  categoryBreakdown: CategoryBreakdownItem[];
  dayAverages: DayAverage[];
  worstDow: DayAverage | undefined;
  bestDow: DayAverage | undefined;
  currentAvg: number;
  prevAvg: number;
  monthChange: number;
}

export default function ReviewPage() {
  const { data } = useAppData();
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const activeGoals = data.goals.filter(g => g.active);

  // --- WEEKLY CALCULATIONS ---
  const weekData = useMemo((): WeekData => {
    const actualRef = weekOffset <= 0 ? subWeeks(new Date(), Math.abs(weekOffset)) : addWeeks(new Date(), weekOffset);
    const weekStart = startOfWeek(actualRef, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(actualRef, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const dailyScores: DayScore[] = days.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        date: dateStr,
        dayName: format(d, 'EEE'),
        fullDayName: format(d, 'EEEE'),
        score: getDailyScore(data, dateStr),
        entry: data.entries[dateStr],
      };
    });

    const activeDays = dailyScores.filter(d => d.score > 0);
    const avgScore = activeDays.length > 0
      ? Math.round(activeDays.reduce((s, d) => s + d.score, 0) / activeDays.length)
      : 0;

    const bestDay = dailyScores.reduce((best, d) => d.score > best.score ? d : best, dailyScores[0]);
    const worstDay = activeDays.length > 0
      ? activeDays.reduce((worst, d) => d.score < worst.score ? d : worst, activeDays[0])
      : null;

    const goalPerformance: GoalPerf[] = activeGoals.map(goal => {
      let green = 0, amber = 0, red = 0, unrated = 0;
      for (const d of dailyScores) {
        const rating = d.entry?.ratings[goal.id];
        if (rating === 'green') green++;
        else if (rating === 'amber') amber++;
        else if (rating === 'red') red++;
        else unrated++;
      }
      return { goal, green, amber, red, unrated, streak: getStreakForGoal(data, goal.id) };
    });

    const missedGoals = goalPerformance.filter(gp => (gp.red + gp.unrated) >= 5);

    const prevWeekStart = subWeeks(weekStart, 1);
    const prevWeekEnd = subWeeks(weekEnd, 1);
    const prevDays = eachDayOfInterval({ start: prevWeekStart, end: prevWeekEnd });
    const prevScores = prevDays.map(d => getDailyScore(data, format(d, 'yyyy-MM-dd')));
    const prevActive = prevScores.filter(s => s > 0);
    const prevAvg = prevActive.length > 0
      ? Math.round(prevActive.reduce((s, v) => s + v, 0) / prevActive.length)
      : 0;
    const weekChange = avgScore - prevAvg;

    return {
      weekStart, weekEnd, dailyScores, avgScore, bestDay, worstDay,
      goalPerformance, missedGoals, prevAvg, weekChange,
    };
  }, [data, weekOffset, activeGoals]);

  // --- MONTHLY CALCULATIONS ---
  const monthData = useMemo((): MonthData => {
    const actualRef = monthOffset <= 0 ? subMonths(new Date(), Math.abs(monthOffset)) : addMonths(new Date(), monthOffset);
    const monthStart = startOfMonth(actualRef);
    const monthEnd = endOfMonth(actualRef);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(d => !isAfter(d, new Date()));

    const dailyScores: MonthDayScore[] = days.map(d => {
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        date: dateStr,
        label: format(d, 'MMM d'),
        score: getDailyScore(data, dateStr),
        dayOfWeek: getDay(d),
        entry: data.entries[dateStr],
      };
    });

    const trendData = dailyScores.map(d => ({
      date: format(new Date(d.date), 'd'),
      score: d.score,
    }));

    const weeks: WeekSummary[] = [];
    let weekDays: MonthDayScore[] = [];
    for (let i = 0; i < dailyScores.length; i++) {
      weekDays.push(dailyScores[i]);
      const isEndOfWeek = getDay(new Date(dailyScores[i].date)) === 0;
      const isLast = i === dailyScores.length - 1;
      if (isEndOfWeek || isLast) {
        const active = weekDays.filter(d => d.score > 0);
        const avg = active.length > 0
          ? Math.round(active.reduce((s, d) => s + d.score, 0) / active.length)
          : 0;
        weeks.push({
          weekLabel: `${format(new Date(weekDays[0].date), 'MMM d')} - ${format(new Date(weekDays[weekDays.length - 1].date), 'MMM d')}`,
          avgScore: avg,
        });
        weekDays = [];
      }
    }

    const bestWeek = weeks.length > 0 ? weeks.reduce((best, w) => w.avgScore > best.avgScore ? w : best, weeks[0]) : null;

    const goalRates: GoalRate[] = activeGoals.map(goal => {
      let green = 0, total = 0;
      for (const d of dailyScores) {
        const rating = d.entry?.ratings[goal.id];
        if (rating) {
          total++;
          if (rating === 'green') green++;
        }
      }
      const rate = total === 0 ? 0 : Math.round((green / total) * 100);
      return { goal, rate, green, total };
    }).sort((a, b) => b.rate - a.rate);

    const categories = Array.from(new Set(activeGoals.map(g => g.category)));
    const categoryBreakdown: CategoryBreakdownItem[] = categories.map(cat => {
      const catGoals = activeGoals.filter(g => g.category === cat);
      let green = 0, total = 0;
      for (const g of catGoals) {
        for (const d of dailyScores) {
          const rating = d.entry?.ratings[g.id];
          if (rating) {
            total++;
            if (rating === 'green') green++;
          }
        }
      }
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        color: CATEGORY_COLORS[cat],
        rate: total === 0 ? 0 : Math.round((green / total) * 100),
      };
    }).sort((a, b) => b.rate - a.rate);

    const dayAverages: DayAverage[] = Array.from({ length: 7 }, (_, dow) => {
      const dayEntries = dailyScores.filter(d => d.dayOfWeek === dow && d.score > 0);
      const avg = dayEntries.length > 0
        ? Math.round(dayEntries.reduce((s, d) => s + d.score, 0) / dayEntries.length)
        : 0;
      return { day: DAY_NAMES[dow], avg, count: dayEntries.length };
    });
    const worstDow = dayAverages.filter(d => d.count > 0).sort((a, b) => a.avg - b.avg)[0];
    const bestDow = dayAverages.filter(d => d.count > 0).sort((a, b) => b.avg - a.avg)[0];

    const prevMonthStart = startOfMonth(subMonths(actualRef, 1));
    const prevMonthEnd = endOfMonth(subMonths(actualRef, 1));
    const prevDays = eachDayOfInterval({ start: prevMonthStart, end: prevMonthEnd }).filter(d => !isAfter(d, new Date()));
    const prevScores = prevDays.map(d => getDailyScore(data, format(d, 'yyyy-MM-dd')));
    const prevActive = prevScores.filter(s => s > 0);
    const prevAvg = prevActive.length > 0
      ? Math.round(prevActive.reduce((s, v) => s + v, 0) / prevActive.length)
      : 0;
    const activeDays = dailyScores.filter(d => d.score > 0);
    const currentAvg = activeDays.length > 0
      ? Math.round(activeDays.reduce((s, d) => s + d.score, 0) / activeDays.length)
      : 0;
    const monthChange = currentAvg - prevAvg;

    return {
      monthStart, monthEnd, dailyScores, trendData, weeks, bestWeek,
      goalRates, categoryBreakdown, dayAverages, worstDow, bestDow,
      currentAvg, prevAvg, monthChange,
    };
  }, [data, monthOffset, activeGoals]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Reflect on your performance and find patterns</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['weekly', 'monthly'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {mode === 'weekly' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'weekly' ? (
        <WeeklyReview
          weekData={weekData}
          onPrev={() => setWeekOffset(o => o - 1)}
          onNext={() => setWeekOffset(o => o + 1)}
          canGoNext={weekOffset < 0}
        />
      ) : (
        <MonthlyReview
          monthData={monthData}
          onPrev={() => setMonthOffset(o => o - 1)}
          onNext={() => setMonthOffset(o => o + 1)}
          canGoNext={monthOffset < 0}
        />
      )}
    </div>
  );
}

// ---- WEEKLY REVIEW ----

function WeeklyReview({
  weekData: wd, onPrev, onNext, canGoNext,
}: {
  weekData: WeekData;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
          <Calendar size={18} />
          <span>{format(wd.weekStart, 'MMM d')} - {format(wd.weekEnd, 'MMM d, yyyy')}</span>
        </div>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-2 rounded-lg transition-colors ${
            canGoNext
              ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-blue-100 text-sm font-medium">Weekly Score</p>
            <p className="text-5xl font-bold mt-1">{wd.avgScore}%</p>
            <div className="flex items-center gap-2 mt-2">
              {wd.weekChange > 0 ? (
                <span className="flex items-center gap-1 text-emerald-200 text-sm">
                  <ArrowUpRight size={16} /> +{wd.weekChange}% vs last week
                </span>
              ) : wd.weekChange < 0 ? (
                <span className="flex items-center gap-1 text-red-200 text-sm">
                  <ArrowDownRight size={16} /> {wd.weekChange}% vs last week
                </span>
              ) : (
                <span className="flex items-center gap-1 text-blue-200 text-sm">
                  <Minus size={16} /> Same as last week
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4 text-center">
            {wd.bestDay?.score > 0 && (
              <div className="bg-white/20 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-blue-100">Best Day</p>
                <p className="text-lg font-bold">{wd.bestDay.fullDayName}</p>
                <p className="text-sm text-blue-100">{wd.bestDay.score}%</p>
              </div>
            )}
            {wd.worstDay && (
              <div className="bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                <p className="text-xs text-blue-100">Worst Day</p>
                <p className="text-lg font-bold">{wd.worstDay.fullDayName}</p>
                <p className="text-sm text-blue-100">{wd.worstDay.score}%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Breakdown Bar Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={wd.dailyScores}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="dayName" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => [`${value}%`, 'Score']}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {wd.dailyScores.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.score >= 80 ? '#10B981' : entry.score >= 50 ? '#F59E0B' : entry.score > 0 ? '#EF4444' : '#374151'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Goal Performance Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Goal Performance</h3>
        <div className="space-y-3">
          {wd.goalPerformance.map((gp) => (
            <div key={gp.goal.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-xl shrink-0">{gp.goal.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{gp.goal.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }, (_, i) => {
                      const dayEntry = wd.dailyScores[i]?.entry;
                      const rating: RAGStatus = dayEntry?.ratings[gp.goal.id] ?? null;
                      return (
                        <div
                          key={i}
                          className={`w-5 h-5 rounded-sm text-[10px] flex items-center justify-center font-medium ${
                            rating === 'green'
                              ? 'bg-emerald-500 text-white'
                              : rating === 'amber'
                              ? 'bg-amber-400 text-white'
                              : rating === 'red'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500'
                          }`}
                          title={`${wd.dailyScores[i]?.fullDayName}: ${rating || 'not rated'}`}
                        >
                          {wd.dailyScores[i]?.dayName?.[0]}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {gp.green}G {gp.amber}A {gp.red}R
                  </span>
                </div>
              </div>
              {gp.streak > 0 && (
                <div className="flex items-center gap-1 text-amber-500 shrink-0">
                  <Flame size={14} />
                  <span className="text-xs font-semibold">{gp.streak}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Streaks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Flame size={18} className="text-amber-500" /> Current Streaks
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...wd.goalPerformance]
            .sort((a, b) => b.streak - a.streak)
            .map((gp) => (
              <div
                key={gp.goal.id}
                className={`p-3 rounded-lg text-center ${
                  gp.streak > 0
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <span className="text-xl">{gp.goal.icon}</span>
                <p className={`text-2xl font-bold mt-1 ${
                  gp.streak > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-300 dark:text-gray-600'
                }`}>
                  {gp.streak}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{gp.goal.name}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Consistently Missed */}
      {wd.missedGoals.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <h3 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} /> Goals You Consistently Missed
          </h3>
          <div className="space-y-2">
            {wd.missedGoals.map((gp) => (
              <div key={gp.goal.id} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <span>{gp.goal.icon}</span>
                <span className="font-medium">{gp.goal.name}</span>
                <span className="text-red-400 dark:text-red-500">
                  - missed or unrated {gp.red + gp.unrated} of 7 days
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- MONTHLY REVIEW ----

function MonthlyReview({
  monthData: md, onPrev, onNext, canGoNext,
}: {
  monthData: MonthData;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
          <Calendar size={18} />
          <span>{format(md.monthStart, 'MMMM yyyy')}</span>
        </div>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-2 rounded-lg transition-colors ${
            canGoNext
              ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-purple-100 text-sm font-medium">Monthly Average</p>
            <p className="text-5xl font-bold mt-1">{md.currentAvg}%</p>
            <div className="flex items-center gap-2 mt-2">
              {md.monthChange > 0 ? (
                <span className="flex items-center gap-1 text-emerald-200 text-sm">
                  <ArrowUpRight size={16} /> +{md.monthChange}% vs last month
                </span>
              ) : md.monthChange < 0 ? (
                <span className="flex items-center gap-1 text-red-200 text-sm">
                  <ArrowDownRight size={16} /> {md.monthChange}% vs last month
                </span>
              ) : (
                <span className="flex items-center gap-1 text-purple-200 text-sm">
                  <Minus size={16} /> Same as last month
                </span>
              )}
            </div>
          </div>
          {md.bestWeek && (
            <div className="bg-white/20 rounded-xl px-4 py-3 backdrop-blur-sm text-center">
              <p className="text-xs text-purple-100">Best Week</p>
              <p className="text-lg font-bold">{md.bestWeek.avgScore}%</p>
              <p className="text-xs text-purple-100">{md.bestWeek.weekLabel}</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Score Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Score Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={md.trendData}>
            <defs>
              <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => [`${value}%`, 'Score']}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#monthlyGradient)"
              dot={{ fill: '#8B5CF6', r: 2 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Goal Completion Rates Ranked */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award size={18} className="text-amber-500" /> Goal Completion Rates
        </h3>
        <div className="space-y-3">
          {md.goalRates.map((gr, idx) => (
            <div key={gr.goal.id} className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6 text-right">
                {idx + 1}
              </span>
              <span className="text-lg shrink-0">{gr.goal.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{gr.goal.name}</span>
                  <span className={`text-sm font-bold shrink-0 ml-2 ${
                    gr.rate >= 80 ? 'text-emerald-500' : gr.rate >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {gr.rate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      gr.rate >= 80 ? 'bg-emerald-500' : gr.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${gr.rate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-500" /> Category Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {md.categoryBreakdown.map((cb) => (
            <div
              key={cb.category}
              className="p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700"
              style={{ borderLeftColor: cb.color, borderLeftWidth: '4px' }}
            >
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{cb.label}</p>
              <p className={`text-2xl font-bold mt-1 ${
                cb.rate >= 80 ? 'text-emerald-600 dark:text-emerald-400'
                  : cb.rate >= 50 ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {cb.rate}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Day-of-Week Patterns */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Day-of-Week Patterns</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={md.dayAverages}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickFormatter={(v: string) => v.slice(0, 3)} />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
              formatter={(value) => [`${value}%`, 'Avg Score']}
            />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {md.dayAverages.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.avg >= 80 ? '#10B981' : entry.avg >= 50 ? '#F59E0B' : entry.avg > 0 ? '#EF4444' : '#374151'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {md.worstDow && md.bestDow && md.worstDow.day !== md.bestDow.day && (
          <div className="mt-4 space-y-2">
            {md.worstDow.avg < md.bestDow.avg && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                <TrendingDown size={16} />
                <span>You tend to score lower on <strong>{md.worstDow.day}s</strong> (avg {md.worstDow.avg}%)</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
              <TrendingUp size={16} />
              <span>Your strongest day is <strong>{md.bestDow.day}</strong> (avg {md.bestDow.avg}%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Averages This Month */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Weekly Averages This Month</h3>
        <div className="space-y-2">
          {md.weeks.map((w, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-32 shrink-0 truncate">{w.weekLabel}</span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    w.avgScore >= 80 ? 'bg-emerald-500' : w.avgScore >= 50 ? 'bg-amber-500' : w.avgScore > 0 ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${w.avgScore}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">{w.avgScore}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
