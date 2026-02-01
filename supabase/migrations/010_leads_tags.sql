-- ============================================
-- DODANIE TAGÓW DO LEADÓW
-- Pozwala oznaczać leady etykietami: VIP, Pilne, Polecenie, itp.
-- ============================================

-- 1. Dodaj kolumnę tags (tablica tekstów)
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Komentarz
COMMENT ON COLUMN leads.tags IS 'Tagi/etykiety leada: VIP, Pilne, Polecenie, Ubezpieczenie, itp.';

-- 3. Indeks GIN dla szybkiego wyszukiwania po tagach
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN (tags);

-- 4. Przykładowe zapytania:
-- Znajdź wszystkie VIP:
--   SELECT * FROM leads WHERE 'VIP' = ANY(tags);
-- 
-- Znajdź leady z tagiem Pilne lub Polecenie:
--   SELECT * FROM leads WHERE tags && ARRAY['Pilne', 'Polecenie'];
