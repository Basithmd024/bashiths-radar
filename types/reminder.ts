export type ReminderType =
  | '7day'
  | '3day'
  | '1day'
  | 'deadline_day'
  | 'event_day'
  | 'morning_digest'
  | 'evening_digest';

export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface Reminder {
  id: string;
  user_id: string;
  event_id?: string | null;
  send_at: string; // ISO timestamp
  type: ReminderType;
  status: ReminderStatus;
  sent_at: string | null;
  error_msg: string | null;
  created_at: string;
}
