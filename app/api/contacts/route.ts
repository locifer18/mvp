import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contactSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 20;
  const where: Record<string, unknown> = { deletedAt: null };

  const search = searchParams.get('search');
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }
  const status = searchParams.get('status');
  if (status) where.status = status;
  const priority = searchParams.get('priority');
  if (priority) where.priority = priority;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.contact.count({ where }),
  ]);
  return NextResponse.json({ contacts, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const contact = await prisma.contact.create({
    data: {
      ...d,
      email: d.email || null,
      phone: d.phone || null,
      company: d.company || null,
      jobProfile: d.jobProfile || null,
      platform: d.platform || null,
      profileLink: d.profileLink || null,
      notes: d.notes || null,
      followUpDate: d.followUpDate ? new Date(d.followUpDate) : null,
      lastContactedAt: d.lastContactedAt ? new Date(d.lastContactedAt) : null,
      activities: {
        create: { type: 'CONTACT_CREATED', description: `Contact ${d.name} created` },
      },
    },
  });
  return NextResponse.json(contact, { status: 201 });
}