# 📋 Dodanie śledzenia użytkowników w tabeli bookings

## Cel
Dodanie kolumn do tabeli `bookings` w Supabase, które pokazują:
- **Kto** utworzył rezerwację (created_by_user_login, created_by_user_email)
- **Kiedy** została utworzona (created_at - już istnieje)
- **Kto** ostatnio zaktualizował rezerwację (updated_by_user_login, updated_by_user_email)
- **Kiedy** została zaktualizowana (updated_at - już istnieje)

## Instrukcja - wykonaj w Supabase SQL Editor

### Krok 1: Otwórz Supabase SQL Editor

1. Zaloguj się do https://supabase.com
2. Wybierz swój projekt
3. Przejdź do **SQL Editor**

### Krok 2: Wykonaj migrację

Skopiuj i wykonaj **CAŁĄ** zawartość pliku:
`supabase/migrations/002_add_user_tracking_to_bookings.sql`

Lub skopiuj bezpośrednio:

```sql
-- Dodaj kolumny do tabeli bookings
ALTER TABLE bookings 
  ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT,
  ADD COLUMN IF NOT EXISTS created_by_user_login TEXT,
  ADD COLUMN IF NOT EXISTS created_by_user_email TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_user_id BIGINT,
  ADD COLUMN IF NOT EXISTS updated_by_user_login TEXT,
  ADD COLUMN IF NOT EXISTS updated_by_user_email TEXT;

-- Utwórz funkcję do automatycznego ustawiania użytkownika
CREATE OR REPLACE FUNCTION set_booking_user_context()
RETURNS TRIGGER AS $$
DECLARE
  user_context JSONB;
BEGIN
  user_context := COALESCE(
    current_setting('app.user_context', true)::JSONB,
    '{}'::JSONB
  );
  
  IF TG_OP = 'INSERT' THEN
    NEW.created_by_user_id := (user_context->>'id')::BIGINT;
    NEW.created_by_user_login := user_context->>'login';
    NEW.created_by_user_email := user_context->>'email';
    NEW.updated_by_user_id := (user_context->>'id')::BIGINT;
    NEW.updated_by_user_login := user_context->>'login';
    NEW.updated_by_user_email := user_context->>'email';
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by_user_id := (user_context->>'id')::BIGINT;
    NEW.updated_by_user_login := user_context->>'login';
    NEW.updated_by_user_email := user_context->>'email';
    NEW.created_by_user_id := OLD.created_by_user_id;
    NEW.created_by_user_login := OLD.created_by_user_login;
    NEW.created_by_user_email := OLD.created_by_user_email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Utwórz trigger
DROP TRIGGER IF EXISTS set_booking_user_context_trigger ON bookings;
CREATE TRIGGER set_booking_user_context_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_user_context();

-- Zaktualizuj istniejące rezerwacje na podstawie audit_logs
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
```

### Krok 3: Sprawdź wyniki

Po wykonaniu migracji, sprawdź czy kolumny zostały dodane:

```sql
-- Sprawdź strukturę tabeli bookings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
```

Powinny pojawić się nowe kolumny:
- `created_by_user_id`
- `created_by_user_login`
- `created_by_user_email`
- `updated_by_user_id`
- `updated_by_user_login`
- `updated_by_user_email`

### Krok 4: Sprawdź dane

```sql
-- Sprawdź rezerwacje z informacjami o użytkownikach
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
```

## Jak to działa

1. **Automatycznie** - Trigger `set_booking_user_context_trigger` automatycznie ustawia użytkownika podczas INSERT/UPDATE
2. **Z kontekstu** - Używa kontekstu użytkownika ustawionego przez `set_user_context()`
3. **W Table Editor** - W Supabase Table Editor zobaczysz kolumny z informacjami o użytkownikach

## Co zobaczysz w Supabase Table Editor

Po wykonaniu migracji, w tabeli `bookings` zobaczysz:

| id | name | date | time_from | chiropractor | **created_by_user_login** | **created_at** | **updated_by_user_login** | **updated_at** |
|----|------|------|-----------|--------------|---------------------------|----------------|---------------------------|-----------------|
| 1  | Jan  | 2026-01-15 | 10:00 | Krzysztof | **wikwik1** | **2026-01-13 18:00** | **wikwik1** | **2026-01-13 19:00** |

## Test

1. Utwórz nową rezerwację w aplikacji
2. Otwórz Supabase → Table Editor → bookings
3. Sprawdź czy kolumny `created_by_user_login` i `created_by_user_email` są wypełnione
4. Zaktualizuj rezerwację (zmień datę/godzinę)
5. Sprawdź czy kolumny `updated_by_user_login` i `updated_by_user_email` zostały zaktualizowane

## Uwagi

- Stare rezerwacje (sprzed migracji) będą miały te kolumny puste lub wypełnione na podstawie audit_logs
- Nowe rezerwacje automatycznie będą miały te informacje
- Trigger działa automatycznie - nie musisz nic robić w kodzie aplikacji
