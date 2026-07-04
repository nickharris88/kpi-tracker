'use client';

import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getDbInstance, getAppInstance } from './firebase';

// Client-side push reminder registration via FCM web push.
// Requires NEXT_PUBLIC_FIREBASE_VAPID_KEY (Firebase Console → Cloud Messaging → Web Push certificates).

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  );
}

export async function enableReminders(uid: string, reminderTime: string): Promise<string | null> {
  if (!isPushSupported()) {
    return 'Push notifications are not supported on this device/browser.';
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return 'Notification permission was denied. Enable it in your browser settings.';
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging(getAppInstance());
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return 'Could not get a push token. Try again.';

    await setDoc(doc(getDbInstance(), 'fcmTokens', uid), {
      uid,
      token,
      reminderTime, // HH:mm local
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      enabled: true,
      updatedAt: new Date().toISOString(),
    });
    return null;
  } catch (err) {
    console.error('Error enabling reminders:', err);
    return 'Something went wrong setting up notifications.';
  }
}

export async function updateReminderTime(uid: string, reminderTime: string): Promise<void> {
  try {
    await setDoc(
      doc(getDbInstance(), 'fcmTokens', uid),
      { reminderTime, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    console.error('Error updating reminder time:', err);
  }
}

export async function disableReminders(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(getDbInstance(), 'fcmTokens', uid));
  } catch (err) {
    console.error('Error disabling reminders:', err);
  }
}
