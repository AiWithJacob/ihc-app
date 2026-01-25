# 🚀 Wdrożenie na Vercel - Krótki przewodnik

## Szybki start

### Metoda 1: Przez interfejs webowy (NAJPROSTSZE)

1. **Przejdź na https://vercel.com**
2. **Zaloguj się** (użyj konta GitHub)
3. **Kliknij "Add New" → "Project"**
4. **Importuj repozytorium** `AiWithJacob/ihc-app`
5. **Konfiguracja**:
   - Framework Preset: **Vite**
   - Root Directory: `ihc-app` (lub zostaw puste jeśli repo jest w głównym folderze)
   - Build Command: `npm run build` (automatycznie wykryte)
   - Output Directory: `dist` (automatycznie wykryte)
6. **Kliknij "Deploy"**
7. **Zapisz URL** aplikacji (np. `https://ihc-app.vercel.app`)

### Metoda 2: Przez CLI

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Przejdź do folderu projektu
cd ihc-app

# Zaloguj się
vercel login

# Wdróż
vercel

# Wdróż do produkcji
vercel --prod
```

## ✅ Po wdrożeniu

1. **Zapisz URL aplikacji** (np. `https://ihc-app-xyz.vercel.app`)
2. **Użyj tego URL w Zapier** jako endpoint webhooka:
   - `https://twoja-aplikacja.vercel.app/api/facebook-leads`

## 🔧 Konfiguracja zmiennych środowiskowych (opcjonalnie)

W Vercel Dashboard:
1. Przejdź do projektu → Settings → Environment Variables
2. Dodaj (jeśli potrzebne):
   - `VITE_API_URL` = `https://twoja-aplikacja.vercel.app`

## 📝 Testowanie

Po wdrożeniu przetestuj endpoint:

```bash
curl -X POST https://twoja-aplikacja.vercel.app/api/facebook-leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jan",
    "last_name": "Testowy",
    "phone_number": "123456789",
    "email": "jan@test.com"
  }'
```

Powinien zwrócić:
```json
{
  "success": true,
  "lead": { ... },
  "message": "Lead received successfully"
}
```

## 🔄 Aktualizacje

Każdy push do GitHub automatycznie wdraża nową wersję na Vercel!

Lub ręcznie:
```bash
vercel --prod
```

---

## Ostatni deploy (panel admin, leady, rezerwacje, „Kto pracuje”)

- **GitHub:** push na `main` wykonany (repo: `AiWithJacob/ihc-app`).
- **Vercel:** jeśli projekt jest połączony z tym repozytorium, wdrożenie uruchomi się po pushu. Sprawdź: [vercel.com/dashboard](https://vercel.com/dashboard) → projekt → Deployments.
- **Supabase:** uruchom migrację `006_app_users_chiropractor.sql` (kolumna `app_users.chiropractor` dla „Kto pracuje”):
  - Supabase Dashboard → SQL Editor → wklej zawartość `supabase/migrations/006_app_users_chiropractor.sql` → Run.

## Ostrzeżenie DEP0169 (`url.parse()` / WHATWG URL) w logach Vercel

W logach może się pojawić:

```
(node:4) [DEP0169] DeprecationWarning: `url.parse()` behavior is not standardized...
```

To pochodzi z zależności (np. **googleapis**), nie z Twojego kodu. Aplikacja działa poprawnie; to tylko ostrzeżenie.

**Jak ukryć to ostrzeżenie w Vercel:**

1. Vercel → **projekt** → **Settings** → **Environment Variables**
2. Dodaj zmienną:
   - **Name:** `NODE_OPTIONS`
   - **Value:** `--disable-warning=DEP0169`
   - **Environments:** Production, Preview, Development (zaznacz wszystkie)
3. **Save** → **Redeploy** (Deployments → ⋮ przy ostatnim deployu → Redeploy)

Jeśli `--disable-warning=DEP0169` nie działa (starsza Node), spróbuj:  
`NODE_OPTIONS=--no-pending-deprecation`
