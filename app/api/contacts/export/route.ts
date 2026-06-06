import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const contacts = await prisma.contact.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'id', 'name', 'email', 'phone', 'company', 'jobProfile',
    'platform', 'profileLink', 'status', 'responseStatus', 'priority',
    'tags', 'notes', 'followUpDate', 'lastContactedAt', 'createdAt',
  ];

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) return `"${v.join(',')}"`;
    if (v instanceof Date) return v.toISOString();
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = contacts.map(c =>
    headers.map(h => escape(c[h as keyof typeof c])).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="contacts.csv"',
    },
  });
}