import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

const DAILY_LIMIT = 50;

export const DEFAULT_SUBJECT = 'Software Developer Application';
export const DEFAULT_TEMPLATE = `Hi [First Name],

Hope you're doing well.

I know you probably receive many emails daily, so I'll keep this brief.

I've 1 years of experience in Software Development, and I'm actively looking for opportunities as a Software Engineer.

A quick snapshot of my profile:
• Built an enterprise Employee Management System using Next.js, Node.js, TypeScript, and PostgreSQL, featuring biometric attendance, RBAC, WebSockets, and over 60 database models.
• Developed scalable backend systems with REST APIs, Prisma ORM, WebSockets, AI integrations, secure authentication, and payment gateway integrations.
• Actively contribute to open source projects via GitHub repositories.

I'm reaching out in case there's a suitable opening within your organization, either now or in the near future. If you feel my profile could be a good fit, I'd be grateful if you could consider my application.

I've attached my resume for your reference.

Thank you for your time. I truly appreciate it, and I hope to hear from you if there's an opportunity that matches my background.

Best Regards,
Ansh Rajveer
+91 6268844871
Portfolio: https://ansh-s-portfolio-six.vercel.app/
GitHub: https://github.com/locifer18`;

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function getTodaySentCount() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.mailLog.count({ where: { sentAt: { gte: start } } });
}

export async function GET() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const sentToday = await prisma.mailLog.count({ where: { sentAt: { gte: start } } });
  const logs = await prisma.mailLog.findMany({
    orderBy: { sentAt: 'desc' },
    take: 100,
    include: { contact: { select: { name: true, company: true } } },
  });
  return NextResponse.json({ sentToday, remaining: DAILY_LIMIT - sentToday, limit: DAILY_LIMIT, logs });
}

export async function POST(req: NextRequest) {
  const { contacts, subject, template } = await req.json() as {
    contacts: { id: string; name: string; email: string }[];
    subject?: string;
    template?: string;
  };

  if (!contacts?.length)
    return NextResponse.json({ error: 'No contacts provided' }, { status: 400 });

  const todayCount = await getTodaySentCount();
  const remaining = DAILY_LIMIT - todayCount;

  if (remaining <= 0)
    return NextResponse.json({ error: `Daily limit of ${DAILY_LIMIT} reached. Try again tomorrow.` }, { status: 429 });

  const toSend = contacts.slice(0, remaining);
  const skipped = contacts.length - toSend.length;
  const transporter = getTransporter();
  const results: { id: string; name: string; success: boolean; error?: string }[] = [];

  for (const c of toSend) {
    const firstName = c.name.trim().split(' ')[0];
    const finalSubject = (subject || DEFAULT_SUBJECT).replace(/\[First Name\]/gi, firstName);
    const finalBody = (template || DEFAULT_TEMPLATE).replace(/\[First Name\]/gi, firstName);

    try {
      await transporter.sendMail({
        from: `Ansh Rajveer <${process.env.GMAIL_USER}>`,
        to: c.email,
        subject: finalSubject,
        text: finalBody,
      });
      await prisma.mailLog.create({
        data: { contactId: c.id, toEmail: c.email, toName: c.name, subject: finalSubject },
      });
      results.push({ id: c.id, name: c.name, success: true });
    } catch (err) {
      results.push({ id: c.id, name: c.name, success: false, error: err instanceof Error ? err.message : 'Failed' });
    }
  }

  const sent = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  return NextResponse.json({ sent, failed, skipped, results, remainingToday: remaining - sent });
}
