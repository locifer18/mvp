import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations';
import { addDays } from 'date-fns';

// Ensure followUpCount column exists (runs once, safe to call every time)
async function ensureFollowUpCount() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "followUpCount" INTEGER NOT NULL DEFAULT 0
    `);
  } catch {
    // Column already exists or DB doesn't support IF NOT EXISTS — ignore
  }
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: 'desc' } } },
  });
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureFollowUpCount();

  const { id } = await params;
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const d = parsed.data;
  const newActivities: { type: string; description: string }[] = [];
  const now = new Date();

  // Safe fallback — column may not exist yet in old records
  const existingFollowUpCount = (existing as Record<string, unknown>).followUpCount as number ?? 0;

  let followUpDate: Date | null = d.followUpDate
    ? new Date(d.followUpDate)
    : existing.followUpDate ?? null;
  let followUpCount = existingFollowUpCount;
  let finalStatus = d.status;
  const responseStatus = d.responseStatus;

  // ── Got a reply → reset follow-up sequence ────────────────────────────────
  if (d.responseStatus === 'REPLIED' && existing.responseStatus !== 'REPLIED') {
    followUpCount = 0;
    followUpDate = null;
    newActivities.push({
      type: 'STATUS_UPDATED',
      description: 'Response received — follow-up sequence reset',
    });
  }

  // ── Status changed ────────────────────────────────────────────────────────
  if (existing.status !== d.status) {
    newActivities.push({
      type: 'STATUS_UPDATED',
      description: `Status changed from ${existing.status} to ${d.status}`,
    });
    if (d.status === 'INTERVIEW_SCHEDULED')
      newActivities.push({ type: 'INTERVIEW_SCHEDULED', description: 'Interview scheduled' });
    if (d.status === 'OFFER_RECEIVED')
      newActivities.push({ type: 'OFFER_RECEIVED', description: 'Offer received' });

    // First outreach → auto-schedule follow-up #1 in 3 days
    if (
      (d.status === 'CONTACTED' || d.status === 'AWAITING_RESPONSE') &&
      (existing.status === 'NEW' || existing.status === 'CONTACTED') &&
      responseStatus !== 'REPLIED' &&
      followUpCount === 0
    ) {
      followUpCount = 1;
      followUpDate = addDays(now, 3);
      newActivities.push({
        type: 'FOLLOW_UP_SCHEDULED',
        description: `Follow-up #1 auto-scheduled for ${followUpDate.toDateString()}`,
      });
    }
  }

  // ── Manual follow-up date changed → advance follow-up counter ────────────
  const incomingDate = d.followUpDate ? d.followUpDate.split('T')[0] : null;
  const existingDate = existing.followUpDate
    ? existing.followUpDate.toISOString().split('T')[0]
    : null;

  if (
    incomingDate &&
    incomingDate !== existingDate &&
    responseStatus !== 'REPLIED' &&
    !newActivities.some(a => a.type === 'FOLLOW_UP_SCHEDULED')
  ) {
    followUpCount = Math.min(existingFollowUpCount + 1, 3);
    followUpDate = new Date(d.followUpDate!);
    newActivities.push({
      type: 'FOLLOW_UP_SCHEDULED',
      description: `Follow-up #${followUpCount} scheduled for ${followUpDate.toDateString()}`,
    });
  }

  // ── 3 follow-ups no reply → auto LOST ─────────────────────────────────────
  if (
    followUpCount >= 3 &&
    responseStatus !== 'REPLIED' &&
    !['WON', 'OFFER_RECEIVED', 'INTERVIEW_SCHEDULED', 'LOST'].includes(finalStatus)
  ) {
    finalStatus = 'LOST';
    newActivities.push({
      type: 'STATUS_UPDATED',
      description: '3 follow-ups with no reply — automatically marked as Lost',
    });
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  const updateData: Record<string, unknown> = {
    name:            d.name,
    email:           d.email || null,
    phone:           d.phone || null,
    company:         d.company || null,
    jobProfile:      d.jobProfile || null,
    platform:        d.platform || null,
    profileLink:     d.profileLink || null,
    status:          finalStatus,
    responseStatus:  responseStatus,
    priority:        d.priority,
    tags:            d.tags,
    notes:           d.notes || null,
    followUpDate:    followUpDate ?? null,
    followUpCount:   followUpCount,
    lastContactedAt: d.lastContactedAt
      ? new Date(d.lastContactedAt)
      : existing.lastContactedAt ?? null,
    activities:      newActivities.length > 0
      ? { create: newActivities as never }
      : undefined,
  };

  // Remove followUpCount from payload if column doesn't exist in client yet
  // (will be set via raw SQL below as fallback)
  let contact;
  try {
    contact = await prisma.contact.update({
      where: { id },
      data: updateData as never,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('followUpCount')) {
      // Column missing from generated client — update without it, then raw update
      delete updateData.followUpCount;
      contact = await prisma.contact.update({
        where: { id },
        data: updateData as never,
      });
      await prisma.$executeRawUnsafe(
        `UPDATE "Contact" SET "followUpCount" = $1 WHERE id = $2`,
        followUpCount,
        id
      );
    } else {
      throw err;
    }
  }

  return NextResponse.json({ ...contact, followUpCount });
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
