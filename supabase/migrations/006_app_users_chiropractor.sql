-- Kolumna chiropractor w app_users – przy którym chiropraktyku użytkownik pracuje (ustawiane przez heartbeat)

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS chiropractor TEXT;

CREATE INDEX IF NOT EXISTS idx_app_users_chiropractor ON app_users(chiropractor);

COMMENT ON COLUMN app_users.chiropractor IS 'Chiropraktyk, przy którym użytkownik ma otwartą aplikację (ustawiane przez /api/user-heartbeat).';
