export type EventType = 'hackathon' | 'workshop' | 'summit' | 'conference';

export interface Event {
  id: string;
  title: string;
  org: string | null;
  type: EventType;
  location: string | null;
  is_free: boolean;
  application_deadline: string | null; // ISO date string
  event_date: string | null;           // ISO date string
  description: string | null;
  apply_url: string | null;
  source_url: string | null;
  tags: string[];
  why_read: string | null;             // AI-generated one-liner
  is_manually_added: boolean;
  is_active: boolean;
  scraped_at: string;
  created_at: string;
}

export interface SavedEvent {
  id: string;
  user_id: string;
  event_id: string;
  saved_at: string;
  event?: Event;
}

export type EventFilter = 'all' | 'hackathon' | 'workshop' | 'summit' | 'conference' | 'free';

export interface EventsQueryParams {
  type?: EventType | 'all';
  free_only?: boolean;
  location?: string;
  search?: string;
  sort?: 'deadline' | 'date' | 'created';
  page?: number;
  limit?: number;
}
