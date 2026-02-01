# Migracje Supabase

Uruchamiaj w **SQL Editor** w tej kolejności. Zawartość plików to źródło prawdy.

| # | Plik | Opis |
|---|------|------|
| 1 | 000_leads_table.sql | Tabela `leads` (wymagana przed 001) |
| 2 | 004_app_users.sql | Tabela `app_users` |
| 3 | 001_audit_log_system.sql | `users`, `bookings`, `audit_logs`, triggery |
| 4 | 002_add_user_tracking_to_bookings.sql | Kolumny `created_by_*`, `updated_by_*` w `bookings` |
| 5 | 003_google_calendar_tokens.sql | Tabela `google_calendar_tokens` |
| 6 | 005_app_users_audit_and_rls.sql | Trigger rejestracji `app_users`, policy `audit_logs` |
| 7 | 006_app_users_chiropractor.sql | Kolumna `app_users.chiropractor` |
| 8 | 007_leads_missing_columns.sql | Kolumny `leads`: `name`, `notes`, `status`, `chiropractor`, `source`, `created_at` |
| 9 | 008_leads_with_booking_view.sql | Widoki `leads_with_bookings`, `chiropractor_stats`, `active_users` |
| 10 | 009_app_users_password_plain.sql | **NOWE:** Kolumna `password_plain` + widok `app_users_admin` |

## Nowa migracja 008

Migracja `008_leads_with_booking_view.sql` dodaje:

1. **Kolumny cache w `leads`:**
   - `last_booking_id` - ID ostatniej rezerwacji
   - `last_booking_date` - Data ostatniej rezerwacji
   - `last_booking_status` - Status rezerwacji (scheduled/completed/cancelled)
   - `updated_at` - Data ostatniej aktualizacji

2. **Widoki do podglądu danych:**
   - `leads_with_bookings` - Leady połączone z rezerwacjami
   - `chiropractor_stats` - Statystyki konwersji per chiropraktyk
   - `active_users` - Lista użytkowników z ich statusem online/offline

3. **Triggery automatyczne:**
   - Automatyczna aktualizacja cache rezerwacji w `leads`
   - Automatyczna aktualizacja `updated_at`

### Użycie widoków w Supabase:

```sql
-- Pełne dane leadów z rezerwacjami
SELECT * FROM leads_with_bookings WHERE chiropractor = 'Nazwa';

-- Statystyki chiropraktyków
SELECT * FROM chiropractor_stats;

-- Aktywni użytkownicy
SELECT * FROM active_users;
```

Szczegóły: `docs/SUPABASE-PORZADEK.md`
