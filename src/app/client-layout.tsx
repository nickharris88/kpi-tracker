'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { AppProvider, useAppData } from './providers';
import Navigation from '@/components/Navigation';
import OfflineBanner from '@/components/OfflineBanner';

function LayoutInner({ children }: { children: ReactNode }) {
  const { data, toggleDarkMode, signOut, user } = useAppData();

  return (
    <div className={data.settings.darkMode ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors">
        <Navigation
          darkMode={data.settings.darkMode}
          onToggleDarkMode={toggleDarkMode}
          onSignOut={user ? signOut : undefined}
          showAccount={!!user}
        />
        <main className="flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-gray-200 dark:border-gray-800 py-4 px-4 text-center">
          <Link
            href="/privacy"
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Privacy Policy
          </Link>
        </footer>
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
