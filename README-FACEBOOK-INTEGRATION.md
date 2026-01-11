# Integracja z Facebook Lead Ads przez Zapier

## 📋 Przegląd

Ta aplikacja jest zintegrowana z Facebook Lead Ads przez Zapier. Gdy ktoś wypełni formularz Lead Ads na Facebooku, lead automatycznie trafia do aplikacji jako "Nowy kontakt".

## 🚀 Konfiguracja

### Krok 1: Wdrożenie na Vercel

1. **Zainstaluj Vercel CLI** (opcjonalnie):
   ```bash
   npm i -g vercel
   ```

2. **Zaloguj się do Vercel**:
   ```bash
   vercel login
   ```

3. **Wdróż projekt**:
   ```bash
   cd ihc-app
   vercel
   ```
   
   Lub użyj interfejsu webowego:
   - Przejdź na https://vercel.com
   - Połącz swoje konto GitHub
   - Importuj repozytorium `ihc-app`
   - Vercel automatycznie wykryje konfigurację

4. **Zapisz URL aplikacji** (np. `https://ihc-app.vercel.app`)

### Krok 2: Konfiguracja Zapier

1. **Zaloguj się na Zapier.com** (lub utwórz darmowe konto)

2. **Utwórz nowy Zap**:
   - Kliknij "Create Zap"

3. **Skonfiguruj Trigger (Wyzwalacz)**:
   - Wyszukaj: **"Facebook Lead Ads"**
   - Wybierz: **"New Lead"**
   - Połącz swoje konto Facebook
   - Wybierz formularz Lead Ads, który chcesz monitorować
   - Przetestuj połączenie

4. **Skonfiguruj Action (Akcja)**:
   - Wyszukaj: **"Webhooks by Zapier"**
   - Wybierz: **"POST"**
   - **URL**: `https://twoja-aplikacja.vercel.app/api/facebook-leads`
     (Zamień na URL Twojej aplikacji z Vercel)
   - **Method**: POST
   - **Data**: Dodaj następujące pola:
     ```json
     {
       "first_name": "{{first_name}}",
       "last_name": "{{last_name}}",
       "phone_number": "{{phone_number}}",
       "email": "{{email}}",
       "full_name": "{{full_name}}",
       "custom_questions": "{{custom_questions}}",
       "lead_id": "{{lead_id}}"
     }
     ```
   - Przetestuj akcję

5. **Włącz Zap**:
   - Kliknij "Turn on Zap"
   - Zapier będzie teraz automatycznie przekazywał leady

### Krok 3: Konfiguracja w aplikacji

1. **Ustaw URL API** (jeśli używasz własnej domeny):
   - Utwórz plik `.env` w folderze `ihc-app`
   - Dodaj:
     ```
     VITE_API_URL=https://twoja-aplikacja.vercel.app
     ```

2. **Aplikacja automatycznie sprawdza nowe leady**:
   - Co 30 sekund aplikacja sprawdza czy są nowe leady
   - Nowe leady automatycznie pojawiają się w sekcji "Nowy kontakt"

## 🔧 Jak to działa

1. **Użytkownik wypełnia formularz** na Facebook Lead Ads
2. **Facebook wysyła lead** do Zapier
3. **Zapier przekazuje lead** do endpointu `/api/facebook-leads`
4. **Endpoint przetwarza lead** i zapisuje go
5. **Aplikacja sprawdza nowe leady** co 30 sekund
6. **Nowy lead pojawia się** w aplikacji jako "Nowy kontakt"

## 📝 Struktura danych leada

Lead z Facebook jest konwertowany do formatu aplikacji:

```javascript
{
  id: Date.now(),
  name: "Imię Nazwisko",
  phone: "123456789",
  description: "Opis z formularza",
  notes: "Źródło: Facebook Ads\nData: ...\nEmail: ...",
  status: "Nowy kontakt",
  createdAt: "2024-01-01T12:00:00.000Z",
  source: "facebook",
  email: "email@example.com" // jeśli dostępny
}
```

## 🧪 Testowanie

### Testowanie endpointu lokalnie:

1. **Uruchom Vercel lokalnie**:
   ```bash
   vercel dev
   ```

2. **Wyślij testowy request**:
   ```bash
   curl -X POST http://localhost:3000/api/facebook-leads \
     -H "Content-Type: application/json" \
     -d '{
       "first_name": "Jan",
       "last_name": "Kowalski",
       "phone_number": "123456789",
       "email": "jan@example.com"
     }'
   ```

3. **Sprawdź w aplikacji** czy lead się pojawił

### Testowanie przez Zapier:

- Użyj funkcji "Test" w Zapier
- Sprawdź czy lead pojawił się w aplikacji w ciągu 30 sekund

## 🔒 Bezpieczeństwo

**Uwaga**: Obecna implementacja nie ma weryfikacji webhooków. W produkcji dodaj:

1. **Weryfikację tokenu** w endpointcie
2. **Rate limiting** (ograniczenie liczby requestów)
3. **Autoryzację** (API key)

Przykład weryfikacji w `api/facebook-leads.js`:

```javascript
// Sprawdź token (ustaw w zmiennych środowiskowych Vercel)
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;
if (req.headers['x-webhook-token'] !== WEBHOOK_TOKEN) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

## 🐛 Rozwiązywanie problemów

### Leady nie pojawiają się w aplikacji:

1. **Sprawdź czy Zapier działa**:
   - Otwórz Zapier → Twoje Zaps
   - Sprawdź czy Zap jest włączony
   - Sprawdź historię wykonania

2. **Sprawdź endpoint**:
   - Otwórz: `https://twoja-aplikacja.vercel.app/api/facebook-leads`
   - Powinien zwrócić błąd 405 (Method not allowed) - to OK dla GET

3. **Sprawdź konsolę przeglądarki**:
   - Otwórz DevTools (F12)
   - Sprawdź zakładkę Console
   - Szukaj komunikatów o sprawdzaniu leadów

4. **Sprawdź logi Vercel**:
   - Przejdź do Vercel Dashboard
   - Otwórz Functions → Logs
   - Sprawdź czy endpoint otrzymuje requesty

### Endpoint zwraca błąd:

- Sprawdź format danych wysyłanych z Zapier
- Sprawdź czy wszystkie wymagane pola są wypełnione
- Sprawdź logi w Vercel Dashboard

## 📚 Przydatne linki

- [Vercel Documentation](https://vercel.com/docs)
- [Zapier Documentation](https://zapier.com/help)
- [Facebook Lead Ads API](https://developers.facebook.com/docs/marketing-api/leadgen)

## 🔄 Aktualizacje

Aby zaktualizować integrację:

1. Wdróż nową wersję na Vercel:
   ```bash
   vercel --prod
   ```

2. Sprawdź czy Zapier nadal działa (automatycznie używa nowego URL)

## 💡 Przyszłe ulepszenia

- [ ] Dodanie bazy danych (Supabase) do przechowywania leadów
- [ ] Weryfikacja webhooków dla bezpieczeństwa
- [ ] Powiadomienia push o nowych leadach
- [ ] Statystyki leadów z Facebook Ads
- [ ] Automatyczne przypisanie leadów do chiropraktyków
