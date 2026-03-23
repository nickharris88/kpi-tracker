'use client';

import { doc, getDoc, setDoc, onSnapshot, Unsubscribe, deleteDoc } from 'firebase/firestore';
import { getDbInstance } from './firebase';
import { AppData, SharedDashboard } from './types';

function getUserDocRef(uid: string) {
  return doc(getDbInstance(), 'users', uid);
}

function getSharedDocRef(shareCode: string) {
  return doc(getDbInstance(), 'shared', shareCode);
}

export async function loadUserData(uid: string): Promise<AppData | null> {
  try {
    const snap = await getDoc(getUserDocRef(uid));
    if (snap.exists()) {
      return snap.data() as AppData;
    }
    return null;
  } catch (err) {
    console.error('Error loading user data from Firestore:', err);
    return null;
  }
}

export async function saveUserData(uid: string, data: AppData): Promise<void> {
  try {
    await setDoc(getUserDocRef(uid), JSON.parse(JSON.stringify(data)));
    // If sharing is enabled, update the shared document too
    if (data.sharing?.enabled && data.sharing.shareCode) {
      await updateSharedDashboard(uid, data);
    }
  } catch (err) {
    console.error('Error saving user data to Firestore:', err);
  }
}

export function subscribeToUserData(uid: string, callback: (data: AppData | null) => void): Unsubscribe {
  return onSnapshot(getUserDocRef(uid), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as AppData);
    } else {
      callback(null);
    }
  }, (err) => {
    console.error('Error subscribing to user data:', err);
  });
}

// --- Sharing / Accountability Partner functions ---

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export { generateShareCode };

export async function updateSharedDashboard(uid: string, data: AppData): Promise<void> {
  if (!data.sharing?.shareCode) return;
  try {
    const shared: SharedDashboard = {
      ownerUid: uid,
      ownerName: data.profile.name || 'Anonymous',
      goals: data.goals,
      entries: data.entries,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(getSharedDocRef(data.sharing.shareCode), JSON.parse(JSON.stringify(shared)));
  } catch (err) {
    console.error('Error updating shared dashboard:', err);
  }
}

export async function deleteSharedDashboard(shareCode: string): Promise<void> {
  try {
    await deleteDoc(getSharedDocRef(shareCode));
  } catch (err) {
    console.error('Error deleting shared dashboard:', err);
  }
}

export async function loadSharedDashboard(shareCode: string): Promise<SharedDashboard | null> {
  try {
    const snap = await getDoc(getSharedDocRef(shareCode));
    if (snap.exists()) {
      return snap.data() as SharedDashboard;
    }
    return null;
  } catch (err) {
    console.error('Error loading shared dashboard:', err);
    return null;
  }
}
