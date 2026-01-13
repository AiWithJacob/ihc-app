# 📦 Instrukcja wdrożenia systemu backupu i konsoli diagnostycznej

## 🎯 Co zostało zaimplementowane

### 1. ✅ Konsola diagnostyczna (Standalone HTML)
**Plik:** `audit-log-diagnostics.html`

Niezależne narzędzie do:
- Przeglądania historii zmian (audit logs)
- Przeglądania leadów i rezerwacji
- Eksportu danych do CSV/JSON
- Diagnostyki systemu
- Działa bezpośrednio z Supabase (nie wymaga głównej aplikacji)

### 2. ✅ Automatyczny backup (Supabase Edge Function)
**Plik:** `supabase/functions/daily-backup/index.ts`

Automatyczny codzienny backup:
- `audit_logs` - wszystkie zmiany z ostatnich 24h
- `leads` - wszystkie leady z ostatnich 24h
- `bookings` - wszystkie rezerwacje z ostatnich 24h

## 📝 Krok po kroku - co dalej zrobić

### KROK 1: Skopiuj konsolę diagnostyczną w bezpieczne miejsce

1. **Znajdź plik:** `ihc-app/audit-log-diagnostics.html`
2. **Skopiuj go do:**
   - Dropbox (zalecane)
   - Google Drive
   - Lokalny dysk (z backupem)
   - Inne bezpieczne miejsce

3. **Zapisz dane dostępowe:**
   - Supabase URL
   - Supabase Anon Key
   - Nazwy chiropraktyków

**Dlaczego?** Jeśli główna aplikacja się zepsuje, będziesz mógł otworzyć ten plik w przeglądarce i mieć dostęp do wszystkich danych.

### KROK 2: Skonfiguruj Supabase Storage (dla backupu)

1. **Zaloguj się do Supabase:** https://supabase.com
2. **Otwórz swój projekt**
3. **Przejdź do Storage** (lewy sidebar)
4. **Kliknij "Create bucket"**
5. **Wypełnij:**
   - Name: `ihc-backups`
   - Public: **NO** (prywatny)
6. **Kliknij "Create bucket"**

**Lub użyj SQL:**
```sql
-- W Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ihc-backups', 'ihc-backups', false)
ON CONFLICT (id) DO NOTHING;
```

### KROK 3: Wdróż Edge Function do backupu

**Opcja A: Przez Supabase Dashboard (najprostsze)**

1. **Przejdź do:** Supabase Dashboard → Edge Functions
2. **Kliknij:** "Create a new function"
3. **Nazwa:** `daily-backup`
4. **Skopiuj zawartość** z pliku `supabase/functions/daily-backup/index.ts`
5. **Wklej do edytora** w Supabase
6. **Kliknij:** "Deploy"

**Opcja B: Przez Supabase CLI**

```bash
# Zainstaluj Supabase CLI (jeśli nie masz)
npm install -g supabase

# Zaloguj się
supabase login

# Połącz z projektem (znajdź PROJECT_REF w URL Supabase)
supabase link --project-ref YOUR_PROJECT_REF

# Wdróż funkcję
cd ihc-app
supabase functions deploy daily-backup
```

### KROK 4: Ustaw Secrets w Supabase

1. **Przejdź do:** Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. **Dodaj następujące secrets:**

```
BACKUP_STORAGE_TYPE=supabase
BACKUP_BUCKET=ihc-backups
BACKUP_MODE=full
```

**Wyjaśnienie:**
- `BACKUP_STORAGE_TYPE=supabase` - używa Supabase Storage (najprostsze)
- `BACKUP_BUCKET=ihc-backups` - nazwa bucketu w Supabase Storage
- `BACKUP_MODE=full` - pełny backup wszystkich danych (lub `incremental` dla tylko ostatnich 24h)

> **Uwaga:** Funkcja backupu obsługuje również Google Drive i Dropbox, ale dla uproszczenia zalecamy użycie Supabase Storage (działa od razu, bez dodatkowej konfiguracji OAuth).

### KROK 5: Zaplanuj automatyczne uruchamianie

**Opcja A: Przez Supabase Cron (zalecane)**

1. **Przejdź do:** Supabase Dashboard → Database → Cron Jobs
2. **Kliknij:** "Create a new cron job"
3. **Wypełnij:**
   - Name: `daily-backup-job`
   - Schedule: `0 2 * * *` (codziennie o 2:00 UTC = 3:00/4:00 czasu polskiego)
   - SQL Command:
   ```sql
   SELECT
     net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-backup',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
         'Content-Type', 'application/json'
       ),
       body := '{}'::jsonb
     ) AS request_id;
   ```
   (Zamień `YOUR_PROJECT_REF` na swój Project Reference z URL Supabase)

**Opcja B: Przez zewnętrzny cron (np. cron-job.org)**

1. Zarejestruj się na https://cron-job.org
2. Utwórz nowy cron job:
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-backup`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
   - Schedule: Codziennie o 2:00 UTC

### KROK 6: Przetestuj backup

**Ręczne wywołanie (test):**

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-backup \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Lub użyj Postman/Insomnia:**
- Method: POST
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-backup`
- Headers:
  - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
  - `Content-Type: application/json`

**Sprawdź wynik:**
- Powinieneś otrzymać JSON z informacją o backupie
- Sprawdź w Supabase Storage → `ihc-backups` → `full/` (lub `daily/` dla incremental) czy pojawiły się pliki
- Powinny być dwa pliki: `ihc_backup_full_YYYY-MM-DD.json` i `ihc_backup_full_YYYY-MM-DD.csv`

### KROK 7: Przetestuj konsolę diagnostyczną

1. **Otwórz plik:** `audit-log-diagnostics.html` w przeglądarce
2. **Wprowadź:**
   - Supabase URL (z Supabase Dashboard → Settings → API)
   - Supabase Anon Key (z Supabase Dashboard → Settings → API)
   - Nazwę chiropraktyka (np. "Kamil")
3. **Kliknij:** "Połącz z Supabase"
4. **Sprawdź czy działa:**
   - Przejdź do zakładki "Przegląd" - powinny być statystyki
   - Przejdź do "Historia zmian" - powinny być logi
   - Przejdź do "Diagnostyka" - uruchom testy

## 📍 Gdzie co jest zapisane

### Konsola diagnostyczna
- **Lokalizacja:** `ihc-app/audit-log-diagnostics.html`
- **Gdzie skopiować:** Dropbox/Google Drive/lokalny dysk
- **Jak używać:** Otwórz w przeglądarce, wprowadź dane Supabase

### Edge Function (backup)
- **Lokalizacja:** `supabase/functions/daily-backup/index.ts`
- **Gdzie wdrożyć:** Supabase Dashboard → Edge Functions
- **Dokumentacja:** `supabase/functions/daily-backup/README.md`

### Backupy (pliki)
- **Supabase Storage:** `ihc-backups/full/ihc_backup_full_YYYY-MM-DD.json` (pełny backup)
- **Supabase Storage:** `ihc-backups/daily/ihc_backup_daily_YYYY-MM-DD.json` (backup przyrostowy)

## 🔍 Jak sprawdzić czy wszystko działa

### Konsola diagnostyczna
1. Otwórz plik w przeglądarce
2. Połącz z Supabase
3. Sprawdź zakładkę "Diagnostyka" - wszystkie testy powinny być zielone

### Automatyczny backup
1. Sprawdź logi: Supabase Dashboard → Edge Functions → `daily-backup` → Logs
2. Sprawdź storage: Supabase Dashboard → Storage → `ihc-backups` → `full/` (lub `daily/` dla incremental)
3. Powinny być pliki `ihc_backup_full_YYYY-MM-DD.json` i `ihc_backup_full_YYYY-MM-DD.csv`

## 🆘 Rozwiązywanie problemów

### Konsola diagnostyczna nie łączy się
- Sprawdź czy Supabase URL i Anon Key są poprawne
- Sprawdź czy w Supabase są włączone CORS dla Twojej domeny
- Sprawdź konsolę przeglądarki (F12) - mogą być błędy

### Backup nie działa
- Sprawdź czy Edge Function jest wdrożona
- Sprawdź czy Secrets są ustawione
- Sprawdź logi Edge Functions w Supabase Dashboard
- Sprawdź czy bucket `ihc-backups` istnieje

### Cron job nie uruchamia się
- Sprawdź czy cron job jest aktywny w Supabase
- Sprawdź czy SQL command jest poprawny
- Sprawdź czy Project Reference w URL jest poprawny

## 📚 Dodatkowe informacje

- **Dokumentacja backupu:** `supabase/functions/daily-backup/README.md`
- **Instrukcja audit log:** `AUDIT-LOG-SETUP.md`
- **Podsumowanie implementacji:** `IMPLEMENTATION-SUMMARY.md`

## ✅ Checklist wdrożenia

- [ ] Skopiowałem `audit-log-diagnostics.html` w bezpieczne miejsce
- [ ] Utworzyłem bucket `ihc-backups` w Supabase Storage
- [ ] Wdrożyłem Edge Function `daily-backup`
- [ ] Ustawiłem Secrets w Supabase
- [ ] Zaplanowałem cron job dla automatycznego backupu
- [ ] Przetestowałem ręczne wywołanie backupu
- [ ] Sprawdziłem czy pliki backupu pojawiają się w storage
- [ ] Przetestowałem konsolę diagnostyczną
- [ ] Zapisałem dane dostępowe w bezpiecznym miejscu

**Gotowe! 🎉**
