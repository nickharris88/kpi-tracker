'use client';

import { useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { BarChart3, TrendingUp, Calendar, Target, ArrowUpRight, ArrowDownRight, Minus, Activity, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types';
import {
  getDailyScore, getCompletionRate, getConsistencyRate, getWeekOverWeekChange,
  getGoalScoresOverTime, getCategoryScoresOverTime,
} from '@/lib/storage';
import { useAppData } from '../providers';

type TimeRange = '7d' | '30d' | '90d';

export default function AnalyticsPage() {
  const { data } = useAppData();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const activeGoals = data.goals.filter(g => g.active);

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

  // Daily scores over time
  const dailyScores = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = subDays(new Date(), days - 1 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        date: format(d, timeRange === '7d' ? 'EEE' : 'MMM d'),
        score: getDailyScore(data, dateStr),
        fullDate: dateStr,
      };
    });
  }, [data, days, timeRange]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categories = Array.from(new Set(activeGoals.map(g => g.category)));
    return categories.map(cat => {
      const goals = activeGoals.filter(g => g.category === cat);
      const avgRate = goals.reduce((sum, g) => sum + getCompletionRate(data, g.id, days), 0) / goals.length;
      return {
        name: CATEGORY_LABELS[cat],
        value: Math.round(avgRate),
        color: CATEGORY_COLORS[cat],
        category: cat,
      };
    });
  }, [data, activeGoals, days]);

  // Goal completion rates
  const goalRates = useMemo(() => {
    return activeGoals.map(g => ({
      id: g.id,
      name: `${g.icon} ${g.name}`,
      rate: getCompletionRate(data, g.id, days),
      category: g.category,
    })).sort((a, b) => b.rate - a.rate);
  }, [data, activeGoals, days]);

  // Heatmap data
  const heatmapData = useMemo(() => {
    return Array.from({ length: Math.min(days, 90) }, (_, i) => {
      const d = subDays(new Date(), Math.min(days, 90) - 1 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        date: dateStr,
        display: format(d, 'MMM d'),
        score: getDailyScore(data, dateStr),
        dayOfWeek: d.getDay(),
        week: Math.floor(i / 7),
      };
    });
  }, [data, days]);

  // Week-over-week
  const wow = useMemo(() => getWeekOverWeekChange(data), [data]);

  // Consistency
  const consistency = useMemo(() => getConsistencyRate(data, days), [data, days]);

  // Category trend lines
  const categoryTrends = useMemo(() => {
    const categories = Array.from(new Set(activeGoals.map(g => g.category)));
    const trendData: Record<string, string | number>[] = [];
    const trendDays = Math.min(days, 30); // limit trend to 30 data points for readability

    const scoresByCategory: Record<string, { date: string; score: number }[]> = {};
    for (const cat of categories) {
      scoresByCategory[cat] = getCategoryScoresOverTime(data, cat, trendDays);
    }

    for (let i = 0; i < trendDays; i++) {
      const d = subDays(new Date(), trendDays - 1 - i);
      const point: Record<string, number | string> = { date: format(d, 'MMM d') };
      for (const cat of categories) {
        point[cat] = scoresByCategory[cat]?.[i]?.score ?? 0;
      }
      trendData.push(point);
    }
    return { data: trendData, categories };
  }, [data, activeGoals, days]);

  // Goal deep-dive data
  const selectedGoal = activeGoals.find(g => g.id === selectedGoalId);
  const goalTrend = useMemo(() => {
    if (!selectedGoalId) return [];
    return getGoalScoresOverTime(data, selectedGoalId, days)
      .map((d, i) => ({
        date: format(subDays(new Date(), days - 1 - i), timeRange === '7d' ? 'EEE' : 'MMM d'),
        value: d.value === -1 ? null : d.value,
        status: d.value === 100 ? 'green' : d.value === 50 ? 'amber' : d.value === 0 ? 'red' : 'none',
      }));
  }, [data, selectedGoalId, days, timeRange]);

  const avgScore = dailyScores.reduce((a, b) => a + b.score, 0) / days;
  const bestDay = dailyScores.reduce((best, d) => d.score > best.score ? d : best, dailyScores[0]);
  const daysActive = dailyScores.filter(d => d.score > 0).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Track your progress over time</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['7d', '30d', '90d'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<BarChart3 size={20} />}
          label="Avg Score"
          value={`${Math.round(avgScore)}%`}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Best Day"
          value={bestDay?.score > 0 ? `${bestDay.score}%` : '\u2014'}
          subtitle={bestDay?.score > 0 ? bestDay.date : undefined}
          color="emerald"
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Days Active"
          value={`${daysActive}/${days}`}
          color="purple"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Consistency"
          value={`${consistency}%`}
          subtitle="Days you tracked"
          color="amber"
        />
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-3">
            <Zap size={20} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Week vs Last</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{wow.current}%</p>
            <span className={`flex items-center text-sm font-medium ${
              wow.change > 0 ? 'text-emerald-500' : wow.change < 0 ? 'text-red-500' : 'text-gray-400'
            }`}>
              {wow.change > 0 ? <ArrowUpRight size={16} /> : wow.change < 0 ? <ArrowDownRight size={16} /> : <Minus size={16} />}
              {Math.abs(wow.change)}%
            </span>
          </div>
        </div>
      </div>

      {/* Daily Score Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Score Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyScores}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#9CA3AF' }}
              interval={timeRange === '7d' ? 0 : timeRange === '30d' ? 4 : 13}
            />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              dot={{ fill: '#3B82F6', r: timeRange === '7d' ? 4 : 2 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Category Trends Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={categoryTrends.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} interval={Math.max(0, Math.floor(categoryTrends.data.length / 8))} />
            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
            />
            {categoryTrends.categories.map(cat => (
              <Line
                key={cat}
                type="monotone"
                dataKey={cat}
                name={CATEGORY_LABELS[cat]}
                stroke={CATEGORY_COLORS[cat]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-3">
          {categoryTrends.categories.map(cat => (
            <div key={cat} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
              {CATEGORY_LABELS[cat]}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Goal Completion Rates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Goal Completion Rates</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalRates} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis
                dataKey="name"
                type="category"
                width={140}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Bar
                dataKey="rate"
                radius={[0, 4, 4, 0]}
                fill="#3B82F6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goal Deep Dive */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Goal Deep Dive</h3>
          <select
            value={selectedGoalId || ''}
            onChange={e => setSelectedGoalId(e.target.value || null)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          >
            <option value="">Select a goal...</option>
            {activeGoals.map(g => (
              <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
            ))}
          </select>
        </div>

        {selectedGoal && goalTrend.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {goalTrend.filter(d => d.status === 'green').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Days Achieved</p>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {goalTrend.filter(d => d.status === 'amber').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Partial Days</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {goalTrend.filter(d => d.status === 'red').length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Missed Days</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={goalTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={timeRange === '7d' ? 0 : timeRange === '30d' ? 4 : 13} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {goalTrend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.status === 'green' ? '#10B981' : entry.status === 'amber' ? '#F59E0B' : entry.status === 'red' ? '#EF4444' : '#374151'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Target size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a goal above to see detailed trends</p>
          </div>
        )}
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity Heatmap</h3>
        <div className="flex flex-wrap gap-1">
          {heatmapData.map(({ date, score, display }) => (
            <div
              key={date}
              className={`w-4 h-4 rounded-sm transition-colors ${
                score >= 80
                  ? 'bg-emerald-500'
                  : score >= 50
                  ? 'bg-amber-400'
                  : score > 0
                  ? 'bg-red-400'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
              title={`${display}: ${score}%`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700" />
          <div className="w-3 h-3 rounded-sm bg-red-400" />
          <div className="w-3 h-3 rounded-sm bg-amber-400" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
