'use client';

import { ReactNode } from 'react';
import { AppProvider, useAppData } from './providers';
import Navigation from '@/components/Navigation';
import OfflineBanner from '@/components/OfflineBanner';

function LayoutInner({ children }: { children: ReactNode }) {
  const { data, toggleDarkMode } = useAppData();

  return (
    <div className={data.settings.darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
        <Navigation darkMode={data.settings.darkMode} onToggleDarkMode={toggleDarkMode} />
        <main className="px-4 py-6">
          {children}
        </main>
        <OfflineBanner />
      </div>
    </div>
  );
}

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <LayoutInner>{children}</LayoutInner>
    </AppProvider>
  );
}
