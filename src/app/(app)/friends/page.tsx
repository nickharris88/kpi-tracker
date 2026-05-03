'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Users, Search, UserPlus, Check, X, ChevronDown, ChevronUp, Flame, Send, Trophy, Heart } from 'lucide-react';
import { useAppData } from '@/app/providers';
import {
  searchProfiles, sendFriendRequest, respondToFriendRequest,
  removeFriend, subscribeFriendships, loadFriendData,
  sendCheer, subscribeCheers,
} from '@/lib/social';
import { PublicProfile, Friendship, FriendData, Cheer, CHEER_EMOJIS } from '@/lib/types';

export default function FriendsPage() {
  const { user, data } = useAppData();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [cheers, setCheers] = useState<Cheer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [expandedFriend, setExpandedFriend] = useState<string | null>(null);
  const [friendDataMap, setFriendDataMap] = useState<Record<string, FriendData>>({});

  // Subscribe to friendships and cheers
  useEffect(() => {
    if (!user) return;
    const unsub1 = subscribeFriendships(user.uid, setFriendships);
    const unsub2 = subscribeCheers(user.uid, setCheers);
    return () => { unsub1(); unsub2(); };
  }, [user]);

  const pendingIncoming = friendships.filter(
    f => f.status === 'pending' && f.recipientUid === user?.uid
  );
  const pendingOutgoing = friendships.filter(
    f => f.status === 'pending' && f.initiatorUid === user?.uid
  );
  const friends = friendships.filter(f => f.status === 'accepted');

  const getFriendUid = (f: Friendship) =>
    f.initiatorUid === user?.uid ? f.recipientUid : f.initiatorUid;
  const getFriendName = (f: Friendship) =>
    f.initiatorUid === user?.uid ? f.recipientName : f.initiatorName;

  const alreadyConnected = new Set([
    ...friendships.filter(f => f.status !== 'declined').flatMap(f => f.participants),
  ]);

  const handleSearch = useCallback(async () => {
    if (!user || searchQuery.trim().length < 2) return;
    setSearching(true);
    const results = await searchProfiles(searchQuery, user.uid);
    setSearchResults(results);
    setSearching(false);
  }, [searchQuery, user]);

  const handleSendRequest = async (profile: PublicProfile) => {
    if (!user) return;
    setSendingTo(profile.uid);
    await sendFriendRequest(user.uid, data.profile.name || 'Anonymous', profile.uid, profile.name);
    setSendingTo(null);
    setSearchResults(prev => prev.filter(p => p.uid !== profile.uid));
  };

  const handleExpand = async (friendUid: string) => {
    if (expandedFriend === friendUid) {
      setExpandedFriend(null);
      return;
    }
    setExpandedFriend(friendUid);
    if (!friendDataMap[friendUid]) {
      const fd = await loadFriendData(friendUid);
      if (fd) setFriendDataMap(prev => ({ ...prev, [friendUid]: fd }));
    }
  };

  const recentCheers = cheers.filter(c => {
    const age = Date.now() - new Date(c.createdAt).getTime();
    return age < 7 * 24 * 60 * 60 * 1000; // last 7 days
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={24} />
          Friends
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {friends.length} friend{friends.length !== 1 ? 's' : ''} connected
        </p>
      </div>

      {/* Recent Cheers */}
      {recentCheers.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-orange-50 dark:from-pink-950/20 dark:to-orange-950/20 rounded-xl p-4 border border-pink-100 dark:border-pink-900/40">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
            <Heart size={14} className="text-pink-500" />
            Recent Cheers
          </h3>
          <div className="space-y-1.5">
            {recentCheers.slice(0, 5).map(cheer => (
              <div key={cheer.id} className="flex items-center gap-2 text-sm">
                <span>{cheer.emoji}</span>
                <span className="font-medium text-gray-900 dark:text-white">{cheer.fromName}</span>
                {cheer.message && <span className="text-gray-500 dark:text-gray-400">— {cheer.message}</span>}
                <span className="text-xs text-gray-400 ml-auto">{format(new Date(cheer.createdAt), 'MMM d')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingIncoming.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-amber-200 dark:border-amber-800">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserPlus size={18} className="text-amber-500" />
            Friend Requests ({pendingIncoming.length})
          </h2>
          <div className="space-y-3">
            {pendingIncoming.map(f => (
              <div key={f.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{f.initiatorName}</p>
                  <p className="text-xs text-gray-500">Sent {format(new Date(f.createdAt), 'MMM d')}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToFriendRequest(f.id, true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => respondToFriendRequest(f.id, false)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    <X size={14} /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Find Friends */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Search size={18} />
          Find Friends
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name..."
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSearch}
            disabled={searching || searchQuery.trim().length < 2}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map(profile => {
              const connected = alreadyConnected.has(profile.uid);
              return (
                <div key={profile.uid} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{profile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {profile.goalCount} goals &middot; {profile.currentStreak}d streak
                    </p>
                  </div>
                  {connected ? (
                    <span className="text-xs text-gray-400 px-3 py-1.5">Already connected</span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(profile)}
                      disabled={sendingTo === profile.uid}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <UserPlus size={14} />
                      {sendingTo === profile.uid ? 'Sending...' : 'Add Friend'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {pendingOutgoing.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Pending sent requests</p>
            {pendingOutgoing.map(f => (
              <div key={f.id} className="flex items-center justify-between py-1 text-sm text-gray-500 dark:text-gray-400">
                <span>{f.recipientName}</span>
                <span className="text-xs">Pending</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Friends */}
      {friends.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            My Friends
          </h2>
          {friends.map(f => {
            const friendUid = getFriendUid(f);
            const friendName = getFriendName(f);
            const isExpanded = expandedFriend === friendUid;
            const fd = friendDataMap[friendUid];

            return (
              <FriendCard
                key={f.id}
                friendUid={friendUid}
                friendName={friendName}
                isExpanded={isExpanded}
                friendData={fd}
                currentUserUid={user?.uid || ''}
                currentUserName={data.profile.name || 'Anonymous'}
                onToggle={() => handleExpand(friendUid)}
                onRemove={() => removeFriend(f.id)}
              />
            );
          })}
        </div>
      )}

      {friends.length === 0 && pendingIncoming.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No friends yet</p>
          <p className="text-sm">Search for friends above to get started</p>
        </div>
      )}
    </div>
  );
}

function FriendCard({
  friendUid, friendName, isExpanded, friendData,
  currentUserUid, currentUserName, onToggle, onRemove,
}: {
  friendUid: string;
  friendName: string;
  isExpanded: boolean;
  friendData?: FriendData;
  currentUserUid: string;
  currentUserName: string;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const [cheerEmoji, setCheerEmoji] = useState<string | null>(null);
  const [cheerMsg, setCheerMsg] = useState('');
  const [showCheerInput, setShowCheerInput] = useState(false);
  const [cheerSent, setCheerSent] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleSendCheer = async (emoji: string, message?: string) => {
    await sendCheer({
      fromUid: currentUserUid,
      fromName: currentUserName,
      toUid: friendUid,
      date: format(new Date(), 'yyyy-MM-dd'),
      emoji,
      message: message || undefined,
      createdAt: new Date().toISOString(),
    });
    setCheerEmoji(null);
    setCheerMsg('');
    setShowCheerInput(false);
    setCheerSent(true);
    setTimeout(() => setCheerSent(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Friend Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-lg font-bold text-blue-600 dark:text-blue-400">
            {friendName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900 dark:text-white">{friendName}</p>
            {friendData && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Today: {friendData.todayScore}%
                {friendData.streaks.length > 0 && (
                  <> &middot; Best streak: {friendData.streaks[0].streak}d</>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {friendData && friendData.todayScore >= 80 && (
            <span className="text-lg">🔥</span>
          )}
          {cheerSent && <span className="text-xs text-emerald-500 font-medium">Sent!</span>}
          {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-4">
          {friendData ? (
            <>
              {/* Week scores */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">This Week</p>
                <div className="flex gap-1">
                  {[...friendData.recentScores].reverse().map(({ date, score }) => (
                    <div key={date} className="flex-1 text-center">
                      <div className="text-[10px] text-gray-500 mb-0.5">
                        {format(new Date(date), 'EEE')}
                      </div>
                      <div className={`w-full aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${
                        score >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : score >= 50 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        : score > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}>
                        {score > 0 ? score : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streaks */}
              {friendData.streaks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Active Streaks</p>
                  <div className="flex flex-wrap gap-2">
                    {friendData.streaks.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-2.5 py-1.5">
                        <span className="text-sm">{s.goalIcon}</span>
                        <Flame size={12} className="text-orange-500" />
                        <span className="text-xs font-bold text-orange-500">{s.streak}d</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  Goals ({friendData.goals.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {friendData.goals.map(g => (
                    <span key={g.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg px-2.5 py-1.5">
                      {g.icon} {g.name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Loading...</p>
          )}

          {/* Cheer Section */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Send a Cheer</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CHEER_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    if (cheerEmoji === emoji) {
                      handleSendCheer(emoji);
                    } else {
                      setCheerEmoji(emoji);
                      setShowCheerInput(true);
                    }
                  }}
                  className={`text-xl p-1.5 rounded-lg transition-all hover:scale-110 ${
                    cheerEmoji === emoji
                      ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {showCheerInput && cheerEmoji && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cheerMsg}
                  onChange={e => setCheerMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCheer(cheerEmoji, cheerMsg)}
                  placeholder="Add a message (optional)..."
                  maxLength={100}
                  className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                  autoFocus
                />
                <button
                  onClick={() => handleSendCheer(cheerEmoji, cheerMsg)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Send size={14} />
                  Send
                </button>
              </div>
            )}
          </div>

          {/* Remove Friend */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            {!confirmRemove ? (
              <button
                onClick={() => setConfirmRemove(true)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Remove friend
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">Remove {friendName}?</span>
                <button
                  onClick={() => { onRemove(); setConfirmRemove(false); }}
                  className="text-xs text-red-500 font-medium hover:text-red-600"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmRemove(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
