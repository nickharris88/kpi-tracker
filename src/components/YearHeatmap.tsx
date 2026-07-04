'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarRange } from 'lucide-react';
import { AppData } from '@/lib/types';
import { getYearHeatmap } from '@/lib/insights';

const ROW_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

function cellColor(score: number): string {
  if (score < 0) return 'transparent';
  if (score === 0) return 'var(--heatmap-empty, #e5e7eb)';
  if (score < 40) return '#fca5a5';
  if (score < 70) return '#fcd34d';
  if (score < 90) return '#6ee7b7';
  return '#10b981';
}

export default function YearHeatmap({ data }: { data: AppData }) {
  const { cells, monthLabels } = useMemo(() => getYearHeatmap(data), [data]);
  const [tooltip, setTooltip] = useState<{ date: string; score: number } | null>(null);

  const trackedDays = cells.filter(c => !c.inFuture && c.score > 0).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarRange size={18} className="text-emerald-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Your Year</h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {trackedDays} active days in the last 12 months
        </span>
      </div>

      <div className="overflow-x-auto pb-2 [--heatmap-empty:#e5e7eb] dark:[--heatmap-empty:#374151]">
        <div className="min-w-[720px]">
          {/* Month labels */}
          <div className="relative h-4 ml-8 mb-1">
            {monthLabels.map(({ weekIndex, label }, i) => (
              <span
                key={`${label}-${i}`}
                className="absolute text-[10px] text-gray-400"
                style={{ left: `${(weekIndex / 52) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[3px] w-7 flex-shrink-0">
              {ROW_LABELS.map((label, i) => (
                <div key={i} className="h-[11px] text-[9px] text-gray-400 leading-[11px]">{label}</div>
              ))}
            </div>

            {/* Grid: 52 columns of 7 */}
            <div className="flex gap-[3px] flex-1">
              {Array.from({ length: 52 }, (_, w) => (
                <div key={w} className="flex flex-col gap-[3px] flex-1">
                  {cells
                    .filter(c => c.weekIndex === w)
                    .map(c => (
                      <div
                        key={c.date}
                        className="h-[11px] w-full rounded-[2px] cursor-default"
                        style={{ backgroundColor: cellColor(c.score) }}
                        onMouseEnter={() => !c.inFuture && setTooltip({ date: c.date, score: c.score })}
                        onMouseLeave={() => setTooltip(null)}
                        title={c.inFuture ? undefined : `${format(new Date(c.date + 'T00:00:00'), 'MMM d, yyyy')}: ${c.score}%`}
                      />
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend + tooltip line */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-400 h-4">
          {tooltip && `${format(new Date(tooltip.date + 'T00:00:00'), 'EEE, MMM d')} — ${tooltip.score}%`}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <span>Less</span>
          {[0, 30, 60, 80, 100].map(s => (
            <div key={s} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: cellColor(s) }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
