# ✅ Make.com NIE musi być połączony z Supabase!

## Jak to działa?

```
Facebook Lead Ads → Make.com Webhook → Vercel Endpoint → Supabase
```

**Make.com NIE łączy się bezpośrednio z Supabase!**

1. **Make.com** otrzymuje dane z webhooka
2. **Make.com** wysyła dane do endpointu Vercel: `https://ihc-app.vercel.app/api/facebook-leads`
3. **Endpoint Vercel** (`/api/facebook-leads`) zapisuje dane do Supabase
4. **Aplikacja IHC** pobiera dane z Supabase

---

## Co musi być skonfigurowane?

### ✅ W Make.com:
- **Webhook** - odbiera dane
- **HTTP Request** - wysyła dane do endpointu Vercel

### ✅ W Vercel (już skonfigurowane):
- **Endpoint** `/api/facebook-leads` - odbiera dane z Make.com
- **Połączenie z Supabase** - endpoint ma dostęp do Supabase przez zmienne środowiskowe

### ✅ W Supabase (już skonfigurowane):
- **Tabela `leads`** - przechowuje leady
- **Zmienne środowiskowe** w Vercel - `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY`

---

## Sprawdźmy, czy wszystko działa

### Krok 1: Sprawdź, czy endpoint Vercel działa

Otwórz w przeglądarce lub użyj curl:

```powershell
curl -X POST "https://ihc-app.vercel.app/api/facebook-leads?chiropractor=default" `
  -H "Content-Type: application/json" `
  -H "X-Webhook-Source: make" `
  -d '{
    "first_name": "Jan",
    "last_name": "Testowy",
    "phone_number": "123456789",
    "email": "jan@example.com",
    "custom_questions": "Test lead bezpośrednio do endpointu"
  }'
```

**Jeśli działa:** Powinieneś otrzymać odpowiedź:
```json
{
  "success": true,
  "lead": {...},
  "message": "Lead saved to Supabase successfully"
}
```

**Jeśli nie działa:** Sprawdź logi w Vercel (Functions → Logs)

### Krok 2: Sprawdź konfigurację w Make.com

Upewnij się, że w module HTTP Request masz:

1. **URL:** `https://ihc-app.vercel.app/api/facebook-leads`
2. **Method:** POST
3. **Query parameters:** `chiropractor=default`
4. **Headers:**
   - `X-Webhook-Source: make`
   - `Content-Type: application/json`
5. **Body:** JSON z `{{1.nazwa_pola}}`

### Krok 3: Przetestuj przez Make.com

1. W Make.com kliknij **"Run once"**
2. Wyślij dane do webhooka (curl lub strona testowa)
3. Sprawdź Execution history:
   - Moduł 1 (Webhook): zielony ✅
   - Moduł 2 (HTTP Request): zielony ✅

---

## Jeśli endpoint Vercel nie działa

### Problem: Błąd 500 lub "Database not configured"

**Przyczyna:** Brak zmiennych środowiskowych w Vercel

**Rozwiązanie:**
1. Otwórz Vercel Dashboard
2. Przejdź do projektu `ihc-app`
3. Settings → Environment Variables
4. Sprawdź czy masz:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Jeśli brakuje, dodaj je (patrz: `docs/SUPABASE-SETUP.md`)

### Problem: Błąd 404

**Przyczyna:** Endpoint nie istnieje lub URL jest niepoprawny

**Rozwiązanie:**
1. Sprawdź czy URL jest poprawny: `https://ihc-app.vercel.app/api/facebook-leads`
2. Sprawdź czy plik `api/facebook-leads.js` istnieje
3. Wdróż ponownie na Vercel (jeśli trzeba)

---

## Podsumowanie

**Make.com NIE potrzebuje połączenia z Supabase!**

Wystarczy, że:
1. ✅ Make.com wysyła dane do endpointu Vercel
2. ✅ Endpoint Vercel ma dostęp do Supabase (przez zmienne środowiskowe)
3. ✅ Endpoint zapisuje dane do Supabase

**Sprawdź teraz:**
1. Czy endpoint Vercel działa? (użyj curl powyżej)
2. Czy Make.com poprawnie wysyła dane do endpointu? (sprawdź Execution history)

---

## Co dalej?

1. **Przetestuj endpoint bezpośrednio** (curl powyżej)
2. **Sprawdź Execution history w Make.com** - czy HTTP Request jest zielony?
3. **Sprawdź logi w Vercel** - czy endpoint otrzymuje dane?

Napisz mi, co widzisz - pomogę rozwiązać problem! 🚀
