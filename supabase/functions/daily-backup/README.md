# 🔄 Automatyczny backup danych

Edge Function do codziennego backupu danych z Supabase do zewnętrznego storage.

## 📋 Co jest backupowane

- **audit_logs** - wszystkie zmiany z ostatnich 24h
- **leads** - wszystkie leady z ostatnich 24h
- **bookings** - wszystkie rezerwacje z ostatnich 24h

## ⚙️ Konfiguracja

### Krok 1: Utwórz bucket w Supabase Storage

W Supabase Dashboard → Storage → Create bucket:

1. Nazwa: `ihc-backups`
2. Public: **NO** (prywatny)
3. Kliknij **Create bucket**

Lub użyj SQL:

```sql
-- W Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ihc-backups', 'ihc-backups', false)
ON CONFLICT (id) DO NOTHING;
```

### Krok 2: Ustaw Secrets w Supabase

W Supabase Dashboard → Project Settings → Edge Functions → Secrets:

**Dla Supabase Storage (domyślne, najprostsze):**
```
BACKUP_STORAGE_TYPE=supabase
BACKUP_BUCKET=ihc-backups
```

**Dla AWS S3:**
```
BACKUP_STORAGE_TYPE=s3
BACKUP_BUCKET=ihc-backups
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket-name
S3_REGION=us-east-1
```

**Dla Google Drive:**
```
BACKUP_STORAGE_TYPE=google_drive
BACKUP_BUCKET=ihc-backups
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_ACCESS_TOKEN=your_access_token
```

**Dla Dropbox:**
```
BACKUP_STORAGE_TYPE=dropbox
BACKUP_BUCKET=ihc-backups
DROPBOX_ACCESS_TOKEN=your_access_token
DROPBOX_BACKUP_PATH=/backups
```

### Krok 3: Wdróż Edge Function

**Opcja A: Przez Supabase CLI**

```bash
# Zainstaluj Supabase CLI (jeśli nie masz)
npm install -g supabase

# Zaloguj się
supabase login

# Połącz z projektem
supabase link --project-ref YOUR_PROJECT_REF

# Wdróż funkcję
supabase functions deploy daily-backup
```

**Opcja B: Przez Supabase Dashboard**

1. Przejdź do Supabase Dashboard → Edge Functions
2. Kliknij **Create a new function**
3. Nazwa: `daily-backup`
4. Skopiuj zawartość `index.ts` do edytora
5. Kliknij **Deploy**

### Krok 4: Zaplanuj automatyczne uruchamianie

**Opcja A: Przez Supabase Cron (zalecane)**

W Supabase Dashboard → Database → Cron Jobs:

```sql
-- Codziennie o 2:00 UTC (3:00 czasu polskiego w zimie, 4:00 w lecie)
SELECT cron.schedule(
  'daily-backup-job',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-backup',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Opcja B: Przez zewnętrzny cron (np. cron-job.org)**

1. Zarejestruj się na https://cron-job.org
2. Utwórz nowy cron job:
   - URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-backup`
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
   - Schedule: Codziennie o 2:00 UTC

**Opcja C: Ręczne wywołanie (test)**

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-backup \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## 📁 Format backupu

### JSON (`ihc_backup_YYYY-MM-DD.json`)

```json
{
  "timestamp": "2024-01-15T02:00:00.000Z",
  "date_range": {
    "from": "2024-01-14T02:00:00.000Z",
    "to": "2024-01-15T02:00:00.000Z"
  },
  "counts": {
    "audit_logs": 150,
    "leads": 25,
    "bookings": 10
  },
  "data": {
    "audit_logs": [...],
    "leads": [...],
    "bookings": [...]
  }
}
```

### CSV (`ihc_backup_YYYY-MM-DD.csv`)

Plik CSV zawiera trzy sekcje:
- `=== AUDIT LOGS ===`
- `=== LEADS ===`
- `=== BOOKINGS ===`

## 🔍 Sprawdzanie backupów

### W Supabase Storage

1. Przejdź do Supabase Dashboard → Storage
2. Otwórz bucket `ihc-backups`
3. Przejdź do folderu `daily/`
4. Pobierz pliki backupu

### W Google Drive

1. Otwórz Google Drive
2. Przejdź do folderu ustawionego w `GOOGLE_DRIVE_FOLDER_ID`
3. Znajdź pliki `ihc_backup_YYYY-MM-DD.json`

### W Dropbox

1. Otwórz Dropbox
2. Przejdź do ścieżki ustawionej w `DROPBOX_BACKUP_PATH`
3. Znajdź pliki backupu

## 🛠️ Rozwiązywanie problemów

### Błąd: "Bucket not found"

- Sprawdź czy bucket `ihc-backups` istnieje w Supabase Storage
- Sprawdź czy nazwa bucketu w `BACKUP_BUCKET` jest poprawna

### Błąd: "Permission denied"

- Sprawdź czy Service Role Key jest poprawny
- Sprawdź czy bucket ma odpowiednie uprawnienia

### Backup nie działa automatycznie

- Sprawdź czy cron job jest aktywny w Supabase
- Sprawdź logi Edge Functions w Supabase Dashboard
- Sprawdź czy funkcja jest poprawnie wdrożona

### Brak danych w backupie

- Sprawdź czy w bazie są dane z ostatnich 24h
- Sprawdź logi funkcji w Supabase Dashboard → Edge Functions → Logs

## 📊 Monitorowanie

Sprawdź logi funkcji:

1. Supabase Dashboard → Edge Functions → `daily-backup` → Logs
2. Sprawdź czy są błędy
3. Sprawdź czy backup się wykonuje codziennie

## 🔐 Bezpieczeństwo

- **NIE** udostępniaj Service Role Key publicznie
- **NIE** commituj secrets do Git
- Używaj Supabase Secrets do przechowywania kluczy
- Regularnie rotuj klucze dostępu
