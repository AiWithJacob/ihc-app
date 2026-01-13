-- ============================================
-- SYSTEM AUDIT LOG + SYSTEM PAMIĘCI
-- Faza 2: Pełna historia zmian
-- ============================================

-- 1. Tabela users - centralne przechowywanie użytkowników
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  login TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  chiropractor TEXT,
  chiropractor_image TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeksy dla users
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_chiropractor ON users(chiropractor);

-- 2. Tabela bookings - rezerwacje
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
  chiropractor TEXT NOT NULL,
  date DATE NOT NULL,
  time_from TIME NOT NULL,
  time_to TIME,
  name TEXT,
  description TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  google_calendar_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeksy dla bookings
CREATE INDEX IF NOT EXISTS idx_bookings_chiropractor ON bookings(chiropractor);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_google_event_id ON bookings(google_calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- 3. Tabela audit_logs - główna tabela historii zmian
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identyfikacja rekordu
  table_name TEXT NOT NULL,
  record_id BIGINT NOT NULL,
  
  -- Typ operacji
  action TEXT NOT NULL,
  
  -- Dane zmian
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  
  -- Kontekst użytkownika
  user_id BIGINT,
  user_login TEXT,
  user_email TEXT,
  chiropractor TEXT,
  
  -- Kontekst techniczny
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Metadane
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeksy dla audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_chiropractor ON audit_logs(chiropractor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_created ON audit_logs(table_name, created_at DESC);

-- Indeksy GIN dla wyszukiwania w JSONB
CREATE INDEX IF NOT EXISTS idx_audit_logs_old_data_gin ON audit_logs USING GIN (old_data);
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_data_gin ON audit_logs USING GIN (new_data);

-- 4. Funkcja pomocnicza do wykrywania zmienionych pól
CREATE OR REPLACE FUNCTION get_changed_fields(old_data JSONB, new_data JSONB)
RETURNS TEXT[] AS $$
DECLARE
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  key TEXT;
BEGIN
  -- Dla UPDATE: znajdź wszystkie zmienione pola
  IF old_data IS NOT NULL AND new_data IS NOT NULL THEN
    FOR key IN SELECT jsonb_object_keys(new_data)
    LOOP
      IF old_data->>key IS DISTINCT FROM new_data->>key THEN
        changed_fields := array_append(changed_fields, key);
      END IF;
    END LOOP;
  END IF;
  
  RETURN changed_fields;
END;
$$ LANGUAGE plpgsql;

-- 5. Funkcja do ustawiania kontekstu użytkownika
CREATE OR REPLACE FUNCTION set_user_context(
  p_user_id BIGINT,
  p_user_login TEXT,
  p_user_email TEXT,
  p_chiropractor TEXT,
  p_source TEXT DEFAULT 'ui',
  p_session_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.user_context', jsonb_build_object(
    'id', p_user_id,
    'login', p_user_login,
    'email', p_user_email,
    'chiropractor', p_chiropractor,
    'source', p_source,
    'session_id', p_session_id
  )::TEXT, false);
  
  IF p_ip_address IS NOT NULL THEN
    PERFORM set_config('app.ip_address', p_ip_address, false);
  END IF;
  
  IF p_user_agent IS NOT NULL THEN
    PERFORM set_config('app.user_agent', p_user_agent, false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Główna funkcja do logowania zmian
CREATE OR REPLACE FUNCTION log_audit_change()
RETURNS TRIGGER AS $$
DECLARE
  user_context JSONB;
  changed_fields TEXT[];
BEGIN
  -- Pobierz kontekst użytkownika z current_setting
  user_context := COALESCE(
    current_setting('app.user_context', true)::JSONB,
    '{}'::JSONB
  );
  
  -- Dla UPDATE: znajdź zmienione pola
  IF TG_OP = 'UPDATE' THEN
    changed_fields := get_changed_fields(
      row_to_json(OLD)::JSONB, 
      row_to_json(NEW)::JSONB
    );
  END IF;
  
  -- Wstaw rekord do audit_logs
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_fields,
    user_id,
    user_login,
    user_email,
    chiropractor,
    ip_address,
    user_agent,
    session_id,
    metadata
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE((NEW).id, (OLD).id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW)::JSONB 
         WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW)::JSONB 
         ELSE NULL END,
    changed_fields,
    (user_context->>'id')::BIGINT,
    user_context->>'login',
    user_context->>'email',
    user_context->>'chiropractor',
    NULLIF(current_setting('app.ip_address', true), '')::INET,
    NULLIF(current_setting('app.user_agent', true), ''),
    user_context->>'session_id',
    jsonb_build_object(
      'source', COALESCE(user_context->>'source', 'database'),
      'session_id', user_context->>'session_id'
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 7. Triggery dla tabeli leads
DROP TRIGGER IF EXISTS leads_audit_trigger ON leads;
CREATE TRIGGER leads_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- 8. Triggery dla tabeli bookings
DROP TRIGGER IF EXISTS bookings_audit_trigger ON bookings;
CREATE TRIGGER bookings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- 9. Triggery dla tabeli users (opcjonalnie)
DROP TRIGGER IF EXISTS users_audit_trigger ON users;
CREATE TRIGGER users_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_change();

-- 10. RLS Policies dla audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Użytkownicy mogą przeglądać tylko logi dla swojego chiropraktyka
DROP POLICY IF EXISTS "Users can view audit logs for their chiropractor" ON audit_logs;
CREATE POLICY "Users can view audit logs for their chiropractor"
  ON audit_logs FOR SELECT
  USING (
    chiropractor = COALESCE(
      current_setting('app.user_context', true)::JSONB->>'chiropractor',
      ''
    )
  );

-- 11. Funkcja pomocnicza do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery dla updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 12. Komentarze do dokumentacji
COMMENT ON TABLE audit_logs IS 'Tabela przechowująca pełną historię zmian w systemie';
COMMENT ON TABLE users IS 'Centralne przechowywanie użytkowników systemu';
COMMENT ON TABLE bookings IS 'Rezerwacje wizyt dla chiropraktyków';
COMMENT ON FUNCTION set_user_context IS 'Ustawia kontekst użytkownika dla audit log';
COMMENT ON FUNCTION log_audit_change IS 'Automatycznie loguje zmiany w tabelach';
