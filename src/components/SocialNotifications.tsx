'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, UserPlus, Heart, Check } from 'lucide-react';
import Link from 'next/link';
import { useAppData } from '@/app/providers';
import { subscribeFriendships, subscribeCheers, respondToFriendRequest } from '@/lib/social';

interface Notification {
  id: string;
  type: 'friend_request' | 'cheer';
  message: string;
  emoji?: string;
  fromName: string;
  timestamp: string;
  friendshipId?: string;
}

export default function SocialNotifications() {
  const { user } = useAppData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Load dismissed notification IDs from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('dismissed-notifications');
      if (stored) {
        try {
          setDismissed(new Set(JSON.parse(stored)));
        } catch { /* ignore */ }
      }
    }
  }, []);

  // Subscribe to friendships and cheers
  useEffect(() => {
    if (!user) return;

    const unsub1 = subscribeFriendships(user.uid, (fs) => {
      const pending = fs.filter(f => f.status === 'pending' && f.recipientUid === user.uid);
      const friendNotifs: Notification[] = pending.map(f => ({
        id: `fr-${f.id}`,
        type: 'friend_request',
        message: `wants to be your friend`,
        fromName: f.initiatorName,
        timestamp: f.createdAt,
        friendshipId: f.id,
      }));

      setNotifications(prev => {
        const cheerNotifs = prev.filter(n => n.type === 'cheer');
        return [...friendNotifs, ...cheerNotifs];
      });
    });

    const unsub2 = subscribeCheers(user.uid, (cheers) => {
      // Only show cheers from last 24 hours as notifications
      const recent = cheers.filter(c => {
        const age = Date.now() - new Date(c.createdAt).getTime();
        return age < 24 * 60 * 60 * 1000;
      });

      const cheerNotifs: Notification[] = recent.map(c => ({
        id: `cheer-${c.id}`,
        type: 'cheer',
        message: c.message || 'sent you a cheer!',
        emoji: c.emoji,
        fromName: c.fromName,
        timestamp: c.createdAt,
      }));

      setNotifications(prev => {
        const friendNotifs = prev.filter(n => n.type === 'friend_request');
        return [...friendNotifs, ...cheerNotifs];
      });
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      sessionStorage.setItem('dismissed-notifications', JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const handleAccept = useCallback(async (friendshipId: string, notifId: string) => {
    await respondToFriendRequest(friendshipId, true);
    dismiss(notifId);
  }, [dismiss]);

  const visible = notifications
    .filter(n => !dismissed.has(n.id))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 3); // Max 3 visible notifications

  if (visible.length === 0) return null;

  return (
    <div className="fixed top-14 md:top-16 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-lg mx-auto px-4 space-y-2 pt-2">
        {visible.map(notif => (
          <div
            key={notif.id}
            className="pointer-events-auto animate-fadeIn bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3"
          >
            {/* Icon */}
            {notif.type === 'friend_request' ? (
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <UserPlus size={16} className="text-blue-600 dark:text-blue-400" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center flex-shrink-0 text-lg">
                {notif.emoji || <Heart size={16} className="text-pink-500" />}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                <span className="font-semibold">{notif.fromName}</span>{' '}
                <span className="text-gray-600 dark:text-gray-400">{notif.message}</span>
              </p>
            </div>

            {/* Actions */}
            {notif.type === 'friend_request' && notif.friendshipId ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleAccept(notif.friendshipId!, notif.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Check size={12} /> Accept
                </button>
                <button
                  onClick={() => dismiss(notif.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => dismiss(notif.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {/* Link to friends page if there are more */}
        {notifications.filter(n => !dismissed.has(n.id)).length > 3 && (
          <Link
            href="/friends"
            className="pointer-events-auto block text-center text-xs text-blue-600 dark:text-blue-400 font-medium py-1 hover:underline"
          >
            View all notifications
          </Link>
        )}
      </div>
    </div>
  );
}

/** Badge dot for the navigation — shows count of pending requests + recent cheers */
export function useNotificationCount(): number {
  const { user } = useAppData();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let friendCount = 0;
    let cheerCount = 0;

    const unsub1 = subscribeFriendships(user.uid, (fs) => {
      friendCount = fs.filter(f => f.status === 'pending' && f.recipientUid === user.uid).length;
      setCount(friendCount + cheerCount);
    });

    const unsub2 = subscribeCheers(user.uid, (cheers) => {
      cheerCount = cheers.filter(c => {
        const age = Date.now() - new Date(c.createdAt).getTime();
        return age < 24 * 60 * 60 * 1000;
      }).length;
      setCount(friendCount + cheerCount);
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  return count;
}
