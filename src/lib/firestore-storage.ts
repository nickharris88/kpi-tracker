'use client';

import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getDbInstance } from './firebase';
import { AppData } from './types';

function getUserDocRef(uid: string) {
  return doc(getDbInstance(), 'users', uid);
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
