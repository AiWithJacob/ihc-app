# Dokumentacja statusów w systemie IHC

## Statusy w tabeli `leads`

Statusy dla leadów (kontaktów) są używane do śledzenia etapu kontaktu z potencjalnym klientem.

### Dostępne statusy:

1. **"Nowy kontakt"** (domyślny)
   - Nowy lead, który jeszcze nie został obsłużony
   - Kolor: Niebieski (#3b82f6)
   - Ustawiany automatycznie przy:
     - Ręcznym dodaniu leada przez UI
     - Otrzymaniu leada z Facebook Lead Ads (webhook)

2. **"Umówiony"**
   - Lead, z którym umówiono wizytę
   - Kolor: Zielony (#22c55e)
   - Ustawiany ręcznie przez użytkownika

3. **"Nie odebrał"**
   - Lead, który nie odebrał telefonu
   - Kolor: Czerwony (#ef4444)
   - Ustawiany ręcznie przez użytkownika

4. **"Zadzwoń później"**
   - Lead, z którym należy skontaktować się później
   - Kolor: Pomarańczowy (#f59e0b)
   - Ustawiany ręcznie przez użytkownika

5. **"Sam się skontaktuje"**
   - Lead, który sam się skontaktuje
   - Kolor: Szary (#6b7280)
   - Ustawiany ręcznie przez użytkownika

### Implementacja w kodzie:

**Plik:** `src/LeadsPage.jsx`

```javascript
const STATUSES = [
  "Nowy kontakt",
  "Umówiony",
  "Nie odebrał",
  "Zadzwoń później",
  "Sam się skontaktuje",
];
```

### W bazie danych:

- **Kolumna:** `leads.status`
- **Typ:** `TEXT`
- **Domyślna wartość:** `'Nowy kontakt'`
- **Indeks:** `idx_leads_status` (dla szybszych zapytań)

---

## Statusy w tabeli `bookings`

Statusy dla rezerwacji (bookings) są używane do śledzenia stanu wizyty.

### Dostępne statusy:

1. **"scheduled"** (domyślny)
   - Wizyta zaplanowana
   - Ustawiany automatycznie przy utworzeniu rezerwacji

2. **"completed"**
   - Wizyta zakończona
   - Ustawiany ręcznie przez użytkownika

3. **"cancelled"**
   - Wizyta anulowana
   - Ustawiany ręcznie przez użytkownika

### Implementacja w kodzie:

**Plik:** `src/CalendarPage.jsx`

Statusy są używane w interfejsie kalendarza, ale nie ma stałej listy (są dynamiczne).

### W bazie danych:

- **Kolumna:** `bookings.status`
- **Typ:** `TEXT`
- **Domyślna wartość:** `'scheduled'`
- **Indeks:** `idx_bookings_status` (dla szybszych zapytań)

---

## Spójność statusów

### Weryfikacja:

1. **Leads:**
   - ✅ Wszystkie statusy są zdefiniowane w `LeadsPage.jsx`
   - ✅ Kolory są przypisane w funkcji `getStatusColor()`
   - ✅ Domyślny status w bazie: `'Nowy kontakt'`

2. **Bookings:**
   - ⚠️ Statusy nie są zdefiniowane w jednym miejscu
   - ✅ Domyślny status w bazie: `'scheduled'`
   - ⚠️ Warto dodać stałą listę statusów dla bookings (jak w leads)

### Rekomendacje:

1. **Dla bookings:** Dodać stałą listę statusów w `CalendarPage.jsx`:
   ```javascript
   const BOOKING_STATUSES = [
     "scheduled",
     "completed",
     "cancelled"
   ];
   ```

2. **Dla leads:** Statusy są już dobrze zdefiniowane - nie wymagają zmian.

3. **W bazie danych:** Dodać CHECK constraint dla statusów (opcjonalnie):
   ```sql
   ALTER TABLE leads ADD CONSTRAINT check_lead_status 
   CHECK (status IN ('Nowy kontakt', 'Umówiony', 'Nie odebrał', 'Zadzwoń później', 'Sam się skontaktuje'));
   
   ALTER TABLE bookings ADD CONSTRAINT check_booking_status 
   CHECK (status IN ('scheduled', 'completed', 'cancelled'));
   ```

---

## Zmiana statusów

### Leads:

Statusy można zmieniać przez:
- **Drag & Drop** w interfejsie (przeciąganie leada między kolumnami)
- **Modal edycji** leada (wybór z listy)
- **API endpoint** `/api/leads` (PUT request)

### Bookings:

Statusy można zmieniać przez:
- **Modal edycji** rezerwacji
- **API endpoint** `/api/bookings` (PUT request)

---

## Audit Log

Wszystkie zmiany statusów są automatycznie logowane w tabeli `audit_logs`:
- **Tabela:** `audit_logs`
- **Pole:** `changed_fields` zawiera `'status'` gdy status się zmienia
- **Pole:** `old_data` i `new_data` zawierają pełne dane przed i po zmianie

---

## Historia zmian statusów

Aby zobaczyć historię zmian statusów:
1. Otwórz **Historia zmian** (Audit Log)
2. Filtruj po tabeli (`leads` lub `bookings`)
3. Filtruj po akcji (`UPDATE`)
4. Sprawdź `changed_fields` - powinno zawierać `'status'`

---

## Przyszłe rozszerzenia

Możliwe dodatkowe statusy:
- **Leads:** "Odrzucony", "W trakcie kontaktu"
- **Bookings:** "W trakcie", "Przeniesiony", "Nie stawił się"

**Uwaga:** Przed dodaniem nowych statusów:
1. Zaktualizuj listę w kodzie
2. Zaktualizuj kolory w `getStatusColor()`
3. Zaktualizuj dokumentację
4. Rozważ dodanie CHECK constraint w bazie danych
