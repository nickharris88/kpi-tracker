'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, BarChart3, Timer, ClipboardCheck, Share2, Trophy, Moon, Sun, LogOut, UserCircle, Users, MoreHorizontal, X } from 'lucide-react';
import { useNotificationCount } from './SocialNotifications';

interface NavigationProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSignOut?: () => void;
  showAccount?: boolean;
}

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/review', label: 'Review', icon: ClipboardCheck },
  { href: '/run-tracker', label: 'Run', icon: Timer },
  { href: '/badges', label: 'Badges', icon: Trophy },
  { href: '/share', label: 'Share', icon: Share2 },
];

// Bottom tab bar shows first 4 items + "More" on mobile
const MOBILE_TAB_COUNT = 4;

export default function Navigation({ darkMode, onToggleDarkMode, onSignOut, showAccount }: NavigationProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const notifCount = useNotificationCount();

  const mobileItems = navItems.slice(0, MOBILE_TAB_COUNT);
  const moreItems = navItems.slice(MOBILE_TAB_COUNT);
  const isMoreActive = moreItems.some(item => pathname === item.href);

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:block bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl">🎯</span>
              <span className="font-bold text-xl text-gray-900 dark:text-white">KPI Tracker</span>
            </div>

            <div className="flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                const showBadge = href === '/friends' && notifCount > 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                    `}
                  >
                    <Icon size={18} />
                    <span className="hidden lg:inline">{label}</span>
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {notifCount > 9 ? '9+' : notifCount}
                      </span>
                    )}
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
              {showAccount && (
                <Link
                  href="/account"
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Account settings"
                  title="Account"
                >
                  <UserCircle size={18} />
                </Link>
              )}
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

      {/* Mobile top bar - minimal branding + settings */}
      <nav className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">KPI Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {showAccount && (
              <Link
                href="/account"
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Account settings"
              >
                <UserCircle size={18} />
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
        <div className="flex items-stretch">
          {mobileItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            const showBadge = href === '/friends' && notifCount > 0;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{label}</span>
                {showBadge && (
                  <span className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              isMoreActive || moreOpen
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {moreOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>

        {/* More menu flyout */}
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div className="absolute bottom-full left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg rounded-t-2xl">
              <div className="grid grid-cols-4 gap-1 p-4">
                {moreItems.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon size={22} />
                      <span className="text-xs font-medium">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Spacer for bottom tab bar on mobile */}
      <div className="md:hidden h-16" />
    </>
  );
}
