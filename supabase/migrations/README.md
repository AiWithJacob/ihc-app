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

Szczegóły: `docs/SUPABASE-PORZADEK.md`
