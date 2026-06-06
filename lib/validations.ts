import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobProfile: z.string().optional(),
  platform: z.string().optional(),
  profileLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z
    .enum(['NEW', 'CONTACTED', 'AWAITING_RESPONSE', 'REPLIED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON', 'LOST'])
    .default('NEW'),
  responseStatus: z.enum(['NO_REPLY', 'REPLIED']).default('NO_REPLY'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
  lastContactedAt: z.string().optional().nullable(),
});

export type ContactInput = z.infer<typeof contactSchema>;