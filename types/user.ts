export interface UserProfile {
  id: string;
  whatsapp_number: string | null;
  whatsapp_opted_in: boolean;
  notifications_paused: boolean;
  morning_digest_enabled: boolean;
  evening_digest_enabled: boolean;
  reminder_7d: boolean;
  reminder_3d: boolean;
  reminder_1d: boolean;
  reminder_deadline_day: boolean;
  reminder_event_day: boolean;
  reminder_dayof?: boolean; // legacy alias
  location_prefs: string[];
  type_prefs: string[];
  free_only: boolean;
  digest_source_prefs: string[];
  google_calendar_token: Record<string, unknown> | null;
  created_at: string;
}
