'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, BarChart3, Timer, ClipboardCheck, Share2, Trophy, Moon, Sun, LogOut } from 'lucide-react';

interface NavigationProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut?: () => void;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/review', label: 'Review', icon: ClipboardCheck },
  { href: '/run-tracker', label: '5K', icon: Timer },
  { href: '/badges', label: 'Badges', icon: Trophy },
  { href: '/share', label: 'Share', icon: Share2 },
];

export default function Navigation({ darkMode, onToggleDarkMode, onSignOut }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-2xl">🎯</span>
            <span className="font-bold text-xl text-gray-900 dark:text-white hidden sm:inline">KPI Tracker</span>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0
                    ${isActive
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                  `}
                >
                  <Icon size={18} />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
