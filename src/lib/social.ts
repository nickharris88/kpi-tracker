'use client';

import {
  doc, collection, query, where, getDocs, addDoc, updateDoc,
  setDoc, deleteDoc, onSnapshot, Unsubscribe,
} from 'firebase/firestore';
import { getDbInstance } from './firebase';
import { AppData, PublicProfile, Friendship, FriendData, Cheer } from './types';
import { getDailyScore, getStreakForGoal } from './storage';

// --- Profile ---

export async function syncProfile(uid: string, data: AppData): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const activeGoals = data.goals.filter(g => g.active);
  let bestStreak = 0;
  for (const g of activeGoals) {
    const s = getStreakForGoal(data, g.id);
    if (s > bestStreak) bestStreak = s;
  }
  const profile: PublicProfile = {
    uid,
    name: data.profile.name || 'Anonymous',
    goalCount: activeGoals.length,
    currentStreak: bestStreak,
    todayScore: getDailyScore(data, today),
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(getDbInstance(), 'profiles', uid), profile);
  } catch (err) {
    console.error('Error syncing profile:', err);
  }
}

export async function searchProfiles(searchQuery: string, currentUid: string): Promise<PublicProfile[]> {
  try {
    const snap = await getDocs(collection(getDbInstance(), 'profiles'));
    const q = searchQuery.toLowerCase();
    return snap.docs
      .map(d => d.data() as PublicProfile)
      .filter(p => p.uid !== currentUid && p.name.toLowerCase().includes(q));
  } catch (err) {
    console.error('Error searching profiles:', err);
    return [];
  }
}

// --- Friend Data ---

export async function syncFriendData(uid: string, data: AppData): Promise<void> {
  const today = new Date();
  const activeGoals = data.goals.filter(g => g.active);
  const recentScores: { date: string; score: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    recentScores.push({ date: ds, score: getDailyScore(data, ds) });
  }
  const streaks = activeGoals
    .map(g => ({ goalName: g.name, goalIcon: g.icon, streak: getStreakForGoal(data, g.id) }))
    .filter(s => s.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5);

  const friendData: FriendData = {
    uid,
    name: data.profile.name || 'Anonymous',
    goals: activeGoals.map(g => ({ ...g })),
    recentScores,
    streaks,
    todayScore: getDailyScore(data, today.toISOString().split('T')[0]),
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(getDbInstance(), 'friendData', uid), JSON.parse(JSON.stringify(friendData)));
  } catch (err) {
    console.error('Error syncing friend data:', err);
  }
}

export async function loadFriendData(friendUid: string): Promise<FriendData | null> {
  try {
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(getDbInstance(), 'friendData', friendUid));
    if (snap.exists()) return snap.data() as FriendData;
    return null;
  } catch (err) {
    console.error('Error loading friend data:', err);
    return null;
  }
}

// --- Friendships ---

export async function sendFriendRequest(
  fromUid: string, fromName: string,
  toUid: string, toName: string
): Promise<string | null> {
  try {
    const existing = await getDocs(
      query(
        collection(getDbInstance(), 'friendships'),
        where('participants', 'array-contains', fromUid)
      )
    );
    const duplicate = existing.docs.find(d => {
      const data = d.data();
      return data.participants.includes(toUid) && data.status !== 'declined';
    });
    if (duplicate) return 'Friend request already exists';

    await addDoc(collection(getDbInstance(), 'friendships'), {
      participants: [fromUid, toUid],
      initiatorUid: fromUid,
      initiatorName: fromName,
      recipientUid: toUid,
      recipientName: toName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return null;
  } catch (err) {
    console.error('Error sending friend request:', err);
    return 'Failed to send request';
  }
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
  try {
    await updateDoc(doc(getDbInstance(), 'friendships', friendshipId), {
      status: accept ? 'accepted' : 'declined',
      respondedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error responding to friend request:', err);
  }
}

export async function removeFriend(friendshipId: string): Promise<void> {
  try {
    await deleteDoc(doc(getDbInstance(), 'friendships', friendshipId));
  } catch (err) {
    console.error('Error removing friend:', err);
  }
}

export function subscribeFriendships(uid: string, callback: (friendships: Friendship[]) => void): Unsubscribe {
  const q = query(
    collection(getDbInstance(), 'friendships'),
    where('participants', 'array-contains', uid)
  );
  return onSnapshot(q, (snap) => {
    const friendships = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Friendship[];
    callback(friendships);
  }, (err) => {
    console.error('Error subscribing to friendships:', err);
  });
}

// --- Cheers ---

export async function sendCheer(cheer: Omit<Cheer, 'id'>): Promise<void> {
  try {
    await addDoc(collection(getDbInstance(), 'cheers'), cheer);
  } catch (err) {
    console.error('Error sending cheer:', err);
  }
}

export function subscribeCheers(uid: string, callback: (cheers: Cheer[]) => void): Unsubscribe {
  // Use simple where-only query to avoid needing a composite Firestore index
  const q = query(
    collection(getDbInstance(), 'cheers'),
    where('toUid', '==', uid)
  );
  return onSnapshot(q, (snap) => {
    const cheers = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Cheer))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
    callback(cheers);
  }, (err) => {
    console.error('Error subscribing to cheers:', err);
  });
}

export async function getCheersForFriend(fromUid: string, toUid: string): Promise<Cheer[]> {
  try {
    // Simple query without orderBy to avoid composite index requirement
    const q = query(
      collection(getDbInstance(), 'cheers'),
      where('fromUid', '==', fromUid),
      where('toUid', '==', toUid)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Cheer))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
  } catch (err) {
    console.error('Error loading cheers:', err);
    return [];
  }
}

// --- Cleanup ---

export async function deleteSocialData(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(getDbInstance(), 'profiles', uid));
    await deleteDoc(doc(getDbInstance(), 'friendData', uid));

    const friendships = await getDocs(
      query(collection(getDbInstance(), 'friendships'), where('participants', 'array-contains', uid))
    );
    for (const d of friendships.docs) {
      await deleteDoc(d.ref);
    }

    const cheersFrom = await getDocs(
      query(collection(getDbInstance(), 'cheers'), where('fromUid', '==', uid))
    );
    for (const d of cheersFrom.docs) {
      await deleteDoc(d.ref);
    }

    const cheersTo = await getDocs(
      query(collection(getDbInstance(), 'cheers'), where('toUid', '==', uid))
    );
    for (const d of cheersTo.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err) {
    console.error('Error deleting social data:', err);
  }
}
