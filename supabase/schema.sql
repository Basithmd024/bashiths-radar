-- ============================================================
-- Basith's Radar — Supabase PostgreSQL Schema (WhatsApp-First Update)
-- ============================================================

-- ── 1. User Profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_number        TEXT, -- Encrypted at rest
  whatsapp_opted_in      BOOLEAN DEFAULT true,
  notifications_paused   BOOLEAN DEFAULT false,
  morning_digest_enabled BOOLEAN DEFAULT true,
  evening_digest_enabled BOOLEAN DEFAULT true,
  reminder_7d            BOOLEAN DEFAULT true,
  reminder_3d            BOOLEAN DEFAULT true,
  reminder_1d            BOOLEAN DEFAULT true,
  reminder_deadline_day  BOOLEAN DEFAULT true,
  reminder_event_day     BOOLEAN DEFAULT true,
  location_prefs         TEXT[]  DEFAULT ARRAY['hyderabad','pan-india','online'],
  type_prefs             TEXT[]  DEFAULT ARRAY['hackathon','workshop','summit','conference','residency','competition'],
  free_only              BOOLEAN DEFAULT false,
  digest_source_prefs    TEXT[]  DEFAULT ARRAY['Anthropic News','OpenAI Blog','TechCrunch AI','Hacker News','Product Hunt AI','AI Snake Oil'],
  google_calendar_token  JSONB,
  last_morning_digest_at TIMESTAMPTZ,
  last_evening_digest_at TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  org                  TEXT,
  type                 TEXT CHECK (type IN ('hackathon','workshop','summit','conference','residency','competition')),
  location             TEXT,
  is_free              BOOLEAN DEFAULT true,
  application_deadline DATE,
  event_date           DATE,
  description          TEXT,
  apply_url            TEXT,
  source_url           TEXT,
  tags                 TEXT[],
  why_read             TEXT, -- AI-generated one-line reason (<15 words)
  is_manually_added    BOOLEAN DEFAULT false,
  is_active            BOOLEAN DEFAULT true,
  scraped_at           TIMESTAMPTZ DEFAULT NOW(),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. User Saved Events ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_saved_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id   UUID REFERENCES events(id) ON DELETE CASCADE,
  is_applied BOOLEAN DEFAULT false,
  saved_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- ── 4. Reminders Queue ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_id    UUID REFERENCES events(id) ON DELETE CASCADE,
  send_at     TIMESTAMPTZ NOT NULL,
  type        TEXT CHECK (type IN ('7day','3day','1day','deadline_day','event_day','morning_digest','evening_digest')),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled')),
  sent_at     TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  error_msg   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Digest Items ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS digest_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  url          TEXT UNIQUE NOT NULL,
  source       TEXT,
  tag          TEXT CHECK (tag IN ('breaking','launch','update','research')),
  one_line     TEXT,
  priority     INTEGER CHECK (priority BETWEEN 1 AND 5),
  published_at TIMESTAMPTZ,
  fetched_at   TIMESTAMPTZ DEFAULT NOW(),
  is_active    BOOLEAN DEFAULT true
);

-- ── 6. User Dismissed Digest ─────────────────────────────────
CREATE TABLE IF NOT EXISTS user_dismissed_digest (
  user_id   UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  digest_id UUID REFERENCES digest_items(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, digest_id)
);

-- ── 7. WhatsApp Context & Command History ─────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  direction   TEXT CHECK (direction IN ('inbound','outbound')),
  message_type TEXT, -- 'morning_digest', 'evening_digest', 'urgent_reminder', 'user_command', 'command_reply'
  body        TEXT NOT NULL,
  event_ids   UUID[], -- References event IDs in order (1, 2, 3...) for SAVE 1 / DONE 1 commands
  article_ids UUID[],
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_events_deadline    ON events(application_deadline);
CREATE INDEX IF NOT EXISTS idx_events_event_date  ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type        ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_is_active   ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_reminders_send_at  ON reminders(send_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status   ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_digest_priority    ON digest_items(priority DESC);
CREATE INDEX IF NOT EXISTS idx_digest_fetched_at  ON digest_items(fetched_at);
CREATE INDEX IF NOT EXISTS idx_wa_user_created    ON whatsapp_messages(user_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON events FOR SELECT USING (is_active = true);

ALTER TABLE user_saved_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_events_select" ON user_saved_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_events_insert" ON user_saved_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_events_update" ON user_saved_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "saved_events_delete" ON user_saved_events FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminders_select" ON reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert" ON reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_delete" ON reminders FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE digest_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "digest_authenticated_read" ON digest_items FOR SELECT TO authenticated USING (is_active = true);

ALTER TABLE user_dismissed_digest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dismissed_select" ON user_dismissed_digest FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dismissed_insert" ON user_dismissed_digest FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dismissed_delete" ON user_dismissed_digest FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_messages_select" ON whatsapp_messages FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
