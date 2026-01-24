# Panel administracyjny – konfiguracja

## Co zostało dodane

- **Tabela `app_users`** – konta z rejestracji (migracja `004_app_users.sql`)
- **API:** `/api/register`, `/api/user-heartbeat`, `/api/user-login`
- **Rejestracja** – nowi użytkownicy trafiają do `app_users` (LoginPage wywołuje `/api/register`)
- **Heartbeat** – co 2 min `last_seen_at` (App.jsx → `/api/user-heartbeat`)
- **Last login** – przy logowaniu (LoginPage → `/api/user-login`)
- **Panel** – `public/audit-log-diagnostics.html` (np. `/audit-log-diagnostics.html` w dev/deploy)

## Migracja Supabase

W Supabase (SQL Editor) uruchom migrację:

```
supabase/migrations/004_app_users.sql
```

Albo skopiuj jej zawartość i wykonaj w SQL Editor.

## Uruchomienie lokalne (bez Vercel)

1. **API (Vercel dev):**  
   `vercel dev` – uruchomi Vite i serverless (m.in. `/api/register`, `/api/user-heartbeat`, `/api/user-login`).

2. **Tylko frontend:**  
   `npm run dev` – API nie działa; rejestracja zwróci błąd „Serwer niedostępny”.  
   Ustaw `VITE_API_URL` na działający adres API (np. wdrożony Vercel), jeśli chcesz testować rejestrację.

3. **Panel administracyjny:**  
   - Przy `npm run dev`: `http://localhost:5173/audit-log-diagnostics.html`  
   - Przy `vercel dev`: zależnie od konfiguracji (np. `http://localhost:3000/audit-log-diagnostics.html`)

## Zakładki panelu

| Zakładka     | Opis |
|-------------|------|
| **Przegląd** | Statystyki: audit, leady, rezerwacje, konta, zmiany dzisiaj |
| **Konta**   | Lista z `app_users`: login, email, rejestracja, ostatnie logowanie, ostatnia aktywność |
| **Kto pracuje** | Użytkownicy z `last_seen_at` w ostatnich 5 min (dla wybranego chiropraktyka) |
| **Leady**   | Lista, dodawanie, usuwanie, filtrowanie |
| **Rezerwacje** | Lista, dodawanie, usuwanie, filtrowanie; filtr „Filtr użytkownika” po `created_by_user_login` |
| **Historia** | Audit logs; „Filtr użytkownika” i „Kto zmienił” |
| **Diagnostyka** | Sprawdzenie połączenia i tabel, w tym `app_users` |

## Filtr użytkownika

Dropdown „Filtr użytkownika” (nad zakładkami):

- Ustawia filtr „Kto zmienił” w **Historia**
- Filtruje **Rezerwacje** po `created_by_user_login`

## Vercel / deploy

- `vercel.json` – rewrite wyklucza `/audit-log-diagnostics.html`, żeby serwować statyczny HTML z `public/`.
- W Vercel ustaw: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (do API).
- Migrację `004_app_users.sql` wykonaj w swoim projekcie Supabase.
