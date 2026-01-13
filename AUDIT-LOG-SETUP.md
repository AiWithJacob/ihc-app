# 📋 Instrukcja wdrożenia systemu Audit Log

## Przegląd

System Audit Log automatycznie loguje wszystkie zmiany w tabelach `leads` i `bookings` w Supabase. Każda operacja INSERT, UPDATE, DELETE jest zapisywana z pełnym kontekstem użytkownika.

## Krok 1: Wykonaj migrację SQL w Supabase

1. Zaloguj się do Supabase: https://supabase.com
2. Otwórz swój projekt
3. Przejdź do **SQL Editor** (lewy sidebar)
4. Otwórz plik `supabase/migrations/001_audit_log_system.sql`
5. Skopiuj całą zawartość i wklej do SQL Editor
6. Kliknij **Run** (lub Ctrl+Enter)

**Lub użyj Supabase CLI:**
```bash
supabase db push
```

## Krok 2: Dodaj zmienne środowiskowe

### W Vercel (dla API endpoints):

1. Przejdź do Vercel Dashboard → Projekt → Settings → Environment Variables
2. Upewnij się, że masz:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### W aplikacji (dla frontendu):

1. Utwórz plik `.env.local` w folderze `ihc-app`:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. **WAŻNE:** Dodaj te zmienne również w Vercel:
   - Vercel Dashboard → Settings → Environment Variables
   - Dodaj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`
   - Zaznacz "Production", "Preview", "Development"

## Krok 3: Sprawdź działanie

1. **Wykonaj testową operację:**
   - Dodaj nowy lead w aplikacji
   - Zmień status leada
   - Utwórz rezerwację

2. **Sprawdź audit log:**
   - Przejdź do `/audit-log` w aplikacji
   - Powinieneś zobaczyć historię zmian

3. **Sprawdź w Supabase:**
   - Supabase Dashboard → Table Editor → `audit_logs`
   - Powinny być rekordy z operacjami

## Struktura danych

### Tabela `audit_logs`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | BIGSERIAL | ID rekordu audit log |
| `table_name` | TEXT | Nazwa tabeli ('leads', 'bookings') |
| `record_id` | BIGINT | ID rekordu w tabeli źródłowej |
| `action` | TEXT | Typ operacji ('INSERT', 'UPDATE', 'DELETE') |
| `old_data` | JSONB | Stan przed zmianą (NULL dla INSERT) |
| `new_data` | JSONB | Stan po zmianie (NULL dla DELETE) |
| `changed_fields` | TEXT[] | Lista zmienionych pól (dla UPDATE) |
| `user_id` | BIGINT | ID użytkownika |
| `user_login` | TEXT | Login użytkownika |
| `user_email` | TEXT | Email użytkownika |
| `chiropractor` | TEXT | Chiropraktyk |
| `ip_address` | INET | IP użytkownika |
| `user_agent` | TEXT | User agent przeglądarki |
| `session_id` | TEXT | ID sesji |
| `metadata` | JSONB | Dodatkowe metadane |
| `created_at` | TIMESTAMPTZ | Data i czas zmiany |

## Jak działa system

1. **Automatyczne logowanie:**
   - Triggery w Supabase automatycznie logują wszystkie zmiany
   - Nie wymaga modyfikacji kodu aplikacji

2. **Kontekst użytkownika:**
   - Przed operacją na bazie ustawiany jest kontekst użytkownika
   - Kontekst jest przekazywany przez `current_setting` w PostgreSQL
   - Trigger automatycznie używa kontekstu do wypełnienia pól użytkownika

3. **Źródła zmian:**
   - `ui` - zmiany z interfejsu użytkownika
   - `api` - zmiany przez API endpoints
   - `webhook` - zmiany z webhooków (Zapier/Make)
   - `database` - zmiany bezpośrednio w bazie (bez kontekstu)

## Rozwiązywanie problemów

### Brak logów w audit_logs

1. **Sprawdź czy triggery są utworzone:**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%audit%';
   ```

2. **Sprawdź czy funkcja działa:**
   ```sql
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
   ```

3. **Sprawdź logi w Supabase:**
   - Supabase Dashboard → Logs
   - Szukaj błędów związanych z triggerami

### Brak informacji o użytkowniku w logach

1. **Sprawdź czy kontekst jest ustawiany:**
   - W aplikacji: sprawdź konsolę przeglądarki (F12)
   - W API: sprawdź logi Vercel

2. **Sprawdź zmienne środowiskowe:**
   - `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` muszą być ustawione

### Błędy RLS (Row Level Security)

1. **Sprawdź policy dla audit_logs:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'audit_logs';
   ```

2. **Jeśli potrzebujesz, wyłącz RLS (tylko dla testów):**
   ```sql
   ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
   ```

## Następne kroki

Po wdrożeniu audit log:
1. ✅ Wszystkie zmiany są automatycznie logowane
2. ✅ Możesz przeglądać historię w UI (`/audit-log`)
3. ✅ Możesz analizować zmiany w Supabase
4. ✅ System jest gotowy do rozbudowy (Google Calendar, SMS, Email)

## Przydatne zapytania SQL

### Pobierz ostatnie 100 zmian
```sql
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 100;
```

### Pobierz zmiany dla konkretnego leada
```sql
SELECT * FROM audit_logs 
WHERE table_name = 'leads' 
AND record_id = 123
ORDER BY created_at DESC;
```

### Pobierz zmiany użytkownika
```sql
SELECT * FROM audit_logs 
WHERE user_login = 'jan_kowalski'
ORDER BY created_at DESC;
```

### Pobierz wszystkie UPDATE z listą zmienionych pól
```sql
SELECT 
  id,
  table_name,
  record_id,
  user_login,
  changed_fields,
  created_at
FROM audit_logs 
WHERE action = 'UPDATE'
AND changed_fields IS NOT NULL
ORDER BY created_at DESC;
```
