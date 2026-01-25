-- Tabela leads – wymagana PRZED 001_audit (bookings.lead_id -> leads.id) i triggerem leads_audit_trigger
-- Uruchom w Supabase: SQL Editor → wklej → Run

CREATE TABLE IF NOT EXISTS leads (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  description TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Nowy kontakt',
  chiropractor TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_leads_chiropractor ON leads(chiropractor);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Kolumny, gdy tabela istniała wcześniej w starej wersji (bezpieczne: IF NOT EXISTS)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS chiropractor TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

-- Domyślne wartości dla istniejących wierszy (tylko gdy kolumna właśnie dodana)
-- (Pomijamy – ADD COLUMN IF NOT EXISTS nie nadpisuje istniejących.)

-- RLS – API używa service_role (omija RLS). Dla dostępu anon/bezpośredniego:
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON leads;
CREATE POLICY "Allow all operations" ON leads FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE leads IS 'Leady (kontakty) – ręcznie i z Facebook Lead Ads.';
