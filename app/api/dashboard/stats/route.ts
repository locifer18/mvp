import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPast } from 'date-fns';

export async function GET() {
  const contacts = await prisma.contact.findMany({ where: { deletedAt: null } });
  const total = contacts.length;
  const contacted = contacts.filter(c => c.status !== 'NEW').length;
  const replied = contacts.filter(c =>
    ['REPLIED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;
  const interviews = contacts.filter(c =>
    ['INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON'].includes(c.status)
  ).length;
  const offers = contacts.filter(c => ['OFFER_RECEIVED', 'WON'].includes(c.status)).length;
  const won = contacts.filter(c => c.status === 'WON').length;
  const lost = contacts.filter(c => c.status === 'LOST').length;
  const needsFollowUp = contacts.filter(
    c => c.status === 'AWAITING_RESPONSE' && c.followUpDate && isPast(c.followUpDate)
  ).length;

  return NextResponse.json({
    total, contacted, replied, interviews, offers, won, lost, needsFollowUp,
    replyRate: contacted > 0 ? Math.round((replied / contacted) * 100) : 0,
    interviewRate: replied > 0 ? Math.round((interviews / replied) * 100) : 0,
    offerRate: interviews > 0 ? Math.round((offers / interviews) * 100) : 0,
    successRate: total > 0 ? Math.round((won / total) * 100) : 0,
  });
}