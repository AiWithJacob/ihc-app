-- Migracja: Tabela do przechowywania Google Calendar refresh tokens
-- Umożliwia przechowywanie refresh tokens dla każdego chiropraktyka

-- Tabela google_calendar_tokens
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  chiropractor TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chiropractor)
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_gc_tokens_user_id ON google_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_gc_tokens_chiropractor ON google_calendar_tokens(chiropractor);

-- Opcjonalnie: Dodaj kolumny do tabeli users (backward compatibility)
-- Jeśli wolisz przechowywać w tabeli users zamiast osobnej tabeli
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_calendar_calendar_id TEXT DEFAULT 'primary';

-- Komentarze
COMMENT ON TABLE google_calendar_tokens IS 'Przechowuje Google Calendar refresh tokens dla każdego chiropraktyka';
COMMENT ON COLUMN google_calendar_tokens.refresh_token IS 'Google OAuth 2.0 refresh token';
COMMENT ON COLUMN google_calendar_tokens.calendar_id IS 'ID kalendarza Google (domyślnie "primary")';
