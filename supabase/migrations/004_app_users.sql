-- Tabela app_users: konta użytkowników aplikacji (rejestracja przez /api/register)
-- Osobna od users (używanej m.in. przez Google Calendar) – unikamy konfliktów

CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_app_users_login ON app_users(login);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_last_seen ON app_users(last_seen_at DESC);

-- RLS: odczyt (bez password_hash w select) – dla konsoli admina z anon key
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read app_users" ON app_users;
CREATE POLICY "Allow anon read app_users"
  ON app_users FOR SELECT
  USING (true);

-- INSERT/UPDATE tylko przez service_role lub funkcje – anon nie może wstawiać/aktualizować
-- Rejestracja i heartbeat idą przez API (Vercel), które używa service_role lub uprawnień do insert/update.
-- Dla Supabase anon: brak policy na INSERT/UPDATE = anon nie ma dostępu.
-- API serverless wywołuje Supabase z klientem (supabase.js) – w api/supabase.js jest service_role?
-- Sprawdzam: api/supabase używa SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY. Więc API ma pełny dostęp. OK.

COMMENT ON TABLE app_users IS 'Konta użytkowników aplikacji (rejestracja). last_seen_at = ostatnia aktywność (heartbeat).';
