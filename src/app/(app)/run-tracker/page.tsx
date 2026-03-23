'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Timer, TrendingDown, Trophy, Plus, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAppData } from '@/app/providers';

export default function RunTrackerPage() {
  const { data, setRunData } = useAppData();
  const [showAdd, setShowAdd] = useState(false);
  const [newRun, setNewRun] = useState({ date: format(new Date(), 'yyyy-MM-dd'), minutes: '', seconds: '', distance: '5' });

  const target5kTime = data.settings.target5kTime; // 1200 seconds = 20 min

  // All runs sorted by date
  const runs = useMemo(() => {
    return Object.entries(data.entries)
      .filter(([, entry]) => entry.runTime)
      .map(([date, entry]) => ({
        date,
        displayDate: format(new Date(date), 'MMM d'),
        time: entry.runTime!,
        distance: entry.runDistance || 5,
        minutes: Math.floor(entry.runTime! / 60),
        seconds: entry.runTime! % 60,
        pace: entry.runTime! / (entry.runDistance || 5), // sec per km
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data.entries]);

  const handleAddRun = () => {
    const mins = parseInt(newRun.minutes) || 0;
    const secs = parseInt(newRun.seconds) || 0;
    const totalSeconds = mins * 60 + secs;
    const distance = parseFloat(newRun.distance) || 5;
    if (totalSeconds <= 0) return;

    setRunData(newRun.date, totalSeconds, distance);
    setNewRun({ date: format(new Date(), 'yyyy-MM-dd'), minutes: '', seconds: '', distance: '5' });
    setShowAdd(false);
  };

  const bestRun = runs.length > 0 ? runs.reduce((best, r) => r.time < best.time ? r : best) : null;
  const latestRun = runs.length > 0 ? runs[runs.length - 1] : null;
  const improvement = runs.length >= 2
    ? runs[0].time - runs[runs.length - 1].time
    : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressToTarget = latestRun
    ? Math.min(100, Math.round(((runs[0]?.time || latestRun.time) - target5kTime) === 0 ? 100 :
      ((runs[0]?.time || latestRun.time) - latestRun.time) / ((runs[0]?.time || latestRun.time) - target5kTime) * 100))
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">5K Run Tracker</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Target: {formatTime(target5kTime)} for 5K
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Log Run
        </button>
      </div>

      {/* Add Run Form */}
      {showAdd && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Log a Run</h3>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
              <input
                type="date"
                value={newRun.date}
                onChange={e => setNewRun({ ...newRun, date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minutes</label>
              <input
                type="number"
                value={newRun.minutes}
                onChange={e => setNewRun({ ...newRun, minutes: e.target.value })}
                placeholder="25"
                min="0"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seconds</label>
              <input
                type="number"
                value={newRun.seconds}
                onChange={e => setNewRun({ ...newRun, seconds: e.target.value })}
                placeholder="30"
                min="0"
                max="59"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Distance (km)</label>
              <input
                type="number"
                value={newRun.distance}
                onChange={e => setNewRun({ ...newRun, distance: e.target.value })}
                placeholder="5"
                step="0.1"
                min="0"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm">
              Cancel
            </button>
            <button onClick={handleAddRun} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
              Save Run
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-3">
            <Timer size={20} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Latest Time</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {latestRun ? formatTime(latestRun.time) : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 mb-3">
            <Trophy size={20} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Personal Best</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {bestRun ? formatTime(bestRun.time) : '—'}
          </p>
          {bestRun && <p className="text-xs text-gray-400 mt-1">{format(new Date(bestRun.date), 'MMM d')}</p>}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 mb-3">
            <TrendingDown size={20} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Improvement</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {improvement > 0 ? `-${formatTime(improvement)}` : '—'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 mb-3">
            <Target size={20} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Runs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{runs.length}</p>
        </div>
      </div>

      {/* Target Progress */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-emerald-100 text-sm font-medium">Progress to 20:00 Target</p>
            <p className="text-3xl font-bold">
              {latestRun ? formatTime(latestRun.time) : '—'} → {formatTime(target5kTime)}
            </p>
          </div>
          <div className="text-5xl">🏃</div>
        </div>
        <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, progressToTarget))}%` }}
          />
        </div>
        <p className="text-emerald-100 text-sm mt-2">
          {latestRun && latestRun.time <= target5kTime
            ? 'Target achieved! Keep pushing! 🎉'
            : latestRun
            ? `${formatTime(latestRun.time - target5kTime)} to go`
            : 'Log your first run to start tracking'}
        </p>
      </div>

      {/* Run Time Chart */}
      {runs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Run Times Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={runs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                tickFormatter={(v) => formatTime(v)}
                domain={['dataMin - 60', 'dataMax + 60']}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                formatter={(value) => [formatTime(value as number), 'Time']}
              />
              <ReferenceLine y={target5kTime} stroke="#10B981" strokeDasharray="5 5" label={{ value: 'Target', fill: '#10B981', fontSize: 12 }} />
              <Line type="monotone" dataKey="time" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Run History */}
      {runs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Run History</h3>
          <div className="space-y-2">
            {[...runs].reverse().map((run) => (
              <div key={run.date} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏃</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{format(new Date(run.date), 'EEEE, MMM d, yyyy')}</p>
                    <p className="text-sm text-gray-500">{run.distance}km</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${run.time <= target5kTime ? 'text-emerald-500' : 'text-gray-900 dark:text-white'}`}>
                    {formatTime(run.time)}
                  </p>
                  <p className="text-sm text-gray-500">{formatTime(Math.round(run.pace))}/km</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {runs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Timer size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No runs logged yet</p>
          <p className="text-sm">Click &quot;Log Run&quot; to start tracking your 5K progress</p>
        </div>
      )}
    </div>
  );
}
