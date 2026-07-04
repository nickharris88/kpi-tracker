import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Hourly Vercel cron: sends a push reminder to every user whose chosen
// reminder hour matches the current hour in their timezone.
//
// Required env vars:
//   FIREBASE_SERVICE_ACCOUNT — full service-account JSON (Firebase Console → Project settings → Service accounts)
//   CRON_SECRET — shared secret; Vercel cron sends it as Authorization: Bearer <CRON_SECRET>

export const dynamic = 'force-dynamic';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Mint a Google OAuth access token from the service account (no SDK needed)
async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${claims}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key);
  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`OAuth token exchange failed: ${res.status}`);
  const json = await res.json();
  return json.access_token;
}

interface TokenDoc {
  uid: string;
  token: string;
  reminderTime: string; // HH:mm
  timezone: string;
  enabled: boolean;
}

function parseFirestoreDoc(fields: Record<string, { stringValue?: string; booleanValue?: boolean }>): TokenDoc {
  return {
    uid: fields.uid?.stringValue || '',
    token: fields.token?.stringValue || '',
    reminderTime: fields.reminderTime?.stringValue || '20:00',
    timezone: fields.timezone?.stringValue || 'UTC',
    enabled: fields.enabled?.booleanValue !== false,
  };
}

function currentHourInTimezone(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: 'numeric', hour12: false });
    return parseInt(formatter.format(new Date()), 10) % 24;
  } catch {
    return new Date().getUTCHours();
  }
}

const REMINDER_MESSAGES = [
  'Still all green today? 20 seconds to log it. 🎯',
  'Quick check-in time — how did today go? ✅',
  'Your streaks are waiting. Log today before bed! 🔥',
  'One tap and today is on the board. 📈',
];

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!saRaw) {
    return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT not configured' }, { status: 500 });
  }

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(saRaw);
  } catch {
    return NextResponse.json({ error: 'FIREBASE_SERVICE_ACCOUNT is not valid JSON' }, { status: 500 });
  }

  try {
    const accessToken = await getAccessToken(sa);

    // List all fcmTokens documents via Firestore REST
    const listRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/fcmTokens?pageSize=300`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!listRes.ok) throw new Error(`Firestore list failed: ${listRes.status}`);
    const listJson = await listRes.json();
    const docs: { fields: Record<string, { stringValue?: string; booleanValue?: boolean }> }[] = listJson.documents || [];

    let sent = 0;
    let failed = 0;

    for (const d of docs) {
      const tokenDoc = parseFirestoreDoc(d.fields);
      if (!tokenDoc.enabled || !tokenDoc.token) continue;

      const reminderHour = parseInt(tokenDoc.reminderTime.split(':')[0], 10);
      if (currentHourInTimezone(tokenDoc.timezone) !== reminderHour) continue;

      const body = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
      const sendRes = await fetch(
        `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: tokenDoc.token,
              webpush: {
                notification: {
                  title: 'KPI Tracker',
                  body,
                  icon: '/icon-192.svg',
                },
                fcm_options: { link: '/' },
              },
            },
          }),
        }
      );
      if (sendRes.ok) sent++;
      else failed++;
    }

    return NextResponse.json({ ok: true, checked: docs.length, sent, failed });
  } catch (err) {
    console.error('send-reminders error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
