# 📅 Plan integracji z Google Calendar

## Przegląd

Integracja Google Calendar pozwoli na automatyczne synchronizowanie wizyt z aplikacji do kalendarza Google chiropraktyka.

**Jak to będzie działać:**
1. Użytkownik zapisuje wizytę w aplikacji
2. Aplikacja automatycznie tworzy wydarzenie w Google Calendar chiropraktyka
3. Chiropraktyk widzi wizytę w swoim Google Calendar
4. Przy zmianie/usunięciu wizyty, wydarzenie w Google Calendar jest aktualizowane/usuwane

---

## Wymagania

### 1. Google Cloud Console
- Konto Google
- Projekt w Google Cloud Console
- Google Calendar API włączone
- OAuth 2.0 credentials (Client ID, Client Secret)
- Refresh Token dla każdego chiropraktyka

### 2. W aplikacji
- Kolumna `google_calendar_event_id` w tabeli `bookings` ✅ (już istnieje)
- Endpoint do zarządzania wydarzeniami Google Calendar ✅ (zaimplementowane)
- Funkcje do tworzenia/aktualizowania/usuwania wydarzeń ✅ (zaimplementowane)

---

## Architektura

```
Aplikacja (UI) → API Endpoint → Google Calendar API → Google Calendar
                ↓
            Supabase (zapisuje event_id)
```

---

## Co zostało zaimplementowane

### ✅ 1. Endpoint `/api/google-calendar.js`
- `createCalendarEvent()` - tworzy wydarzenie w Google Calendar
- `updateCalendarEvent()` - aktualizuje wydarzenie
- `deleteCalendarEvent()` - usuwa wydarzenie
- `getAccessToken()` - odświeża access token z refresh token
- `getRefreshTokenForChiropractor()` - pobiera refresh token dla chiropraktyka

### ✅ 2. Integracja z `/api/bookings.js`
- **POST (INSERT):** Po zapisaniu bookinga → tworzy wydarzenie w Google Calendar
- **PUT (UPDATE):** Po aktualizacji bookinga → aktualizuje wydarzenie w Google Calendar
- **DELETE:** Po usunięciu bookinga → usuwa wydarzenie z Google Calendar

### ✅ 3. Migracja SQL
- Tabela `google_calendar_tokens` - przechowuje refresh tokens
- Kolumny w tabeli `users` (backward compatibility)

### ✅ 4. Package.json
- Dodano `googleapis` dependency

---

## Format wydarzenia w Google Calendar

```json
{
  "summary": "Wizyta: Jan Kowalski",
  "description": "Opis: Ból pleców\nNotatki: ...\nLead ID: 123\nStatus: scheduled",
  "start": {
    "dateTime": "2026-01-15T10:00:00",
    "timeZone": "Europe/Warsaw"
  },
  "end": {
    "dateTime": "2026-01-15T11:00:00",
    "timeZone": "Europe/Warsaw"
  },
  "location": "Gabinet chiropraktyka",
  "colorId": "1"
}
```

**Opis zawiera:**
- Opis wizyty (z pola `description`)
- Notatki (z pola `notes`)
- Lead ID (jeśli wizyta jest powiązana z leadem)
- Status wizyty

---

## Konfiguracja (do wykonania)

### Krok 1: Google Cloud Console Setup

1. Przejdź do: https://console.cloud.google.com
2. Utwórz nowy projekt (lub użyj istniejącego)
3. Włącz Google Calendar API:
   - APIs & Services → Enable APIs
   - Wyszukaj "Google Calendar API"
   - Kliknij "Enable"
4. Skonfiguruj OAuth 2.0:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://ihc-app.vercel.app/api/google-calendar/callback` (lub lokalny dla testów)
5. Pobierz Client ID i Client Secret

### Krok 2: Uzyskaj Refresh Token

**Metoda A: OAuth Playground (Najłatwiejsze)**
1. Przejdź do: https://developers.google.com/oauthplayground
2. Skonfiguruj OAuth 2.0:
   - Settings (ikona koła zębatego) → Use your own OAuth credentials
   - Wklej Client ID i Client Secret
3. Wybierz scope: `https://www.googleapis.com/auth/calendar`
4. Kliknij "Authorize APIs"
5. Zaloguj się do Google (konto chiropraktyka)
6. Kliknij "Exchange authorization code for tokens"
7. Skopiuj Refresh Token

**Metoda B: Własny OAuth flow (Dla produkcji)**
- Zaimplementuj OAuth flow w aplikacji
- Przekieruj użytkownika do Google
- Odbierz authorization code
- Wymień na access token i refresh token

### Krok 3: Dodaj zmienne środowiskowe w Vercel

1. Przejdź do: https://vercel.com
2. Otwórz projekt `ihc-app`
3. Przejdź do **Settings** → **Environment Variables**
4. Dodaj następujące zmienne:

| Name | Value | Environment |
|------|-------|-------------|
| `GOOGLE_CLIENT_ID` | `xxxxx.apps.googleusercontent.com` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `xxxxx` | Production, Preview, Development |

### Krok 4: Zapisz Refresh Token w Supabase

**Opcja A: W tabeli `google_calendar_tokens` (Rekomendowane)**

```sql
INSERT INTO google_calendar_tokens (chiropractor, refresh_token, calendar_id)
VALUES ('Krzysztof', 'YOUR_REFRESH_TOKEN_HERE', 'primary');
```

**Opcja B: W tabeli `users` (Backward compatibility)**

```sql
UPDATE users
SET google_calendar_refresh_token = 'YOUR_REFRESH_TOKEN_HERE',
    google_calendar_calendar_id = 'primary'
WHERE chiropractor = 'Krzysztof';
```

### Krok 5: Uruchom migrację SQL

W Supabase Dashboard:
1. Przejdź do **SQL Editor**
2. Otwórz plik `supabase/migrations/003_google_calendar_tokens.sql`
3. Skopiuj zawartość i wykonaj w SQL Editor

---

## Testowanie

### 1. Utwórz wizytę w aplikacji
- Przejdź do Kalendarz
- Dodaj nową wizytę
- Sprawdź Google Calendar - czy wydarzenie się pojawiło?

### 2. Zaktualizuj wizytę
- Zmień datę, godzinę, opis
- Sprawdź Google Calendar - czy wydarzenie się zaktualizowało?

### 3. Usuń wizytę
- Usuń wizytę z aplikacji
- Sprawdź Google Calendar - czy wydarzenie zostało usunięte?

---

## Bezpieczeństwo

1. **Refresh Token** - przechowuj bezpiecznie (encrypted w Supabase)
2. **Access Token** - krótkotrwały (1 godzina), odświeżany automatycznie
3. **RLS Policies** - użytkownik może zarządzać tylko swoimi tokenami
4. **Environment Variables** - Client ID i Client Secret w Vercel

---

## Troubleshooting

### Problem: "No Google Calendar refresh token found"

**Rozwiązanie:**
1. Sprawdź czy refresh token jest zapisany w Supabase
2. Sprawdź czy `chiropractor` w tabeli pasuje do tego w bookingach
3. Sprawdź czy tabela `google_calendar_tokens` istnieje

### Problem: "Failed to refresh access token"

**Rozwiązanie:**
1. Sprawdź czy Client ID i Client Secret są poprawne w Vercel
2. Sprawdź czy refresh token jest poprawny
3. Uzyskaj nowy refresh token (token mógł wygasnąć)

### Problem: Wydarzenie nie pojawia się w Google Calendar

**Rozwiązanie:**
1. Sprawdź logi w Vercel (Functions → Logs)
2. Sprawdź czy access token jest poprawny
3. Sprawdź czy calendar_id jest poprawny (domyślnie "primary")
4. Sprawdź czy format daty i czasu jest poprawny

### Problem: Błąd 404 przy aktualizacji/usuwaniu

**Rozwiązanie:**
- Wydarzenie mogło zostać usunięte ręcznie z Google Calendar
- System automatycznie pomija błąd i kontynuuje (nie przerywa procesu)

---

## Checklist implementacji

- [x] Utworzono endpoint `/api/google-calendar.js`
- [x] Zaimplementowano funkcje: create, update, delete
- [x] Zaktualizowano `/api/bookings.js` - integracja z Google Calendar
- [x] Utworzono migrację SQL dla przechowywania refresh tokens
- [x] Dodano `googleapis` do package.json
- [ ] Utworzono projekt w Google Cloud Console
- [ ] Włączono Google Calendar API
- [ ] Skonfigurowano OAuth 2.0 (Client ID, Client Secret)
- [ ] Uzyskano Refresh Token dla chiropraktyka
- [ ] Dodano zmienne środowiskowe w Vercel (Client ID, Client Secret)
- [ ] Zapisano refresh token w Supabase
- [ ] Uruchomiono migrację SQL
- [ ] Przetestowano tworzenie wydarzenia
- [ ] Przetestowano aktualizację wydarzenia
- [ ] Przetestowano usuwanie wydarzenia

---

## Następne kroki

1. **Dzisiaj:** Implementacja kodu ✅
2. **Następny krok:** Konfiguracja Google Cloud Console (patrz `GOOGLE-CALENDAR-SETUP.md`)
3. **Potem:** Testowanie i weryfikacja

---

## Uwagi

- **Refresh Token** wygasa tylko gdy użytkownik odwoła dostęp
- **Access Token** wygasa po 1 godzinie - automatycznie odświeżany
- **Rate Limits:** Google Calendar API ma limity (1000 requestów/100 sekund/użytkownik)
- **Time Zone:** Używamy timezone "Europe/Warsaw"
- **Opis:** Zawiera wszystkie informacje z aplikacji (description, notes, lead_id, status)

---

## Dokumentacja Google Calendar API

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Node.js Quickstart](https://developers.google.com/calendar/api/quickstart/nodejs)
