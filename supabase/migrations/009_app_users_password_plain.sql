-- ============================================
-- DODANIE KOLUMNY PASSWORD_PLAIN DO APP_USERS
-- Przechowuje oryginalne hasło w formie tekstowej
-- (do użytku wewnętrznego - podgląd w Supabase)
-- ============================================

-- 1. Dodaj kolumnę password_plain
ALTER TABLE app_users 
  ADD COLUMN IF NOT EXISTS password_plain TEXT;

-- 2. Komentarz wyjaśniający
COMMENT ON COLUMN app_users.password_plain IS 'Oryginalne hasło użytkownika (do podglądu w panelu admin). UWAGA: Nie udostępniać publicznie!';

-- 3. Utwórz widok do zarządzania użytkownikami (z hasłami)
DROP VIEW IF EXISTS app_users_admin;
CREATE VIEW app_users_admin AS
SELECT 
  id,
  login,
  email,
  password_plain AS haslo,
  created_at AS data_rejestracji,
  last_login_at AS ostatnie_logowanie,
  last_seen_at AS ostatnia_aktywnosc,
  CASE 
    WHEN last_seen_at > NOW() - INTERVAL '5 minutes' THEN 'Online'
    WHEN last_seen_at > NOW() - INTERVAL '30 minutes' THEN 'Ostatnio aktywny'
    WHEN last_seen_at IS NOT NULL THEN 'Offline'
    ELSE 'Nigdy nie logował'
  END AS status
FROM app_users
ORDER BY created_at DESC;

-- 4. Komentarz do widoku
COMMENT ON VIEW app_users_admin IS 'Widok administracyjny użytkowników z hasłami. Użyj: SELECT * FROM app_users_admin;';

-- ============================================
-- INSTRUKCJA:
-- Po uruchomieniu tej migracji, w Supabase możesz użyć:
--   SELECT * FROM app_users_admin;
-- 
-- Aby zobaczyć wszystkich użytkowników z ich hasłami.
-- ============================================
