# 🔍 Sprawdzanie konfiguracji Google Calendar OAuth

## Krok 1: Sprawdź Redirect URI w Google Cloud Console

1. Przejdź do: https://console.cloud.google.com/apis/credentials
2. Kliknij na swój OAuth 2.0 Client ID
3. Sprawdź sekcję **"Authorized redirect URIs"**
4. **MUSI** zawierać dokładnie:
   ```
   https://ihc-app.vercel.app/api/google-calendar/callback
   ```
5. Jeśli nie ma, **DODAJ** ten URI i kliknij **"Save"**

---

## Krok 2: Sprawdź OAuth Consent Screen

1. Przejdź do: https://console.cloud.google.com/apis/credentials/consent
2. Sprawdź status:
   - Jeśli status to **"Testing"** - dodaj swój email jako test user
   - Jeśli status to **"In production"** - OK
3. Sprawdź, czy scope `https://www.googleapis.com/auth/calendar` jest dodany:
   - Kliknij **"EDIT APP"**
   - Przejdź do **"Scopes"**
   - Sprawdź, czy `https://www.googleapis.com/auth/calendar` jest na liście
   - Jeśli nie ma, dodaj go i zapisz

---

## Krok 3: Sprawdź Google Calendar API

1. Przejdź do: https://console.cloud.google.com/apis/library/calendar-json.googleapis.com
2. Sprawdź, czy widzisz przycisk **"Manage"** (oznacza, że API jest włączone)
3. Jeśli widzisz **"Enable"**, kliknij go

---

## Krok 4: Sprawdź zmienne środowiskowe w Vercel

1. Przejdź do: https://vercel.com/dashboard
2. Otwórz projekt `ihc-app`
3. Przejdź do: **Settings** → **Environment Variables**
4. Sprawdź wartości:
   - `GOOGLE_CLIENT_ID` = `[TWÓJ_CLIENT_ID]`
   - `GOOGLE_CLIENT_SECRET` = `[TWÓJ_CLIENT_SECRET]`
5. Jeśli wartości są różne, **ZAKTUALIZUJ** je
6. **WAŻNE:** Po zmianie zmiennych środowiskowych, **ZRESTARTUJ** deployment:
   - Przejdź do: **Deployments**
   - Kliknij na najnowszy deployment
   - Kliknij **"Redeploy"** (lub utwórz nowy commit i push)

---

## Krok 5: Testowanie

### Test 1: Sprawdź, czy callback endpoint działa

1. Otwórz w przeglądarce:
   ```
   https://ihc-app.vercel.app/api/google-calendar/callback?code=test&error=test
   ```
2. Powinieneś zobaczyć stronę z błędem (to OK - oznacza, że endpoint działa)

### Test 2: Sprawdź logi w Vercel

1. Przejdź do: https://vercel.com/dashboard
2. Otwórz projekt `ihc-app`
3. Przejdź do: **Deployments** → wybierz najnowszy deployment
4. Kliknij **"Functions"** → **"google-calendar/callback"**
5. Sprawdź logi - czy są jakieś błędy?

---

## Najczęstsze problemy:

### Problem 1: "redirect_uri_mismatch"
**Rozwiązanie:** Upewnij się, że redirect URI w Google Cloud Console jest **dokładnie** taki sam jak w kodzie:
- Google Cloud Console: `https://ihc-app.vercel.app/api/google-calendar/callback`
- Kod używa: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/google-calendar/callback`

### Problem 2: "invalid_client"
**Rozwiązanie:** Sprawdź, czy Client ID i Client Secret w Vercel są poprawne i czy deployment został zrestartowany po zmianie zmiennych środowiskowych.

### Problem 3: "access_denied"
**Rozwiązanie:** Sprawdź OAuth Consent Screen - jeśli status to "Testing", dodaj swój email jako test user.

### Problem 4: "No refresh token received"
**Rozwiązanie:** Upewnij się, że w URL autoryzacji jest parametr `access_type=offline` i `prompt=consent`.

---

## Jak zrestartować deployment w Vercel:

1. Przejdź do: https://vercel.com/dashboard
2. Otwórz projekt `ihc-app`
3. Przejdź do: **Deployments**
4. Kliknij na najnowszy deployment
5. Kliknij **"Redeploy"** (lub utwórz pusty commit i push)

---

## Jak przetestować OAuth flow:

1. Utwórz URL autoryzacji (zastąp `[TWÓJ_CLIENT_ID]` swoim Client ID):
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
   client_id=[TWÓJ_CLIENT_ID]&
   redirect_uri=https://ihc-app.vercel.app/api/google-calendar/callback&
   response_type=code&
   scope=https://www.googleapis.com/auth/calendar&
   access_type=offline&
   prompt=consent
   ```
2. Otwórz ten URL w przeglądarce
3. Zaloguj się do Google
4. Zezwól na dostęp
5. Powinieneś zostać przekierowany do callback endpoint
