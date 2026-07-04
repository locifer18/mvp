import { prisma } from '@/lib/prisma';
import { isPast, isFuture, isToday } from 'date-fns';
import StatsCards from '@/components/dashboard/StatsCards';
import StatusChart from '@/components/dashboard/StatusChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import FollowUpWidget from '@/components/dashboard/FollowUpWidget';
import UpcomingFollowUps from '@/components/dashboard/UpcomingFollowUps';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const [contacts, activities] = await Promise.all([
    prisma.contact.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: {
        contact: { select: { name: true, company: true, deletedAt: true } },
      },
    }),
  ]);

  const total = contacts.length;

  // Contacted = anyone who is no longer NEW
  const contacted = contacts.filter(c => c.status !== 'NEW').length;

  // Awaiting = contacted but no reply yet and not closed
  const awaiting = contacts.filter(c =>
    ['CONTACTED', 'AWAITING_RESPONSE'].includes(c.status)
  ).length;

  // Replied = status is REPLIED or beyond
  const replied = contacts.filter(c =>
    ['REPLIED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON', 'LOST'].includes(c.status)
  ).length;

  const activeInterviews = contacts.filter(c =>
    ['INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;

  const reachedInterview = contacts.filter(c =>
    ['INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON', 'LOST'].includes(c.status)
  ).length;

  // ── Offer counting ────────────────────────────────────────────────────────
  // Reached offer = currently WON or OFFER_RECEIVED
  // (we can't know if a LOST contact had an offer without extra tracking)
  const offers = contacts.filter(c =>
    ['OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;

  const won = contacts.filter(c => c.status === 'WON').length;

  const lost = contacts.filter(c => c.status === 'LOST').length;

  const needsFollowUpContacts = contacts.filter(c =>
    c.followUpDate &&
    (isPast(new Date(c.followUpDate)) || isToday(new Date(c.followUpDate))) &&
    !['WON', 'LOST', 'OFFER_RECEIVED', 'REPLIED'].includes(c.status)
  );

  const upcomingFollowUps = contacts
    .filter(c =>
      c.followUpDate &&
      isFuture(new Date(c.followUpDate)) &&
      !isToday(new Date(c.followUpDate)) &&
      !['WON', 'LOST', 'REPLIED'].includes(c.status)
    )
    .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime())
    .slice(0, 8);

  // Status breakdown for chart
  const statusBreakdown = [
    'NEW', 'CONTACTED', 'AWAITING_RESPONSE', 'REPLIED',
    'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON', 'LOST',
  ].map(s => ({
    status: s,
    count: contacts.filter(c => c.status === s).length,
  }));

  const safeDiv = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

  const validActivities = activities.filter(a => !a.contact.deletedAt);

  return {
    stats: {
      total,
      contacted,
      awaiting,
      replied,
      // Use reachedInterview for rate calc (includes rejected-after-interview)
      interviews: activeInterviews,
      reachedInterview,
      offers,
      won,
      lost,
      needsFollowUp: needsFollowUpContacts.length,
      replyRate:     safeDiv(replied, contacted),
      interviewRate: safeDiv(reachedInterview, replied),
      offerRate:     safeDiv(offers, reachedInterview),
      successRate:   safeDiv(won, total),
    },
    statusBreakdown,
    activities: validActivities,
    upcomingFollowUps,
    needsFollowUpContacts,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Your outreach overview</p>
      </div>
      <StatsCards stats={data.stats} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StatusChart data={data.statusBreakdown} />
        </div>
        <FollowUpWidget contacts={data.needsFollowUpContacts} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={data.activities} />
        <UpcomingFollowUps contacts={data.upcomingFollowUps} />
      </div>
    </div>
  );
}
