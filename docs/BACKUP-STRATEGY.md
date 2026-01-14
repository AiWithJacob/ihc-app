# Strategia backupu danych - IHC MVP

## Przegląd

System IHC MVP przechowuje dane w Supabase (PostgreSQL). Niniejszy dokument opisuje strategię backupu danych na obecny moment (ręczny backup).

**Uwaga:** W przyszłości planujemy automatyczny backup przez Supabase Edge Function (`daily-backup`), ale na razie używamy ręcznego backupu.

---

## Co backupujemy

### Tabele do backupu:

1. **`leads`** - wszystkie leady (kontakty)
2. **`bookings`** - wszystkie rezerwacje
3. **`audit_logs`** - pełna historia zmian
4. **`users`** - użytkownicy systemu

### Dane dodatkowe:

- **Struktura bazy danych** (schemat SQL)
- **Funkcje i triggery** (migracje SQL)
- **RLS Policies** (polityki bezpieczeństwa)

---

## Metoda 1: Ręczny backup przez Supabase Dashboard (Zalecane)

### Krok 1: Otwórz Supabase Dashboard

1. Zaloguj się na https://supabase.com
2. Otwórz swój projekt IHC MVP
3. Przejdź do **Database** → **Backups**

### Krok 2: Utwórz backup

1. Kliknij **"Create backup"** (jeśli dostępne)
2. Wybierz typ backupu:
   - **Full backup** - cała baza danych
   - **Partial backup** - wybrane tabele
3. Kliknij **"Create"**

**Uwaga:** Supabase automatycznie tworzy daily backups, ale możesz też utworzyć manual backup.

### Krok 3: Pobierz backup

1. Po utworzeniu backupu, kliknij **"Download"**
2. Zapisz plik na bezpiecznym miejscu (np. Google Drive, Dropbox, lokalny dysk)

---

## Metoda 2: SQL Export przez Supabase SQL Editor

### Krok 1: Otwórz SQL Editor

1. W Supabase Dashboard → **SQL Editor**
2. Kliknij **"New query"**

### Krok 2: Eksportuj dane

#### Eksport wszystkich tabel:

```sql
-- Eksport leads
COPY leads TO STDOUT WITH CSV HEADER;

-- Eksport bookings
COPY bookings TO STDOUT WITH CSV HEADER;

-- Eksport audit_logs
COPY audit_logs TO STDOUT WITH CSV HEADER;

-- Eksport users
COPY users TO STDOUT WITH CSV HEADER;
```

**Uwaga:** W Supabase SQL Editor nie możesz bezpośrednio użyć `COPY TO STDOUT`. Zamiast tego:

1. Użyj **Table Editor** → wybierz tabelę → **Export** → **CSV**
2. Lub użyj **pg_dump** przez lokalne połączenie

### Krok 3: Eksport struktury (schemat)

```sql
-- Pobierz definicje tabel
SELECT 
    'CREATE TABLE ' || table_name || ' (' || 
    string_agg(column_name || ' ' || data_type, ', ') || 
    ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name;
```

**Lepsze rozwiązanie:** Użyj migracji SQL z folderu `supabase/migrations/`:
- `001_audit_log_system.sql`
- `002_add_user_tracking_to_bookings.sql`

---

## Metoda 3: pg_dump (Zaawansowane)

### Wymagania:

- Zainstalowany PostgreSQL client (`pg_dump`)
- Connection string do Supabase

### Krok 1: Pobierz connection string

1. W Supabase Dashboard → **Settings** → **Database**
2. Skopiuj **Connection string** (URI format)
3. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### Krok 2: Uruchom pg_dump

```bash
# Backup całej bazy danych
pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup tylko danych (bez struktury)
pg_dump --data-only "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup_data_$(date +%Y%m%d_%H%M%S).sql

# Backup tylko struktury (bez danych)
pg_dump --schema-only "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup_schema_$(date +%Y%m%d_%H%M%S).sql
```

### Krok 3: Kompresja (opcjonalnie)

```bash
# Kompresuj backup
gzip backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Metoda 4: Backup przez Supabase CLI (Zaawansowane)

### Wymagania:

- Zainstalowany Supabase CLI
- Zalogowany do Supabase

### Krok 1: Zainstaluj Supabase CLI

```bash
npm install -g supabase
```

### Krok 2: Zaloguj się

```bash
supabase login
```

### Krok 3: Połącz z projektem

```bash
supabase link --project-ref [PROJECT_REF]
```

### Krok 4: Pobierz backup

```bash
# Backup danych
supabase db dump --data-only > backup_data_$(date +%Y%m%d_%H%M%S).sql

# Backup struktury
supabase db dump --schema-only > backup_schema_$(date +%Y%m%d_%H%M%S).sql
```

---

## Harmonogram backupów (Ręczny)

### Zalecana częstotliwość:

- **Codziennie** - dla aktywnych systemów
- **Co tydzień** - dla mniej aktywnych systemów
- **Przed ważnymi zmianami** - przed aktualizacjami, migracjami

### Checklist backupu:

- [ ] Utworzono backup w Supabase Dashboard
- [ ] Pobrano backup (SQL lub CSV)
- [ ] Zapisano backup w bezpiecznym miejscu
- [ ] Zweryfikowano rozmiar backupu
- [ ] Zweryfikowano datę backupu

---

## Przywracanie z backupu

### Metoda 1: Przez Supabase Dashboard

1. W Supabase Dashboard → **Database** → **Backups**
2. Wybierz backup
3. Kliknij **"Restore"**
4. Potwierdź przywrócenie

**Uwaga:** Przywrócenie nadpisze obecne dane!

### Metoda 2: Przez SQL Editor

1. Otwórz **SQL Editor**
2. Wklej zawartość backupu SQL
3. Kliknij **"Run"**

**Uwaga:** Upewnij się, że backup zawiera `DROP TABLE IF EXISTS` lub użyj `TRUNCATE` przed przywróceniem.

### Metoda 3: Przez psql

```bash
# Przywróć backup
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < backup_20240101_120000.sql
```

---

## Bezpieczne przechowywanie backupów

### Zalecane miejsca:

1. **Google Drive** - łatwy dostęp, synchronizacja
2. **Dropbox** - podobnie jak Google Drive
3. **Lokalny dysk** - szybki dostęp, ale wymaga backupu samego dysku
4. **Zewnętrzny dysk** - fizyczny backup
5. **Cloud storage (S3, Azure Blob)** - profesjonalne rozwiązanie

### Organizacja backupów:

```
backups/
├── 2024/
│   ├── 01/
│   │   ├── backup_20240101_120000.sql
│   │   ├── backup_20240102_120000.sql
│   │   └── ...
│   └── 02/
│       └── ...
└── schema/
    ├── backup_schema_20240101.sql
    └── ...
```

### Naming convention:

- **Format:** `backup_YYYYMMDD_HHMMSS.sql`
- **Przykład:** `backup_20240115_143022.sql`
- **Dodatkowe info:** `backup_data_20240115_143022.sql`, `backup_schema_20240115_143022.sql`

---

## Weryfikacja backupu

### Sprawdź rozmiar:

```bash
# Sprawdź rozmiar pliku
ls -lh backup_*.sql

# Sprawdź liczbę linii (przybliżona liczba rekordów)
wc -l backup_*.sql
```

### Sprawdź zawartość:

```bash
# Sprawdź pierwsze linie
head -n 20 backup_*.sql

# Sprawdź czy zawiera dane
grep -i "INSERT INTO" backup_*.sql | wc -l
```

### Test przywrócenia (opcjonalnie):

1. Utwórz testową bazę danych
2. Przywróć backup do testowej bazy
3. Sprawdź czy dane są poprawne
4. Usuń testową bazę

---

## Automatyczny backup (Przyszłość)

### Planowany automatyczny backup:

1. **Supabase Edge Function:** `supabase/functions/daily-backup/index.ts`
2. **Harmonogram:** Codziennie o 2:00 AM (UTC)
3. **Miejsce:** Supabase Storage (bucket `backups`)
4. **Format:** JSON i CSV

### Konfiguracja (gdy będzie gotowe):

1. Ustaw zmienne środowiskowe w Supabase:
   - `BACKUP_MODE=full` lub `incremental`
   - `BACKUP_STORAGE=supabase` (lub `s3`, `google_drive`)

2. Aktywuj Supabase Cron:
   ```sql
   SELECT cron.schedule(
     'daily-backup',
     '0 2 * * *', -- Codziennie o 2:00 AM
     $$
     SELECT net.http_post(
       url := 'https://[PROJECT_REF].supabase.co/functions/v1/daily-backup',
       headers := '{"Authorization": "Bearer [ANON_KEY]"}'::jsonb
     );
     $$
   );
   ```

---

## Troubleshooting

### Problem: Backup jest za duży

**Rozwiązanie:**
- Użyj kompresji (gzip)
- Eksportuj tylko dane (bez struktury)
- Eksportuj tylko wybrane tabele

### Problem: Backup nie działa

**Rozwiązanie:**
1. Sprawdź połączenie z Supabase
2. Sprawdź uprawnienia (service_role key)
3. Sprawdź logi w Supabase Dashboard

### Problem: Przywrócenie nie działa

**Rozwiązanie:**
1. Sprawdź format backupu (SQL vs CSV)
2. Sprawdź czy backup zawiera strukturę (CREATE TABLE)
3. Sprawdź czy nie ma konfliktów z istniejącymi danymi

---

## Checklist backupu

### Przed backupem:

- [ ] Sprawdź dostępność Supabase
- [ ] Sprawdź miejsce na dysku
- [ ] Sprawdź datę ostatniego backupu

### Podczas backupu:

- [ ] Utworzono backup
- [ ] Zweryfikowano rozmiar
- [ ] Zweryfikowano datę

### Po backupie:

- [ ] Zapisano backup w bezpiecznym miejscu
- [ ] Zweryfikowano zawartość
- [ ] Zaktualizowano dokumentację (data backupu)

---

## Kontakt

W razie problemów z backupem:
1. Sprawdź dokumentację Supabase: https://supabase.com/docs/guides/database/backups
2. Sprawdź logi w Supabase Dashboard
3. Skontaktuj się z supportem Supabase

---

## Historia backupów

| Data | Metoda | Rozmiar | Lokalizacja | Uwagi |
|------|--------|---------|-------------|-------|
| 2024-01-15 | Supabase Dashboard | - | - | Pierwszy backup |
| ... | ... | ... | ... | ... |

**Uwaga:** Aktualizuj tę tabelę po każdym backupie.
