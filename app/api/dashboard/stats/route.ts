import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPast, isToday } from 'date-fns';

export async function GET() {
  const contacts = await prisma.contact.findMany({ where: { deletedAt: null } });

  const total        = contacts.length;
  const contacted    = contacts.filter(c => c.status !== 'NEW').length;
  const replied      = contacts.filter(c => ['REPLIED','INTERVIEW_SCHEDULED','OFFER_RECEIVED','WON','LOST'].includes(c.status)).length;
  const interviews   = contacts.filter(c => ['INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON'].includes(c.status)).length;
  const offers       = contacts.filter(c => ['OFFER_RECEIVED', 'WON'].includes(c.status)).length;
  const won          = contacts.filter(c => c.status === 'WON').length;
  const lost         = contacts.filter(c => c.status === 'LOST').length;
  const awaiting     = contacts.filter(c => ['AWAITING_RESPONSE', 'CONTACTED'].includes(c.status)).length;
  const needsFollowUp = contacts.filter(c =>
    c.followUpDate &&
    (isPast(new Date(c.followUpDate)) || isToday(new Date(c.followUpDate))) &&
    !['WON', 'LOST', 'OFFER_RECEIVED', 'REPLIED'].includes(c.status)
  ).length;

  const safeDiv = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

  return NextResponse.json({
    total, contacted, awaiting, replied, interviews, offers, won, lost, needsFollowUp,
    replyRate:     safeDiv(replied, contacted),
    interviewRate: safeDiv(interviews, replied),
    offerRate:     safeDiv(offers, interviews),
    successRate:   safeDiv(won, total),
  });
}