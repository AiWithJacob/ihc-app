-- ============================================
-- DODANIE ŚLEDZENIA UŻYTKOWNIKÓW W BOOKINGS
-- Dodaje kolumny pokazujące kto i kiedy utworzył/zaktualizował rezerwację
-- ============================================

-- 1. Dodaj kolumny do tabeli bookings
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT,
  ADD COLUMN IF NOT EXISTS created_by_user_login TEXT,
  ADD COLUMN IF NOT EXISTS created_by_user_email TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_user_id BIGINT,
  ADD COLUMN IF NOT EXISTS updated_by_user_login TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_user_email TEXT;

-- 2. Dodaj komentarze do kolumn (dla dokumentacji)
COMMENT ON COLUMN bookings.created_by_user_id IS 'ID użytkownika, który utworzył rezerwację';
COMMENT ON COLUMN bookings.created_by_user_login IS 'Login użytkownika, który utworzył rezerwację';
COMMENT ON COLUMN bookings.created_by_user_email IS 'Email użytkownika, który utworzył rezerwację';
COMMENT ON COLUMN bookings.updated_by_user_id IS 'ID użytkownika, który ostatnio zaktualizował rezerwację';
COMMENT ON COLUMN bookings.updated_by_user_login IS 'Login użytkownika, który ostatnio zaktualizował rezerwację';
COMMENT ON COLUMN bookings.updated_by_user_email IS 'Email użytkownika, który ostatnio zaktualizował rezerwację';

-- 3. Utwórz funkcję do automatycznego ustawiania użytkownika podczas INSERT/UPDATE
CREATE OR REPLACE FUNCTION set_booking_user_context()
RETURNS TRIGGER AS $$
DECLARE
  user_context JSONB;
BEGIN
  -- Pobierz kontekst użytkownika z current_setting
  user_context := COALESCE(
    current_setting('app.user_context', true)::JSONB,
    '{}'::JSONB
  );
  
  -- Dla INSERT: ustaw created_by
  IF TG_OP = 'INSERT' THEN
    NEW.created_by_user_id := (user_context->>'id')::BIGINT;
    NEW.created_by_user_login := user_context->>'login';
    NEW.created_by_user_email := user_context->>'email';
    -- Dla nowych rekordów, updated_by = created_by
    NEW.updated_by_user_id := (user_context->>'id')::BIGINT;
    NEW.updated_by_user_login := user_context->>'login';
    NEW.updated_by_user_email := user_context->>'email';
  END IF;
  
  -- Dla UPDATE: ustaw updated_by (nie zmieniaj created_by)
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by_user_id := (user_context->>'id')::BIGINT;
    NEW.updated_by_user_login := user_context->>'login';
    NEW.updated_by_user_email := user_context->>'email';
    -- Zachowaj created_by z OLD
    NEW.created_by_user_id := OLD.created_by_user_id;
    NEW.created_by_user_login := OLD.created_by_user_login;
    NEW.created_by_user_email := OLD.created_by_user_email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Utwórz trigger, który automatycznie ustawia użytkownika
DROP TRIGGER IF EXISTS set_booking_user_context_trigger ON bookings;
CREATE TRIGGER set_booking_user_context_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_user_context();

-- 5. Zaktualizuj istniejące rezerwacje - ustaw użytkownika na podstawie audit_logs
-- (tylko dla rezerwacji, które mają logi INSERT w audit_logs)
UPDATE bookings b
SET 
  created_by_user_id = al.user_id,
  created_by_user_login = al.user_login,
  created_by_user_email = al.user_email,
  updated_by_user_id = COALESCE(
    (SELECT al2.user_id FROM audit_logs al2 
     WHERE al2.table_name = 'bookings' 
     AND al2.record_id = b.id 
     AND al2.action = 'UPDATE' 
     ORDER BY al2.created_at DESC 
     LIMIT 1),
    al.user_id
  ),
  updated_by_user_login = COALESCE(
    (SELECT al2.user_login FROM audit_logs al2 
     WHERE al2.table_name = 'bookings' 
     AND al2.record_id = b.id 
     AND al2.action = 'UPDATE' 
     ORDER BY al2.created_at DESC 
     LIMIT 1),
    al.user_login
  ),
  updated_by_user_email = COALESCE(
    (SELECT al2.user_email FROM audit_logs al2 
     WHERE al2.table_name = 'bookings' 
     AND al2.record_id = b.id 
     AND al2.action = 'UPDATE' 
     ORDER BY al2.created_at DESC 
     LIMIT 1),
    al.user_email
  )
FROM audit_logs al
WHERE al.table_name = 'bookings'
  AND al.record_id = b.id
  AND al.action = 'INSERT'
  AND (b.created_by_user_id IS NULL OR b.created_by_user_login IS NULL);

-- 6. Sprawdź wyniki
SELECT 
  'Zaktualizowane rezerwacje:' as info,
  COUNT(*) as liczba 
FROM bookings 
WHERE created_by_user_login IS NOT NULL;

SELECT 
  'Rezerwacje bez użytkownika:' as info,
  COUNT(*) as liczba 
FROM bookings 
WHERE created_by_user_login IS NULL;

-- 7. Przykładowe zapytanie - pokaż rezerwacje z informacjami o użytkownikach
SELECT 
  id,
  name,
  date,
  time_from,
  chiropractor,
  created_by_user_login as utworzone_przez,
  created_at as utworzone_kiedy,
  updated_by_user_login as zaktualizowane_przez,
  updated_at as zaktualizowane_kiedy
FROM bookings
ORDER BY created_at DESC
LIMIT 10;
