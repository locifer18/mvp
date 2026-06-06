export type Status =
  | 'NEW' | 'CONTACTED' | 'AWAITING_RESPONSE' | 'REPLIED'
  | 'INTERVIEW_SCHEDULED' | 'OFFER_RECEIVED' | 'WON' | 'LOST';

export type ResponseStatus = 'NO_REPLY' | 'REPLIED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ActivityType =
  | 'CONTACT_CREATED' | 'MESSAGE_SENT' | 'STATUS_UPDATED'
  | 'FOLLOW_UP_SCHEDULED' | 'INTERVIEW_SCHEDULED' | 'OFFER_RECEIVED' | 'NOTE_ADDED';

export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  jobProfile?: string | null;
  platform?: string | null;
  profileLink?: string | null;
  status: Status;
  responseStatus: ResponseStatus;
  priority: Priority;
  tags: string[];
  notes?: string | null;
  followUpDate?: string | null;
  followUpCount: number;
  lastContactedAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  contactId: string;
  type: ActivityType;
  description: string;
  createdAt: string;
}
