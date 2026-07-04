'use client';

import DailyTracker from '@/components/DailyTracker';
import StreakSidebar from '@/components/StreakSidebar';
import { RAGLegend } from '@/components/RAGSmiley';
import { useAppData } from '@/app/providers';

export default function DashboardPage() {
  const { data, setGoalRating, setDayRatings, setDayNotes } = useAppData();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.profile?.name ? `Hey ${data.profile.name}` : 'Daily Dashboard'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Track your goals and rate your day</p>
        </div>
        <RAGLegend />
      </div>

      {/* Mobile: condensed week + streaks above tracker */}
      <div className="lg:hidden mb-6">
        <StreakSidebar data={data} compact />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <DailyTracker
          data={data}
          onRatingChange={setGoalRating}
          onBatchRatingChange={setDayRatings}
          onNotesChange={setDayNotes}
        />
        <div className="hidden lg:block">
          <StreakSidebar data={data} />
        </div>
      </div>
    </div>
  );
}
