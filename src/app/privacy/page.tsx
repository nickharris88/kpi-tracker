import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy – KPI Tracker',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-500 hover:text-blue-600 text-sm">← Back to app</Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: May 2025</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What is KPI Tracker?</h2>
            <p>KPI Tracker is a personal goal-tracking web app that lets you log daily progress against your own goals, track streaks, and optionally share a read-only view of your progress with others.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What data we collect</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><span className="font-medium">Account information</span> — your email address and display name, collected via Google or email sign-in (powered by Firebase Authentication).</li>
              <li><span className="font-medium">Goal and tracking data</span> — the goals you create, your daily ratings (red/amber/green), notes, and run times. This data is personal health and lifestyle information.</li>
              <li><span className="font-medium">App settings</span> — preferences like dark mode and target times.</li>
            </ul>
            <p className="mt-3">We do not use advertising, analytics, or tracking cookies. We do not sell your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">How we use your data</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>To provide the app — storing and syncing your goals and entries across devices.</li>
              <li>To power the optional sharing feature — if you enable it, a read-only snapshot of your progress is stored under a private link you control.</li>
            </ul>
            <p className="mt-3">We do not use your data for any other purpose.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Where data is stored</h2>
            <p>Data is stored using Google Firebase (Firestore and Authentication). Firebase infrastructure is operated by Google and may store data in data centres outside the UK/EU. Google participates in the EU-US Data Privacy Framework and provides Standard Contractual Clauses for GDPR compliance. See <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Firebase Privacy</a> for details.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Your rights</h2>
            <p className="mb-3">Under UK and EU GDPR you have the right to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><span className="font-medium">Access your data</span> — use the Export Data feature in Goals → Data Management.</li>
              <li><span className="font-medium">Delete your data</span> — use Account → Delete Account to permanently remove all your data and your account.</li>
              <li><span className="font-medium">Correct your data</span> — you can edit goals, entries, and your profile name directly in the app.</li>
              <li><span className="font-medium">Contact us</span> — for any privacy queries, email us (see below).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data retention</h2>
            <p>Your data is retained until you delete your account. When you delete your account, all data — including goals, entries, and run history — is permanently removed from our systems.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
            <p>If you have questions about this policy or your data, please contact us at <a href="mailto:privacy@kpitracker.app" className="text-blue-500 hover:underline">privacy@kpitracker.app</a>.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center">
          <Link href="/" className="text-blue-500 hover:text-blue-600 text-sm">← Back to KPI Tracker</Link>
        </div>
      </div>
    </div>
  );
}
