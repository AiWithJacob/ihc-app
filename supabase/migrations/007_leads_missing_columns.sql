-- Dopasowanie tabeli leads do API (name, notes, status, chiropractor, source, created_at)
-- Twoja tabela ma: last_name, note – API wymaga: name, notes, status, chiropractor, source, created_at
-- Uruchom w Supabase: SQL Editor → wklej → Run

-- Kolumny wymagane przez API
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Nowy kontakt';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS chiropractor TEXT DEFAULT 'default';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Uzupełnij istniejące wiersze
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='last_name') THEN
    UPDATE leads SET name = COALESCE(last_name, '') WHERE name IS NULL AND last_name IS NOT NULL;
  END IF;
END $$;
UPDATE leads SET name = '' WHERE name IS NULL;
UPDATE leads SET status = 'Nowy kontakt' WHERE status IS NULL;
UPDATE leads SET chiropractor = 'default' WHERE chiropractor IS NULL;
UPDATE leads SET source = 'manual' WHERE source IS NULL;
UPDATE leads SET created_at = COALESCE(created_at, NOW()) WHERE created_at IS NULL;

-- notes z note (tylko jeśli kolumna note istnieje)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='leads' AND column_name='note') THEN
    UPDATE leads SET notes = note WHERE notes IS NULL AND note IS NOT NULL;
  END IF;
END $$;
