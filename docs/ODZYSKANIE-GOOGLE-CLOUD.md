# 🔄 Odzyskanie projektu Google Cloud i naprawa OAuth

## Problem
Projekt Google Cloud został zamknięty, co powoduje błąd "invalid_client" (401) przy próbie logowania przez Google OAuth.

## Rozwiązanie - Krok po kroku

### Krok 1: Odzyskaj projekt Google Cloud ⚠️ PILNE

**Masz czas do 18 lutego 2026!**

1. Przejdź do: https://console.cloud.google.com/iam-admin/settings
2. Kliknij **"Resources pending deletion"** (lub użyj linku z maila)
3. Znajdź projekt: `project-838afd8b-0815-43a5-9ca`
4. Kliknij **"Restore"**
5. Potwierdź przywrócenie w dialogu

**Alternatywnie przez gcloud CLI:**
```bash
gcloud projects undelete project-838afd8b-0815-43a5-9ca
```

---

### Krok 2: Sprawdź OAuth Client ID

1. Przejdź do: https://console.cloud.google.com/apis/credentials
2. Sprawdź, czy OAuth Client ID nadal istnieje
3. Jeśli **NIE istnieje**, utwórz nowy (patrz Krok 3)
4. Jeśli **istnieje**, sprawdź czy jest aktywny

---

### Krok 3: Utwórz nowy OAuth Client ID (jeśli stary został usunięty)

1. W Google Cloud Console: **APIs & Services** → **Credentials**
2. Kliknij **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type:** Wybierz **"Web application"**
4. **Name:** `IHC Calendar Web Client`
5. **Authorized redirect URIs:**
   - Dla produkcji: `https://ihc-app.vercel.app/api/google-calendar/callback`
   - Dla testów (opcjonalnie): `http://localhost:3000/api/google-calendar/callback`
6. Kliknij **"Create"**
7. **Skopiuj Client ID i Client Secret** - będziesz ich potrzebować!

---

### Krok 4: Zaktualizuj zmienne środowiskowe w Vercel

1. Przejdź do: https://vercel.com
2. Otwórz projekt `ihc-app`
3. Przejdź do **Settings** → **Environment Variables**
4. Zaktualizuj następujące zmienne:

| Name | Value | Environment |
|------|-------|-------------|
| `GOOGLE_CLIENT_ID` | `xxxxx.apps.googleusercontent.com` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | `xxxxx` | Production, Preview, Development |

5. Kliknij **"Save"**
6. **WAŻNE:** Po zapisaniu zmiennych, Vercel automatycznie wdroży nową wersję z zaktualizowanymi credentials

---

### Krok 5: Zaktualizuj plik testowy (opcjonalnie)

Jeśli używasz pliku `google-oauth-test.html`:

1. Otwórz: `ihc-app/public/google-oauth-test.html`
2. Znajdź linię z `CLIENT_ID`
3. Zaktualizuj na nowy Client ID z Google Cloud Console

---

### Krok 6: Sprawdź OAuth Consent Screen

1. Przejdź do: https://console.cloud.google.com/apis/credentials/consent
2. Sprawdź, czy OAuth consent screen jest skonfigurowany
3. Jeśli nie, skonfiguruj go (patrz `GOOGLE-CALENDAR-SETUP.md`)

---

### Krok 7: Testowanie

Po wykonaniu wszystkich kroków:

1. Poczekaj na zakończenie wdrożenia w Vercel (2-3 minuty)
2. Spróbuj ponownie zalogować się przez Google Calendar
3. Jeśli nadal występuje błąd, sprawdź:
   - Czy zmienne środowiskowe są zapisane w Vercel
   - Czy OAuth Client ID jest aktywny w Google Cloud Console
   - Czy redirect URI jest poprawny

---

## Rozwiązywanie problemów

### Błąd: "invalid_client" (401)
- **Przyczyna:** Client ID nie istnieje lub jest nieprawidłowy
- **Rozwiązanie:** Sprawdź czy Client ID w Vercel odpowiada Client ID w Google Cloud Console

### Błąd: "redirect_uri_mismatch"
- **Przyczyna:** Redirect URI w aplikacji nie pasuje do tego w Google Cloud Console
- **Rozwiązanie:** Sprawdź czy redirect URI w Google Cloud Console to: `https://ihc-app.vercel.app/api/google-calendar/callback`

### Błąd: "access_denied"
- **Przyczyna:** Użytkownik nie zezwolił na dostęp
- **Rozwiązanie:** Upewnij się, że OAuth consent screen jest poprawnie skonfigurowany

---

## Ważne linki

- **Odzyskanie projektu:** https://console.cloud.google.com/iam-admin/settings
- **Credentials:** https://console.cloud.google.com/apis/credentials
- **OAuth Consent Screen:** https://console.cloud.google.com/apis/credentials/consent
- **Vercel Environment Variables:** https://vercel.com/dashboard → Projekt → Settings → Environment Variables

---

## Uwagi

- ⚠️ **PILNE:** Odzyskaj projekt przed 18 lutego 2026, inaczej zostanie trwale usunięty
- Po odzyskaniu projektu, credentials mogą nadal działać, jeśli nie zostały usunięte
- Jeśli musisz utworzyć nowy OAuth Client ID, będziesz musiał ponownie autoryzować użytkowników
