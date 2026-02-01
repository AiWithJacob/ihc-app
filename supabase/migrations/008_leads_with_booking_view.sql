-- ============================================
-- WIDOK LEADS Z INFORMACJAMI O WIZYTACH
-- Pokazuje pełne informacje o leadach wraz z danymi rezerwacji
-- ============================================

-- 1. Dodaj kolumny do leads dla szybkiego podglądu (denormalizacja)
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS last_booking_id BIGINT,
  ADD COLUMN IF NOT EXISTS last_booking_date DATE,
  ADD COLUMN IF NOT EXISTS last_booking_status TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Komentarze
COMMENT ON COLUMN leads.last_booking_id IS 'ID ostatniej rezerwacji (cache)';
COMMENT ON COLUMN leads.last_booking_date IS 'Data ostatniej rezerwacji (cache)';
COMMENT ON COLUMN leads.last_booking_status IS 'Status ostatniej rezerwacji (cache)';
COMMENT ON COLUMN leads.updated_at IS 'Data ostatniej aktualizacji leada';

-- 2. Utwórz indeks dla szybszego wyszukiwania
CREATE INDEX IF NOT EXISTS idx_leads_last_booking ON leads(last_booking_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 3. Utwórz widok łączący leads z bookings
DROP VIEW IF EXISTS leads_with_bookings;
CREATE VIEW leads_with_bookings AS
SELECT 
  l.id,
  l.name,
  l.phone,
  l.email,
  l.description,
  l.notes,
  l.status AS lead_status,
  l.chiropractor,
  l.source,
  l.created_at,
  l.updated_at,
  -- Informacje o rezerwacji
  b.id AS booking_id,
  b.date AS booking_date,
  b.time_from AS booking_time,
  b.status AS booking_status,
  b.google_calendar_event_id,
  -- Informacje o użytkownikach
  b.created_by_user_login AS booking_created_by,
  b.updated_by_user_login AS booking_updated_by,
  -- Flagi pomocnicze
  CASE 
    WHEN b.id IS NOT NULL THEN TRUE 
    ELSE FALSE 
  END AS has_booking,
  CASE 
    WHEN b.status = 'completed' THEN 'Zrealizowana'
    WHEN b.status = 'cancelled' THEN 'Anulowana'
    WHEN b.status = 'scheduled' AND b.date >= CURRENT_DATE THEN 'Zaplanowana'
    WHEN b.status = 'scheduled' AND b.date < CURRENT_DATE THEN 'Przeterminowana'
    ELSE NULL
  END AS booking_status_pl
FROM leads l
LEFT JOIN bookings b ON b.lead_id = l.id;

-- 4. Utwórz widok statystyk chiropraktyków
DROP VIEW IF EXISTS chiropractor_stats;
CREATE VIEW chiropractor_stats AS
SELECT 
  chiropractor,
  COUNT(*) AS total_leads,
  COUNT(CASE WHEN status = 'Nowy kontakt' THEN 1 END) AS new_leads,
  COUNT(CASE WHEN status = 'Umówiony' THEN 1 END) AS booked_leads,
  COUNT(CASE WHEN status = 'Nie odebrał' THEN 1 END) AS no_answer,
  COUNT(CASE WHEN status = 'Zadzwoń później' THEN 1 END) AS call_later,
  COUNT(CASE WHEN status = 'Sam się skontaktuje' THEN 1 END) AS will_contact,
  ROUND(
    COUNT(CASE WHEN status = 'Umówiony' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) AS conversion_rate
FROM leads
GROUP BY chiropractor
ORDER BY total_leads DESC;

-- 5. Utwórz widok aktywnych użytkowników (kto pracuje)
DROP VIEW IF EXISTS active_users;
CREATE VIEW active_users AS
SELECT 
  id,
  login,
  email,
  last_login_at,
  last_seen_at,
  CASE 
    WHEN last_seen_at > NOW() - INTERVAL '5 minutes' THEN 'Online'
    WHEN last_seen_at > NOW() - INTERVAL '30 minutes' THEN 'Ostatnio aktywny'
    ELSE 'Offline'
  END AS status,
  created_at
FROM app_users
ORDER BY last_seen_at DESC NULLS LAST;

-- 6. Funkcja do aktualizacji cache rezerwacji w leads
CREATE OR REPLACE FUNCTION update_lead_booking_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Aktualizuj cache w tabeli leads po zmianie bookings
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE leads 
    SET 
      last_booking_id = NEW.id,
      last_booking_date = NEW.date,
      last_booking_status = NEW.status,
      updated_at = NOW()
    WHERE id = NEW.lead_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Znajdź następną rezerwację lub wyczyść cache
    UPDATE leads 
    SET 
      last_booking_id = (
        SELECT id FROM bookings 
        WHERE lead_id = OLD.lead_id 
        ORDER BY date DESC LIMIT 1
      ),
      last_booking_date = (
        SELECT date FROM bookings 
        WHERE lead_id = OLD.lead_id 
        ORDER BY date DESC LIMIT 1
      ),
      last_booking_status = (
        SELECT status FROM bookings 
        WHERE lead_id = OLD.lead_id 
        ORDER BY date DESC LIMIT 1
      ),
      updated_at = NOW()
    WHERE id = OLD.lead_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger do automatycznej aktualizacji cache
DROP TRIGGER IF EXISTS update_lead_booking_cache_trigger ON bookings;
CREATE TRIGGER update_lead_booking_cache_trigger
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_booking_cache();

-- 8. Funkcja do aktualizacji updated_at przy zmianie leads
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at_trigger ON leads;
CREATE TRIGGER update_leads_updated_at_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- 9. Zaktualizuj istniejące leady z informacjami o rezerwacjach
UPDATE leads l
SET 
  last_booking_id = subq.booking_id,
  last_booking_date = subq.booking_date,
  last_booking_status = subq.booking_status,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (lead_id) 
    lead_id, 
    id AS booking_id, 
    date AS booking_date, 
    status AS booking_status
  FROM bookings
  WHERE lead_id IS NOT NULL
  ORDER BY lead_id, date DESC
) subq
WHERE l.id = subq.lead_id;

-- 10. Podsumowanie
SELECT 'Leady z rezerwacjami:' AS info, COUNT(*) AS liczba 
FROM leads WHERE last_booking_id IS NOT NULL;

SELECT 'Leady bez rezerwacji:' AS info, COUNT(*) AS liczba 
FROM leads WHERE last_booking_id IS NULL;

-- ============================================
-- INSTRUKCJA UŻYCIA W SUPABASE:
-- 
-- Aby zobaczyć pełne dane leadów z rezerwacjami:
--   SELECT * FROM leads_with_bookings WHERE chiropractor = 'Nazwa';
--
-- Aby zobaczyć statystyki chiropraktyków:
--   SELECT * FROM chiropractor_stats;
--
-- Aby zobaczyć aktywnych użytkowników:
--   SELECT * FROM active_users;
-- ============================================
