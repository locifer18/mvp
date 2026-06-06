import { prisma } from '@/lib/prisma';
import { isPast, isFuture, isToday } from 'date-fns';
import StatsCards from '@/components/dashboard/StatsCards';
import StatusChart from '@/components/dashboard/StatusChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import FollowUpWidget from '@/components/dashboard/FollowUpWidget';
import UpcomingFollowUps from '@/components/dashboard/UpcomingFollowUps';

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
        contact: {
          select: { name: true, company: true, deletedAt: true },
        },
      },
    }),
  ]);

  const total = contacts.length;

  // Contacted = anyone who is no longer NEW
  const contacted = contacts.filter(c => c.status !== 'NEW').length;

  // Replied = responseStatus is REPLIED (regardless of current status)
  const replied = contacts.filter(c => c.responseStatus === 'REPLIED').length;

  // Interviews = currently in interview stage or beyond
  const interviews = contacts.filter(c =>
    ['INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;

  // Offers = offer received or won
  const offers = contacts.filter(c =>
    ['OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;

  const won  = contacts.filter(c => c.status === 'WON').length;
  const lost = contacts.filter(c => c.status === 'LOST').length;

  // Awaiting = contacted but no reply yet
  const awaiting = contacts.filter(c =>
    c.status === 'AWAITING_RESPONSE' || c.status === 'CONTACTED'
  ).length;

  // Needs follow-up = overdue follow-up date AND not replied
  const needsFollowUpContacts = contacts.filter(c =>
    c.followUpDate &&
    (isPast(new Date(c.followUpDate)) || isToday(new Date(c.followUpDate))) &&
    c.responseStatus !== 'REPLIED' &&
    !['WON', 'LOST', 'OFFER_RECEIVED'].includes(c.status)
  );

  // Upcoming follow-ups = future follow-up date, not replied, not closed
  const upcomingFollowUps = contacts
    .filter(c =>
      c.followUpDate &&
      isFuture(new Date(c.followUpDate)) &&
      !isToday(new Date(c.followUpDate)) &&
      c.responseStatus !== 'REPLIED' &&
      !['WON', 'LOST'].includes(c.status)
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

  // Rates — all based on total contacted (non-NEW) to be meaningful
  const safeDiv = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

  // Filter out activities from deleted contacts
  const validActivities = activities.filter(a => !a.contact.deletedAt);

  return {
    stats: {
      total,
      contacted,
      awaiting,
      replied,
      interviews,
      offers,
      won,
      lost,
      needsFollowUp: needsFollowUpContacts.length,
      // Reply rate = replied / contacted (how many you reached responded)
      replyRate:     safeDiv(replied, contacted),
      // Interview rate = interviews / replied (how many replies led to interview)
      interviewRate: safeDiv(interviews, replied),
      // Offer rate = offers / interviews (how many interviews led to offer)
      offerRate:     safeDiv(offers, interviews),
      // Success rate = won / total (overall win rate)
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
