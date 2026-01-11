# 🚀 Szybki Start - Integracja Facebook Lead Ads

## ✅ Co zostało zaimplementowane:

1. ✅ **Endpoint Vercel** (`/api/facebook-leads`) - odbiera leady z Zapier
2. ✅ **Endpoint do pobierania leadów** (`/api/leads`) - aplikacja pobiera nowe leady
3. ✅ **Automatyczne sprawdzanie** - aplikacja sprawdza nowe leady co 30 sekund
4. ✅ **Konfiguracja Vercel** - gotowa do wdrożenia

## 📋 Krok po kroku - Co musisz zrobić:

### Krok 1: Wdróż na Vercel (5 minut)

1. Przejdź na **https://vercel.com**
2. Zaloguj się przez GitHub
3. Kliknij **"Add New" → "Project"**
4. Importuj repozytorium: **`AiWithJacob/ihc-app`**
5. Kliknij **"Deploy"**
6. **Zapisz URL** aplikacji (np. `https://ihc-app-abc123.vercel.app`)

### Krok 2: Skonfiguruj Zapier (10 minut)

1. Zaloguj się na **https://zapier.com** (darmowe konto)
2. Kliknij **"Create Zap"**

#### Trigger (Wyzwalacz):
- Wyszukaj: **"Facebook Lead Ads"**
- Wybierz: **"New Lead"**
- Połącz konto Facebook
- Wybierz formularz Lead Ads
- Przetestuj

#### Action (Akcja):
- Wyszukaj: **"Webhooks by Zapier"**
- Wybierz: **"POST"**
- **URL**: `https://twoja-aplikacja.vercel.app/api/facebook-leads`
  (Zamień na URL z Vercel!)
- **Method**: POST
- **Data**: Dodaj pola:
  ```json
  {
    "first_name": "{{first_name}}",
    "last_name": "{{last_name}}",
    "phone_number": "{{phone_number}}",
    "email": "{{email}}",
    "full_name": "{{full_name}}",
    "custom_questions": "{{custom_questions}}"
  }
  ```
- Przetestuj
- **Włącz Zap** ✅

### Krok 3: Gotowe! 🎉

Teraz gdy ktoś wypełni formularz Facebook Lead Ads:
1. Lead trafia do Zapier
2. Zapier wysyła do Twojego endpointu
3. Aplikacja automatycznie sprawdza nowe leady co 30 sekund
4. Nowy lead pojawia się w sekcji **"Nowy kontakt"** ✨

## 🧪 Testowanie:

### Test 1: Sprawdź endpoint
Otwórz w przeglądarce:
```
https://twoja-aplikacja.vercel.app/api/facebook-leads
```
Powinien zwrócić błąd 405 (Method not allowed) - to OK!

### Test 2: Wyślij testowy lead
W Zapier użyj funkcji **"Test"** - powinien wysłać testowy lead

### Test 3: Sprawdź w aplikacji
- Otwórz aplikację
- Poczekaj max 30 sekund
- Sprawdź sekcję **"Nowy kontakt"**
- Powinien pojawić się nowy lead! 🎯

## 📝 Ważne uwagi:

1. **API URL**: Aplikacja automatycznie używa URL z Vercel
   - Jeśli chcesz użyć własnej domeny, ustaw zmienną środowiskową `VITE_API_URL`

2. **Częstotliwość sprawdzania**: Aplikacja sprawdza co 30 sekund
   - Możesz zmienić w `App.jsx` (linia z `setInterval`)

3. **Przypisanie chiropraktyka**: Leady są automatycznie przypisywane do aktualnie zalogowanego chiropraktyka

4. **Pamięć**: Obecna implementacja używa pamięci serwera (tymczasowe)
   - Dla produkcji zalecam dodać bazę danych (Supabase)

## 🔧 Rozwiązywanie problemów:

**Leady nie pojawiają się?**
- Sprawdź czy Zapier jest włączony
- Sprawdź logi w Vercel Dashboard
- Sprawdź konsolę przeglądarki (F12)

**Endpoint nie działa?**
- Sprawdź czy aplikacja jest wdrożona na Vercel
- Sprawdź czy URL w Zapier jest poprawny
- Sprawdź logi w Vercel

## 📚 Więcej informacji:

Zobacz pełną dokumentację: `README-FACEBOOK-INTEGRATION.md`
