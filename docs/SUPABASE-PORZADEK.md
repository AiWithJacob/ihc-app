# Porządek w Supabase i projekcie

## 1. Tabele w Supabase – co jest używane

| Tabela | Użycie | Usuwać? |
|--------|--------|---------|
| **leads** | `api/leads.js`, `api/facebook-leads.js`, LeadsPage, StatisticsPage | **NIE** – rdzeń |
| **bookings** | `api/bookings.js`, `api/google-calendar.js`, CalendarPage | **NIE** – rdzeń |
| **app_users** | `api/register.js`, `api/user-login.js`, `api/user-heartbeat.js`, `api/register-check.js` | **NIE** – logowanie, rejestracja, „Kto pracuje” |
| **audit_logs** | Triggery `leads`, `bookings`, `app_users`; `lib/auditHelper.js`; `set_user_context` | **NIE** – historia zmian |
| **google_calendar_tokens** | `api/google-calendar.js`, `api/google-calendar/callback.js` | **NIE** – OAuth Google Calendar |
| **users** | Tylko `api/google-calendar.js` (fallback: `google_calendar_refresh_token`, `google_calendar_calendar_id`); FK w `google_calendar_tokens.user_id` | **Zostaw** – wymagana przez 001 i 003. Może być pusta, jeśli używasz tylko `google_calendar_tokens`. |

### Tabela `users` vs `app_users`

- **app_users** – konta z rejestracji (aplikacja). Używana na co dzień.
- **users** – z migracji 001; używana tylko gdy tokeny Google trzymasz w `users` (stary wariant) lub przez FK `google_calendar_tokens.user_id`. Jeśli wszyscy są w `google_calendar_tokens` z `chiropractor`, tabelę `users` możesz zostawić pustą – **nie usuwaj** (łamałoby to migracje i FK).

---

## 2. Kolejność migracji (SQL Editor)

Uruchamiaj w Supabase **SQL Editor** w tej kolejności (jeśli coś już jest – `IF NOT EXISTS` / `DROP IF EXISTS` nic nie zepsuje):

| Kolejność | Plik | Opis |
|-----------|------|------|
| 1 | `000_leads_table.sql` | Tabela `leads` – **przed** 001 (bookings.lead_id, trigger) |
| 2 | `004_app_users.sql` | Tabela `app_users` |
| 3 | `001_audit_log_system.sql` | `users`, `bookings`, `audit_logs`, triggery, `set_user_context`, `log_audit_change` |
| 4 | `002_add_user_tracking_to_bookings.sql` | Kolumny `created_by_*`, `updated_by_*` w `bookings` |
| 5 | `003_google_calendar_tokens.sql` | Tabela `google_calendar_tokens` (wymaga `users`) |
| 6 | `005_app_users_audit_and_rls.sql` | Trigger rejestracji `app_users` → `audit_logs`, policy na `audit_logs` |
| 7 | `006_app_users_chiropractor.sql` | Kolumna `app_users.chiropractor` (heartbeat) |
| 8 | `007_leads_missing_columns.sql` | Kolumny `leads`: `name`, `notes`, `status`, `chiropractor`, `source`, `created_at` (gdy wcześniej była np. `last_name`, `note`) |

Źródło prawdy: pliki w `ihc-app/supabase/migrations/`.

---

## 3. Zapisane zapytania w SQL Editor – co można usunąć

Te zapisane w Supabase (PRIVATE) często dublują migracje lub były jednorazowe. **Możesz je usunąć** (Delete / trzy kropki przy zapytaniu), jeśli to tylko kopie lub stare wersje:

- `Leads Schema Migration` – to samo co `000` / `007`
- `Add chiropractor field to ap...`, `app_users chiropractor colu...` – to samo co `006`
- `App users registration audit ...`, `User registration audit trigger` – to samo co `005`
- `Application user accounts`, `App users table` – to samo co `004`
- `Leads table with RLS and in...` – to samo co `000`
- `Add New Lead` – jednorazowe testy
- `Update Google Calendar To...` (duplikaty) – jednorazowe, jeśli już wdrożone
- `Google Calendar refresh tok...` – to samo co `003`
- `Bookings audit columns and...` – to samo co `002`
- `Recent Audit Log Entries`, `Backfill chiropractor in audit...`, `Verify Row-Level Security P...`, `Naprawa i diagnostyka logó...`, `Chiropractor audit log acces...`, `Audit Trigger Check` – diagnostyka / backfill; po wykorzystaniu można skasować

**Zostaw** (albo przenieś do jednego „Master” / „Migrations”):  
jedną kopię aktualnych migracji z `supabase/migrations/`, jeśli wolisz odpalać je z SQL Editor zamiast Supabase CLI.

---

## 4. RLS (Row Level Security)

- **app_users, audit_logs, leads** – RLS włączone; API korzysta z `service_role`, więc i tak omija RLS.
- **bookings, users, google_calendar_tokens** – w zrzucie możesz widzieć „UNRESTRICTED”. To zwykle znaczy, że RLS jest **wyłączone**. Dla API z `service_role` to akceptowalne.  
  Jeśli chcesz spójności: włącz RLS i dodaj policy „zezwól wszystko” (np. jak w `000` dla `leads`) albo policy per rola – zrób to w osobnej migracji, żeby nie pomylić z obecnym stanem.

---

## 5. Wizyta w Supabase, ale znika z kalendarza

**Najpierw sprawdź w Table Editor `bookings`:**  
Kolumna **`chiropractor`** w wierszu musi **dokładnie** odpowiadać temu, co masz w nagłówku aplikacji („Pracujesz dla X”). Różnica wielkości liter lub spacja (`"Krzysztof"` vs `"krzysztof"`) powoduje, że GET filtruje `.eq('chiropractor', …)` i nie zwraca tej wizyty.

Jeśli `chiropractor` się zgadza, w kodzie wdrożone są m.in.:  
- stały format `date` jako `YYYY-MM-DD` (API i sync),  
- `toHHMM` dla `time`,  
- porównanie `id` po `String(…)` w merge,  
- `user` z App (nie z `localStorage`) przy zapisie z kalendarza,  
- `limit(5000)` w GET.

---

## 6. Znikanie wizyt (sync po 2–3 s) – wcześniejsze poprawki

W kodzie:

1. **Czas z API** – Postgres `TIME` zwraca `"12:00:00"`, siatka porównuje `"12:00"`. W `api/bookings.js` jest `toHHMM` – GET/POST/PUT zwracają `"HH:MM"`. Dzięki temu po sync wizyta dalej pasuje do slotu.
2. **Sync po dodaniu** – usunięty `setTimeout(syncBookingsFromSupabase, 2000)` w `addEvent`. Stan po dodaniu pochodzi z `data.booking` (odpowiedź POST). Wczesny sync mógł nadpisać stan przed zapisem w DB.
3. **Pierwszy sync** – przesunięty z 4 s na 5 s (leady i rezerwacje), żeby dać bufor po zapisie wizyty.

Upewnij się, że w Vercel jest wdrożona wersja z `toHHMM` w `api/bookings.js` i bez 2s `syncBookingsFromSupabase` w `CalendarPage`.

---

## 7. Pliki w projekcie – co można usunąć lub przenieść

### Do usunięcia / archiwum (jeśli nie używasz)

- `public/google-oauth-test.html`, `public/test-google-oauth.html` – testy OAuth; po skonfigurowaniu zbędne
- `test-webhook.html` (w katalogu głównym `ihc-app`) – test webhooka; dev
- **docs/archive/** – przenieś tu ręcznie (lista w `docs/archive/README.md`):
  - `MAKE-COM-*.md`, `TROUBLESHOOTING-MAKE-WEBHOOK.md`, `ZAPIER-MIGRATION-PLAN.md` – Make.com / Zapier
  - `ODZYSKANIE-GOOGLE-CLOUD.md`, `QUICK-TEST-WEBHOOK.md`, `TEST-WEBHOOK.md`, `TEST-ENDPOINT-POWERSHELL.md`

### Zostaw

- `docs/SUPABASE-SETUP.md`, `docs/DEPLOY-VERCEL.md`, `docs/GOOGLE-CALENDAR-SETUP.md`, `docs/AUDIT-LOG-SETUP.md`
- `docs/README-FACEBOOK-INTEGRATION.md`, `docs/QUICK-START-FACEBOOK.md` – jeśli jest Facebook Lead Ads
- `public/audit-log-diagnostics.html` – jeśli korzystasz z diagnostyki audit

---

## 8. Cron (Vercel)

W `vercel.json`:

```json
"crons": [{ "path": "/api/google-calendar/sync-deleted", "schedule": "0 4 * * *" }]
```

Raz dziennie o 4:00 usuwa z `bookings` wizyty, których wydarzenia już nie ma w Google Calendar.  
**Nie** usuwa wizyt bez `google_calendar_event_id` – nowe wizyty (bez integracji GC) są bezpieczne.

---

## 9. Szybki checklist

- [ ] W SQL Editor uruchomione migracje 000→007 w dobrej kolejności (w tym **007** jeśli `leads` miało `last_name`/`note`)
- [ ] Zapisane zapytania – usunięte duplikaty i jednorazówki
- [ ] Tabela `users` zostawiona (nawet pusta) – nie usuwać
- [ ] Vercel: redeploy z aktualnym kodem (toHHMM, brak 2s sync, pierwszy sync 5 s)
- [ ] `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` w Vercel wskazują na ten sam projekt co Table Editor
