import { prisma } from '@/lib/prisma';
import { Contact } from '@/types';
import MailPageComponent from '@/components/mail/MailPage';

export const dynamic = 'force-dynamic';

export default async function MailRoute() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const [raw, sentToday, logs] = await Promise.all([
    prisma.contact.findMany({
      where: { deletedAt: null, email: { not: null } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.mailLog.count({ where: { sentAt: { gte: start } } }),
    prisma.mailLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 100,
      include: { contact: { select: { name: true, company: true } } },
    }),
  ]);

  const contacts: Contact[] = raw.map(c => ({
    ...c,
    followUpDate:    c.followUpDate    ? c.followUpDate.toISOString()    : null,
    lastContactedAt: c.lastContactedAt ? c.lastContactedAt.toISOString() : null,
    deletedAt:       c.deletedAt       ? c.deletedAt.toISOString()       : null,
    createdAt:       c.createdAt.toISOString(),
    updatedAt:       c.updatedAt.toISOString(),
    followUpCount:   (c as Record<string, unknown>).followUpCount as number ?? 0,
  }));

  const serializedLogs = logs.map(l => ({
    ...l,
    sentAt: l.sentAt.toISOString(),
  }));

  const LIMIT = 50;

  return (
    <MailPageComponent
      contacts={contacts}
      sentToday={sentToday}
      remaining={LIMIT - sentToday}
      limit={LIMIT}
      logs={serializedLogs}
    />
  );
}
