import { prisma } from '@/lib/prisma';
import { Contact } from '@/types';
import MailPageComponent from '@/components/mail/MailPage';

export const dynamic = 'force-dynamic';

export default async function MailRoute() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  // Fetch contacts with email
  const raw = await prisma.contact.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  const contacts: Contact[] = raw
    .filter(c => c.email) // only show contacts that have email
    .map(c => ({
      ...c,
      followUpDate:    c.followUpDate    ? c.followUpDate.toISOString()    : null,
      lastContactedAt: c.lastContactedAt ? c.lastContactedAt.toISOString() : null,
      deletedAt:       c.deletedAt       ? c.deletedAt.toISOString()       : null,
      createdAt:       c.createdAt.toISOString(),
      updatedAt:       c.updatedAt.toISOString(),
      followUpCount:   (c as Record<string, unknown>).followUpCount as number ?? 0,
    }));

  // Safely fetch mail logs — table may not exist yet if prisma db push hasn't run
  let sentToday = 0;
  let serializedLogs: {
    id: string;
    toEmail: string;
    toName: string;
    subject: string;
    sentAt: string;
    contact: { name: string; company: string | null };
  }[] = [];
  let sentContactIds: string[] = [];

  try {
    const [count, logs, allSent] = await Promise.all([
      prisma.mailLog.count({ where: { sentAt: { gte: start } } }),
      prisma.mailLog.findMany({
        orderBy: { sentAt: 'desc' },
        take: 200,
        include: { contact: { select: { name: true, company: true } } },
      }),
      prisma.mailLog.findMany({ select: { contactId: true }, distinct: ['contactId'] }),
    ]);
    sentToday = count;
    serializedLogs = logs.map(l => ({ ...l, sentAt: l.sentAt.toISOString() }));
    sentContactIds = allSent.map(r => r.contactId);
  } catch {
    // MailLog table not yet created — run: npx prisma db push
  }

  const LIMIT = 50;

  return (
    <MailPageComponent
      contacts={contacts}
      sentToday={sentToday}
      remaining={LIMIT - sentToday}
      limit={LIMIT}
      logs={serializedLogs}
      sentContactIds={sentContactIds}
    />
  );
}
