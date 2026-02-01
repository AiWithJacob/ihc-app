-- ============================================
-- DODANIE POLA CHIROPRACTOR DO APP_USERS
-- Pozwala przypisać użytkownika do konkretnego chiropraktyka
-- ============================================

-- 1. Dodaj kolumnę chiropractor (domyślnie 'default')
ALTER TABLE app_users 
  ADD COLUMN IF NOT EXISTS chiropractor TEXT DEFAULT 'default';

-- 2. Komentarz
COMMENT ON COLUMN app_users.chiropractor IS 'Identyfikator chiropraktyka/gabinetu dla którego pracuje użytkownik';

-- 3. Ustaw istniejącym użytkownikom wartość default
UPDATE app_users SET chiropractor = 'default' WHERE chiropractor IS NULL;
