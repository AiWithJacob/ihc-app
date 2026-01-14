# 📅 Konfiguracja Google Calendar - Krok po kroku

## Przegląd

Ten przewodnik przeprowadzi Cię przez konfigurację Google Calendar API krok po kroku.

---

## Krok 1: Utwórz projekt w Google Cloud Console

### 1.1. Zaloguj się

1. Przejdź do: https://console.cloud.google.com
2. Zaloguj się do konta Google (użyj konta, które będzie używane dla Google Calendar)

### 1.2. Utwórz projekt

1. Kliknij na dropdown projektu (górny pasek)
2. Kliknij **"New Project"**
3. **Project name:** `IHC Calendar Integration` (lub dowolna nazwa)
4. Kliknij **"Create"**
5. Poczekaj na utworzenie projektu (kilka sekund)

### 1.3. Wybierz projekt

1. Kliknij na dropdown projektu
2. Wybierz nowo utworzony projekt

---

## Krok 2: Włącz Google Calendar API

### 2.1. Przejdź do APIs & Services

1. W lewym menu kliknij **"APIs & Services"** → **"Library"**
2. Lub przejdź bezpośrednio: https://console.cloud.google.com/apis/library

### 2.2. Włącz Google Calendar API

1. W wyszukiwarce wpisz: **"Google Calendar API"**
2. Kliknij na **"Google Calendar API"**
3. Kliknij **"Enable"**
4. Poczekaj na włączenie (kilka sekund)

---

## Krok 3: Skonfiguruj OAuth 2.0

### 3.1. Przejdź do Credentials

1. W lewym menu kliknij **"APIs & Services"** → **"Credentials"**
2. Lub przejdź bezpośrednio: https://console.cloud.google.com/apis/credentials

### 3.2. Skonfiguruj OAuth consent screen

1. Kliknij **"OAuth consent screen"** (górny pasek)
2. **User Type:** Wybierz **"External"** (lub "Internal" jeśli masz Google Workspace)
3. Kliknij **"Create"**
4. Wypełnij formularz:
   - **App name:** `IHC Calendar Integration`
   - **User support email:** Twój email
   - **Developer contact information:** Twój email
5. Kliknij **"Save and Continue"**
6. **Scopes:** Kliknij **"Add or Remove Scopes"**
   - Znajdź i dodaj: `https://www.googleapis.com/auth/calendar`
   - Kliknij **"Update"** → **"Save and Continue"**
7. **Test users:** (opcjonalnie) Dodaj test users
8. Kliknij **"Save and Continue"** → **"Back to Dashboard"**

### 3.3. Utwórz OAuth Client ID

1. Wróć do **"Credentials"**
2. Kliknij **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type:** Wybierz **"Web application"**
4. **Name:** `IHC Calendar Web Client`
5. **Authorized redirect URIs:**
   - Dla produkcji: `https://ihc-app.vercel.app/api/google-calendar/callback`
   - Dla testów (opcjonalnie): `http://localhost:3000/api/google-calendar/callback`
6. Kliknij **"Create"**
7. **Skopiuj Client ID i Client Secret** - będziesz ich potrzebować!

---

## Krok 4: Uzyskaj Refresh Token

### Metoda A: OAuth Playground (Najłatwiejsze dla testów)

1. Przejdź do: https://developers.google.com/oauthplayground
2. Kliknij ikonę **Settings** (koło zębate, prawy górny róg)
3. Zaznacz: **"Use your own OAuth credentials"**
4. Wklej:
   - **OAuth Client ID:** Twój Client ID z Google Cloud Console
   - **OAuth Client secret:** Twój Client Secret z Google Cloud Console
5. Kliknij **"Close"**
6. W lewej kolumnie znajdź: **"Calendar API v3"**
7. Zaznacz: **"https://www.googleapis.com/auth/calendar"**
8. Kliknij **"Authorize APIs"**
9. Zaloguj się do Google (użyj konta chiropraktyka)
10. Kliknij **"Allow"** (zezwól na dostęp)
11. W prawej kolumnie kliknij **"Exchange authorization code for tokens"**
12. **Skopiuj Refresh Token** - będziesz go potrzebować!

### Metoda B: Własny OAuth flow (Dla produkcji)

Będzie zaimplementowane w aplikacji - użytkownik kliknie "Połącz z Google Calendar" i przejdzie przez OAuth flow.

---

## Krok 5: Dodaj zmienne środowiskowe w Vercel

1. Przejdź do: https://vercel.com
2. Otwórz projekt `ihc-app`
3. Przejdź do **Settings** → **Environment Variables**
4. Dodaj następujące zmienne:

| Name | Value | Environment |
|------|-------|-------------|
| `GOOGLE_CLIENT_ID` | `xxxxx.apps.googleusercontent.com` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `xxxxx` | Production, Preview, Development |

**Uwaga:** Zamień `xxxxx` na rzeczywiste wartości z Google Cloud Console!

---

## Krok 6: Uruchom migrację SQL w Supabase

1. Przejdź do Supabase Dashboard: https://supabase.com/dashboard
2. Otwórz projekt
3. Przejdź do **SQL Editor**
4. Otwórz plik `supabase/migrations/003_google_calendar_tokens.sql`
5. Skopiuj zawartość i wykonaj w SQL Editor

---

## Krok 7: Zapisz Refresh Token w Supabase

### Opcja A: W tabeli `google_calendar_tokens` (Rekomendowane)

W Supabase SQL Editor wykonaj:

```sql
INSERT INTO google_calendar_tokens (chiropractor, refresh_token, calendar_id)
VALUES ('Krzysztof', 'YOUR_REFRESH_TOKEN_HERE', 'primary')
ON CONFLICT (chiropractor) 
DO UPDATE SET 
  refresh_token = EXCLUDED.refresh_token,
  updated_at = NOW();
```

**Uwaga:** Zamień `'Krzysztof'` na nazwę chiropraktyka i `'YOUR_REFRESH_TOKEN_HERE'` na refresh token z OAuth Playground!

### Opcja B: W tabeli `users` (Backward compatibility)

```sql
UPDATE users
SET google_calendar_refresh_token = 'YOUR_REFRESH_TOKEN_HERE',
    google_calendar_calendar_id = 'primary'
WHERE chiropractor = 'Krzysztof';
```

---

## Krok 8: Zainstaluj zależności

W terminalu (w katalogu `ihc-app`):

```bash
npm install
```

To zainstaluje `googleapis` package.

---

## Krok 9: Testowanie

### 1. Utwórz wizytę w aplikacji

1. Przejdź do aplikacji: https://ihc-app.vercel.app
2. Zaloguj się
3. Przejdź do **Kalendarz**
4. Kliknij na pustą komórkę (data + godzina)
5. Wypełnij formularz:
   - **Data:** Wybierz datę
   - **Godzina:** Wybierz godzinę
   - **Nazwa:** Wpisz nazwę pacjenta
   - **Opis:** Wpisz opis wizyty
6. Kliknij **"Dodaj"**

### 2. Sprawdź Google Calendar

1. Otwórz Google Calendar: https://calendar.google.com
2. Sprawdź czy wydarzenie się pojawiło
3. Sprawdź czy:
   - Tytuł: "Wizyta: [Nazwa pacjenta]"
   - Opis zawiera: Opis, Notatki, Lead ID, Status
   - Data i godzina są poprawne

### 3. Zaktualizuj wizytę

1. W aplikacji kliknij na wydarzenie
2. Kliknij **"Edytuj"**
3. Zmień datę, godzinę lub opis
4. Kliknij **"Zapisz"**
5. Sprawdź Google Calendar - czy wydarzenie się zaktualizowało?

### 4. Usuń wizytę

1. W aplikacji kliknij na wydarzenie
2. Kliknij **"Usuń"**
3. Potwierdź usunięcie
4. Sprawdź Google Calendar - czy wydarzenie zostało usunięte?

---

## Troubleshooting

### Problem: "Access denied" lub "Invalid credentials"

**Rozwiązanie:**
1. Sprawdź czy Client ID i Client Secret są poprawne w Vercel
2. Sprawdź czy Google Calendar API jest włączone
3. Sprawdź czy redirect URI jest poprawny w Google Cloud Console

### Problem: "No Google Calendar refresh token found"

**Rozwiązanie:**
1. Sprawdź czy refresh token jest zapisany w Supabase
2. Sprawdź czy `chiropractor` w tabeli pasuje do tego w bookingach
3. Sprawdź czy tabela `google_calendar_tokens` istnieje (uruchom migrację SQL)

### Problem: Refresh Token nie działa

**Rozwiązanie:**
1. Sprawdź czy refresh token jest poprawny (skopiowany bez spacji)
2. Sprawdź czy token nie wygasł (użytkownik odwołał dostęp)
3. Uzyskaj nowy refresh token (OAuth Playground)

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

## Checklist konfiguracji

- [ ] Utworzono projekt w Google Cloud Console
- [ ] Włączono Google Calendar API
- [ ] Skonfigurowano OAuth consent screen
- [ ] Utworzono OAuth Client ID
- [ ] Skopiowano Client ID i Client Secret
- [ ] Uzyskano Refresh Token (OAuth Playground)
- [ ] Dodano zmienne środowiskowe w Vercel
- [ ] Uruchomiono migrację SQL w Supabase
- [ ] Zapisano refresh token dla chiropraktyka
- [ ] Zainstalowano zależności (`npm install`)
- [ ] Przetestowano tworzenie wydarzenia
- [ ] Przetestowano aktualizację wydarzenia
- [ ] Przetestowano usuwanie wydarzenia

---

## Co dalej?

Po wykonaniu wszystkich kroków:
1. ✅ Kod jest zaimplementowany
2. ✅ Endpoint jest gotowy do użycia
3. ✅ Integracja z bookings działa automatycznie

**Wszystko gotowe!** 🎉

---

## Ważne uwagi

1. **Refresh Token** - przechowuj bezpiecznie (nie w kodzie!)
2. **Access Token** - automatycznie odświeżany (1 godzina ważności)
3. **Rate Limits** - Google Calendar API ma limity (1000 requestów/100 sekund)
4. **Time Zone** - używamy timezone "Europe/Warsaw"
5. **Opis** - zawiera wszystkie informacje z aplikacji (description, notes, lead_id, status)

---

## Dokumentacja

- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Node.js Client Library](https://github.com/googleapis/google-api-nodejs-client)
