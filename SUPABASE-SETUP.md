# Instrukcja konfiguracji Supabase

## Krok 1: Utwórz tabelę `leads` w Supabase

1. Zaloguj się do Supabase: https://supabase.com
2. Otwórz swój projekt
3. Przejdź do **SQL Editor** (lewy sidebar)
4. Wklej i wykonaj następujące SQL:

```sql
-- Utwórz tabelę leads
CREATE TABLE leads (
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

-- Utwórz indeksy dla szybszych zapytań
CREATE INDEX idx_leads_chiropractor ON leads(chiropractor);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_status ON leads(status);

-- Włącz Row Level Security (opcjonalne)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Utwórz policy, która pozwala wszystkim na odczyt i zapis (dla uproszczenia)
-- W produkcji możesz to zmienić na bardziej restrykcyjne
CREATE POLICY "Allow all operations" ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

5. Kliknij **Run** (lub Ctrl+Enter)

## Krok 2: Pobierz klucze API

1. W Supabase przejdź do **Settings** (⚙️ w lewym sidebarze)
2. Kliknij **API**
3. Skopiuj następujące wartości:
   - **Project URL** (np. `https://xxxxx.supabase.co`)
   - **anon** `public` key (anon key)
   - **service_role** `secret` key (service_role key) - **WAŻNE: użyj tego klucza!**

## Krok 3: Dodaj zmienne środowiskowe w Vercel

1. Przejdź do Vercel: https://vercel.com
2. Otwórz projekt `ihc-app`
3. Przejdź do **Settings** → **Environment Variables**
4. Dodaj następujące zmienne:

| Name | Value | Environment |
|------|-------|-------------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` (twój Project URL) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (twój service_role key) | Production, Preview, Development |

5. Kliknij **Save**
6. **WAŻNE:** Przejdź do **Deployments** i kliknij **Redeploy** na najnowszym deployment, aby zastosować nowe zmienne środowiskowe

## Krok 4: Sprawdź, czy działa

1. Po redeploy w Vercel, sprawdź logi:
   - Vercel → Projekt → **Logs**
   - Powinieneś zobaczyć logi z endpointów `/api/facebook-leads` i `/api/leads`

2. Przetestuj endpoint:
   - Otwórz w przeglądarce: `https://ihc-app.vercel.app/api/leads?chiropractor=Krzysztof`
   - Powinieneś otrzymać JSON z leadami (początkowo pusty array)

3. Przetestuj zapis leada z Zapier:
   - Wyślij test lead z Zapier
   - Sprawdź logi Vercel - powinno być: "✅ Lead zapisany w Supabase"
   - Sprawdź w Supabase → **Table Editor** → `leads` - powinien pojawić się nowy lead

## Rozwiązywanie problemów

### Błąd: "Supabase client not initialized"
- Sprawdź, czy dodałeś zmienne środowiskowe w Vercel
- Sprawdź, czy zrobiłeś redeploy po dodaniu zmiennych
- Sprawdź, czy klucze są poprawne (bez spacji, całkowite)

### Błąd: "relation 'leads' does not exist"
- Sprawdź, czy utworzyłeś tabelę `leads` w Supabase
- Sprawdź, czy użyłeś poprawnej nazwy tabeli (małe litery: `leads`)

### Błąd: "new row violates row-level security policy"
- Sprawdź, czy utworzyłeś policy w SQL Editor
- Sprawdź, czy używasz `service_role` key (nie `anon` key)

### Leady nie pojawiają się w aplikacji
- Sprawdź konsolę przeglądarki (F12) - powinny być logi synchronizacji
- Sprawdź, czy `chiropractor` w Zapier jest taki sam jak w aplikacji
- Sprawdź logi Vercel - czy lead został zapisany

## Struktura tabeli `leads`

| Kolumna | Typ | Opis |
|---------|-----|------|
| `id` | BIGSERIAL | Automatycznie generowane ID (Primary Key) |
| `name` | TEXT | Imię i nazwisko leada |
| `phone` | TEXT | Numer telefonu (opcjonalne) |
| `email` | TEXT | Email (opcjonalne) |
| `description` | TEXT | Opis problemu (opcjonalne) |
| `notes` | TEXT | Notatki (opcjonalne) |
| `status` | TEXT | Status leada (domyślnie: 'Nowy kontakt') |
| `chiropractor` | TEXT | Nazwa chiropraktyka (wymagane) |
| `source` | TEXT | Źródło leada ('facebook' lub 'manual') |
| `created_at` | TIMESTAMPTZ | Data utworzenia (automatycznie) |

## Następne kroki

Po skonfigurowaniu Supabase:
1. ✅ Leady z Facebook Ads będą automatycznie zapisywane w Supabase
2. ✅ Aplikacja będzie synchronizować leady z Supabase co 30 sekund
3. ✅ Wszystkie leady (z FB i ręcznie dodane) będą w jednej bazie
4. ✅ Backup automatyczny w Supabase
5. ✅ Historia zmian w Supabase
