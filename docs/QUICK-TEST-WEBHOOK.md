# 🚀 Szybki test webhooka - Krok po kroku

## Metoda 1: Otwórz plik HTML bezpośrednio (Najłatwiejsze)

### Krok 1: Znajdź plik

1. Otwórz Eksplorator Windows (Windows + E)
2. Przejdź do folderu projektu:
   ```
   C:\Users\anita\OneDrive\Pulpit\Projekt Systemu\ihc_mvp\ihc-app
   ```
3. Znajdź plik: **`test-webhook.html`**

### Krok 2: Otwórz plik

**Opcja A: Podwójne kliknięcie**
- Kliknij dwukrotnie na plik `test-webhook.html`
- Plik otworzy się w domyślnej przeglądarce (Chrome, Edge, Firefox)

**Opcja B: Prawy przycisk myszy**
- Kliknij prawym przyciskiem na plik
- Wybierz **"Otwórz za pomocą"** → wybierz przeglądarkę (Chrome, Edge, Firefox)

**Opcja C: Przeciągnij i upuść**
- Otwórz przeglądarkę (Chrome, Edge, Firefox)
- Przeciągnij plik `test-webhook.html` do okna przeglądarki

### Krok 3: Użyj strony testowej

1. W przeglądarce zobaczysz formularz testowy
2. Wypełnij dane (lub kliknij **"📋 Wypełnij przykładowe dane"**)
3. Kliknij **"🚀 Wyślij Webhook"**
4. Sprawdź odpowiedź w sekcji **"📥 Response"**

---

## Metoda 2: Użyj lokalnego serwera (Jeśli Metoda 1 nie działa)

### Krok 1: Otwórz terminal w folderze projektu

1. Otwórz PowerShell lub Command Prompt
2. Przejdź do folderu:
   ```powershell
   cd "C:\Users\anita\OneDrive\Pulpit\Projekt Systemu\ihc_mvp\ihc-app"
   ```

### Krok 2: Uruchom lokalny serwer

**Opcja A: Python (jeśli masz zainstalowany)**
```powershell
python -m http.server 8000
```

**Opcja B: Node.js (jeśli masz zainstalowany)**
```powershell
npx http-server -p 8000
```

**Opcja C: PHP (jeśli masz zainstalowany)**
```powershell
php -S localhost:8000
```

### Krok 3: Otwórz w przeglądarce

1. Otwórz przeglądarkę
2. Przejdź do: `http://localhost:8000/test-webhook.html`

---

## Metoda 3: Wdróż na Vercel (Najlepsze rozwiązanie)

### Krok 1: Dodaj plik do projektu

Plik `test-webhook.html` jest już w folderze `ihc-app/`

### Krok 2: Wdróż na Vercel

1. Zaloguj się na https://vercel.com
2. Otwórz projekt `ihc-app`
3. Kliknij **"Deploy"** (lub commit i push do GitHub - automatyczny deploy)

### Krok 3: Otwórz w przeglądarce

1. Po deploy, otwórz: `https://ihc-app.vercel.app/test-webhook.html`
2. Użyj strony testowej

---

## Metoda 4: Użyj Make.com bezpośrednio (Bez strony testowej)

### Krok 1: Utwórz Scenario w Make.com

1. Zaloguj się na https://www.make.com
2. Kliknij **"Create a new scenario"**
3. Nazwa: **"Test Webhook → IHC App"**

### Krok 2: Dodaj moduł Webhooks

1. Kliknij **"+"** (dodaj moduł)
2. Wyszukaj: **"Webhooks"**
3. Wybierz: **"Custom webhook"** → **"Receive a webhook"**
4. Kliknij **"Save"**
5. **Skopiuj URL webhooka** (np. `https://hook.integromat.com/xxxxx`)

### Krok 3: Dodaj moduł HTTP Request

1. Kliknij **"+"** po module Webhooks
2. Wyszukaj: **"HTTP"**
3. Wybierz: **"Make an HTTP Request"**
4. Skonfiguruj:
   - **Method:** POST
   - **URL:** `https://ihc-app.vercel.app/api/facebook-leads`
   - **Query String:** `chiropractor=default`
   - **Header:** `X-Webhook-Source: make`
   - **Body Type:** JSON
   - **Body:**
     ```json
     {
       "first_name": "{{1.first_name}}",
       "last_name": "{{1.last_name}}",
       "phone_number": "{{1.phone_number}}",
       "email": "{{1.email}}",
       "custom_questions": "{{1.custom_questions}}"
     }
     ```

### Krok 4: Przetestuj z curl lub Postman

**Użyj curl:**
```bash
curl -X POST "https://hook.integromat.com/xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jan",
    "last_name": "Testowy",
    "phone_number": "123456789",
    "email": "jan@example.com",
    "custom_questions": "Test lead"
  }'
```

**Lub użyj Postman:**
- Method: POST
- URL: URL webhooka z Make.com
- Body: JSON z danymi testowymi

---

## 🎯 Najszybsza metoda (Rekomendowana)

**Jeśli masz plik `test-webhook.html` w folderze:**

1. **Otwórz Eksplorator Windows** (Windows + E)
2. **Przejdź do:** `C:\Users\anita\OneDrive\Pulpit\Projekt Systemu\ihc_mvp\ihc-app`
3. **Znajdź plik:** `test-webhook.html`
4. **Kliknij dwukrotnie** na plik
5. **Plik otworzy się w przeglądarce** ✅

---

## ❓ Problem: Plik nie otwiera się w przeglądarce

### Rozwiązanie 1: Zmień domyślną aplikację

1. Kliknij prawym przyciskiem na `test-webhook.html`
2. Wybierz **"Otwórz za pomocą"**
3. Wybierz przeglądarkę (Chrome, Edge, Firefox)
4. Zaznacz **"Zawsze używaj tej aplikacji do otwierania plików .html"**

### Rozwiązanie 2: Użyj przeglądarki bezpośrednio

1. Otwórz przeglądarkę (Chrome, Edge, Firefox)
2. Naciśnij **Ctrl + O** (Otwórz plik)
3. Przejdź do folderu: `C:\Users\anita\OneDrive\Pulpit\Projekt Systemu\ihc_mvp\ihc-app`
4. Wybierz plik `test-webhook.html`
5. Kliknij **"Otwórz"**

### Rozwiązanie 3: Skopiuj ścieżkę do przeglądarki

1. Kliknij prawym przyciskiem na plik `test-webhook.html`
2. Wybierz **"Kopiuj ścieżkę"** (lub **"Copy as path"**)
3. Otwórz przeglądarkę
4. Wklej ścieżkę do paska adresu (zamień `\` na `/`)
5. Naciśnij Enter

**Przykład ścieżki:**
```
file:///C:/Users/anita/OneDrive/Pulpit/Projekt%20Systemu/ihc_mvp/ihc-app/test-webhook.html
```

---

## ✅ Sprawdź czy działa

Po otwarciu pliku powinieneś zobaczyć:

1. **Tytuł:** "🧪 Test Webhook - IHC App"
2. **Formularz** z polami:
   - Imię
   - Nazwisko
   - Telefon
   - Email
   - Opis
   - Chiropraktyk
   - Źródło webhooka
3. **Przyciski:** "🚀 Wyślij Webhook", "📋 Wypełnij przykładowe dane", "🗑️ Wyczyść"

Jeśli widzisz to wszystko - **działa!** ✅

---

## 🆘 Nadal nie działa?

Napisz dokładnie:
1. Co się dzieje gdy próbujesz otworzyć plik?
2. Jaki błąd widzisz (jeśli jest)?
3. Którą metodę próbowałeś?

Pomogę rozwiązać problem! 🚀
