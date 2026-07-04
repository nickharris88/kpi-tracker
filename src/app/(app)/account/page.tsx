'use client';

import { useState } from 'react';
import { UserCircle, Trash2, LogOut, ShieldCheck, Bell } from 'lucide-react';
import { useAppData } from '@/app/providers';
import { enableReminders, updateReminderTime, disableReminders, isPushSupported } from '@/lib/notifications';
import Link from 'next/link';

export default function AccountPage() {
  const { user, data, signOut, deleteAccount, updateSettings } = useAppData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderBusy, setReminderBusy] = useState(false);

  const remindersEnabled = data.settings.remindersEnabled || false;
  const reminderTime = data.settings.reminderTime || '20:00';

  const handleToggleReminders = async () => {
    if (!user) return;
    setReminderBusy(true);
    setReminderError(null);
    if (remindersEnabled) {
      await disableReminders(user.uid);
      updateSettings({ remindersEnabled: false });
    } else {
      const err = await enableReminders(user.uid, reminderTime);
      if (err) {
        setReminderError(err);
      } else {
        updateSettings({ remindersEnabled: true, reminderTime });
      }
    }
    setReminderBusy(false);
  };

  const handleReminderTimeChange = async (time: string) => {
    updateSettings({ reminderTime: time });
    if (user && remindersEnabled) {
      await updateReminderTime(user.uid, time);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount();
    } catch {
      setError('Could not delete account. If you signed in a while ago, please sign out and sign in again before deleting.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserCircle size={24} />
          Account
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your account and data</p>
      </div>

      {/* Profile info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">Profile</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><span className="font-medium text-gray-900 dark:text-white">Name:</span> {data.profile.name || '—'}</p>
          {user?.email && <p><span className="font-medium text-gray-900 dark:text-white">Email:</span> {user.email}</p>}
          <p><span className="font-medium text-gray-900 dark:text-white">Days tracked:</span> {Object.keys(data.entries).length}</p>
          <p><span className="font-medium text-gray-900 dark:text-white">Active goals:</span> {data.goals.filter(g => g.active).length}</p>
        </div>
      </div>

      {/* Daily Reminder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-blue-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Daily Reminder</h2>
          </div>
          <button
            onClick={handleToggleReminders}
            disabled={reminderBusy}
            role="switch"
            aria-checked={remindersEnabled}
            className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
              remindersEnabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                remindersEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Get a push notification each day so logging becomes automatic. Works best when the app
          is installed to your home screen.
        </p>
        {remindersEnabled && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Remind me at</label>
            <input
              type="time"
              value={reminderTime}
              onChange={e => handleReminderTimeChange(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
        )}
        {reminderError && <p className="text-sm text-red-500">{reminderError}</p>}
        {!isPushSupported() && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Push isn&apos;t available here — this needs a browser with notification support and the
            app&apos;s push key configured.
          </p>
        )}
      </div>

      {/* Privacy */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Privacy</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Your data is stored securely and never shared with third parties. You can export or delete your data at any time.
        </p>
        <Link
          href="/privacy"
          className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View Privacy Policy →
        </Link>
      </div>

      {/* Sign out */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Sign Out</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your data will remain saved and sync when you sign back in.</p>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Delete account */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-red-100 dark:border-red-900/40">
        <h2 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
          <Trash2 size={18} />
          Delete Account
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Permanently deletes your account and all data — goals, entries, and run history. This cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
          >
            Delete my account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteConfirm(false); setConfirmText(''); setError(null); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
