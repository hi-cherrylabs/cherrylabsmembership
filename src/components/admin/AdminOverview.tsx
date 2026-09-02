import type { UserProfile, SuggestionThread, Application } from '../../types';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek() {
  return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

export default function AdminOverview({
  members,
  threads,
  applications,
}: {
  members: UserProfile[];
  threads: SuggestionThread[];
  applications: Application[];
}) {
  const memberList = members.filter((m) => !m.isAdmin);
  const today = startOfToday();
  const week = startOfWeek();

  const newToday = memberList.filter((m) => m.createdAt && m.createdAt.toMillis() >= today).length;
  const newThisWeek = memberList.filter((m) => m.createdAt && m.createdAt.toMillis() >= week).length;
  const activeVip = memberList.filter((m) => m.vipExpiresAt && m.vipExpiresAt.toMillis() > Date.now()).length;
  const unreadThreads = threads.filter((t) => t.unreadByAdmin).length;
  const pendingApplications = applications.filter((a) => a.status === 'new' || a.status === 'reviewing').length;

  const cards = [
    { label: 'Total Members', value: memberList.length },
    { label: 'New Today', value: newToday },
    { label: 'New This Week', value: newThisWeek },
    { label: 'Active VIP Passes', value: activeVip },
    { label: 'Unread Suggestions', value: unreadThreads },
    { label: 'Pending Applications', value: pendingApplications },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-6 max-w-2xl mx-auto">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-[var(--surface-40)] backdrop-blur-xl border border-[var(--border-60)] rounded-2xl p-5 flex flex-col gap-1 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
        >
          <span className="text-3xl font-black text-[var(--text-90)]">{c.value}</span>
          <span className="text-xs font-bold text-[var(--text-50)] uppercase tracking-wider">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
