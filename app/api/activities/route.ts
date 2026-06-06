import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('contactId');
  const activities = await prisma.activity.findMany({
    where: contactId ? { contactId } : {},
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { contact: { select: { name: true } } },
  });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const activity = await prisma.activity.create({ data: body });
  return NextResponse.json(activity, { status: 201 });
}