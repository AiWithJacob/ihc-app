# 🧪 Testowanie Webhooka - Instrukcja

## Przegląd

To narzędzie pozwala przetestować endpoint `/api/facebook-leads` bez konieczności konfiguracji Facebook Lead Ads. Możesz użyć tego do testów przed skonfigurowaniem Make.com.

---

## Metoda 1: Użyj strony testowej (Najłatwiejsze)

### Krok 1: Otwórz stronę testową

1. Otwórz plik `test-webhook.html` w przeglądarce
2. Lub wdróż na Vercel i otwórz: `https://ihc-app.vercel.app/test-webhook.html`

### Krok 2: Wypełnij dane testowe

1. **Imię:** np. "Jan"
2. **Nazwisko:** np. "Testowy"
3. **Telefon:** np. "123456789"
4. **Email:** np. "jan@example.com"
5. **Opis:** np. "Test lead z webhooka"
6. **Chiropraktyk:** np. "default" (lub nazwa chiropraktyka)
7. **Źródło webhooka:** Wybierz "Make.com" lub "Zapier"

### Krok 3: Wyślij webhook

1. Kliknij **"🚀 Wyślij Webhook"**
2. Sprawdź odpowiedź w sekcji **"📥 Response"**
3. Jeśli sukces, sprawdź w aplikacji czy lead się pojawił

---

## Metoda 2: Użyj Make.com Webhooks (Dla testów Make.com)

### Krok 1: Utwórz Scenario w Make.com

1. Zaloguj się na https://www.make.com
2. Kliknij **"Create a new scenario"**
3. Nazwa: **"Test Webhook → IHC App"**

### Krok 2: Dodaj moduł Webhooks

1. Kliknij **"+"** (dodaj moduł)
2. Wyszukaj: **"Webhooks"**
3. Wybierz: **"Custom webhook"** → **"Receive a webhook"**
4. Kliknij **"Save"**
5. **Skopiuj URL webhooka** - Make.com wygeneruje unikalny URL (np. `https://hook.integromat.com/xxxxx`)

### Krok 3: Dodaj moduł HTTP Request

1. Kliknij **"+"** po module Webhooks
2. Wyszukaj: **"HTTP"**
3. Wybierz: **"Make an HTTP Request"**
4. Skonfiguruj:
   - **Method:** POST
   - **URL:** `https://ihc-app.vercel.app/api/facebook-leads`
   - **Query String:**
     ```
     chiropractor: default
     ```
   - **Headers:**
     ```
     X-Webhook-Source: make
     ```
   - **Body Type:** JSON
   - **Body:** Mapuj pola z modułu Webhooks:
     ```json
     {
       "first_name": "{{1.first_name}}",
       "last_name": "{{1.last_name}}",
       "phone_number": "{{1.phone_number}}",
       "email": "{{1.email}}",
       "custom_questions": "{{1.custom_questions}}",
       "chiropractor": "default"
     }
     ```

### Krok 4: Przetestuj

1. **Opcja A: Użyj strony testowej**
   - Otwórz `test-webhook.html`
   - W polu **"URL Endpoint"** wklej URL webhooka z Make.com (zamiast endpointu IHC)
   - Wypełnij dane i wyślij
   - Make.com otrzyma dane i przekieruje do endpointu IHC

2. **Opcja B: Użyj curl**
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

3. **Opcja C: Użyj Postman**
   - Method: POST
   - URL: URL webhooka z Make.com
   - Body: JSON z danymi testowymi

### Krok 5: Sprawdź wyniki

1. W Make.com → **Execution history** → sprawdź czy Scenario się wykonał
2. W aplikacji IHC → **Kontakty** → sprawdź czy lead się pojawił
3. W aplikacji IHC → **Historia zmian** → filtruj po źródle "Webhook" → sprawdź `user_login: 'make_webhook'`

---

## Metoda 3: Użyj curl (Dla zaawansowanych)

### Podstawowy test:

```bash
curl -X POST "https://ihc-app.vercel.app/api/facebook-leads?chiropractor=default" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Source: make" \
  -d '{
    "first_name": "Jan",
    "last_name": "Testowy",
    "phone_number": "123456789",
    "email": "jan@example.com",
    "custom_questions": "Test lead z curl"
  }'
```

### Z User-Agent Make.com:

```bash
curl -X POST "https://ihc-app.vercel.app/api/facebook-leads?chiropractor=default" \
  -H "Content-Type: application/json" \
  -H "User-Agent: make.com/1.0" \
  -H "X-Webhook-Source: make" \
  -d '{
    "first_name": "Jan",
    "last_name": "Testowy",
    "phone_number": "123456789",
    "email": "jan@example.com",
    "custom_questions": "Test lead z curl"
  }'
```

---

## Metoda 4: Użyj Postman

### Krok 1: Utwórz nowy Request

1. Otwórz Postman
2. Kliknij **"New"** → **"HTTP Request"**

### Krok 2: Skonfiguruj Request

- **Method:** POST
- **URL:** `https://ihc-app.vercel.app/api/facebook-leads?chiropractor=default`
- **Headers:**
  ```
  Content-Type: application/json
  X-Webhook-Source: make
  ```
- **Body:** Wybierz **"raw"** → **"JSON"**
- **Body content:**
  ```json
  {
    "first_name": "Jan",
    "last_name": "Testowy",
    "phone_number": "123456789",
    "email": "jan@example.com",
    "custom_questions": "Test lead z Postman"
  }
  ```

### Krok 3: Wyślij Request

1. Kliknij **"Send"**
2. Sprawdź odpowiedź w sekcji **"Response"**

---

## Sprawdzanie wyników

### 1. Sprawdź odpowiedź webhooka

Odpowiedź powinna wyglądać tak:
```json
{
  "success": true,
  "lead": {
    "id": 123,
    "name": "Jan Testowy",
    "phone": "123456789",
    ...
  },
  "message": "Lead saved to Supabase successfully",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

### 2. Sprawdź w aplikacji

1. Otwórz aplikację: https://ihc-app.vercel.app
2. Przejdź do **Kontakty**
3. Sprawdź czy lead pojawił się w kolumnie **"Nowy kontakt"**

### 3. Sprawdź audit log

1. W aplikacji przejdź do **Historia zmian**
2. Filtruj po źródle: **"Webhook"**
3. Sprawdź ostatni wpis:
   - `user_login: 'make_webhook'` (lub `'zapier_webhook'`)
   - `source: 'webhook'`
   - `table_name: 'leads'`
   - `action: 'INSERT'`

---

## Troubleshooting

### Problem: Webhook zwraca błąd 500

**Rozwiązanie:**
1. Sprawdź format JSON (czy jest poprawny)
2. Sprawdź czy wszystkie wymagane pola są wypełnione
3. Sprawdź logi w Vercel (Functions → Logs)

### Problem: Lead nie pojawia się w aplikacji

**Rozwiązanie:**
1. Sprawdź odpowiedź webhooka - czy `success: true`
2. Sprawdź czy `chiropractor` jest poprawnie ustawiony
3. Sprawdź logi w Vercel
4. Odśwież aplikację (F5)

### Problem: Audit log pokazuje `zapier_webhook` zamiast `make_webhook`

**Rozwiązanie:**
1. Sprawdź czy dodałeś header `X-Webhook-Source: make`
2. Sprawdź czy User-Agent zawiera `make.com`
3. Sprawdź czy kod został zaktualizowany (patrz: `api/facebook-leads.js`)

---

## Przykładowe dane testowe

### Minimalne dane (wymagane):

```json
{
  "first_name": "Jan",
  "last_name": "Testowy",
  "phone_number": "123456789"
}
```

### Pełne dane:

```json
{
  "first_name": "Jan",
  "last_name": "Testowy",
  "phone_number": "123456789",
  "email": "jan.testowy@example.com",
  "custom_questions": "Test lead z webhooka - sprawdzenie działania endpointu",
  "chiropractor": "default"
}
```

---

## Następne kroki

Po pomyślnym teście webhooka:

1. ✅ Skonfiguruj Make.com z Facebook Lead Ads (patrz: `MAKE-COM-SETUP.md`)
2. ✅ Przetestuj z rzeczywistymi leadami z Facebook
3. ✅ Wyłącz Zapier (jeśli jeszcze działa)
4. ✅ Monitoruj Execution history w Make.com

---

## Kontakt

W razie problemów:
1. Sprawdź logi w Vercel (Functions → Logs)
2. Sprawdź audit log w aplikacji
3. Sprawdź Execution history w Make.com (jeśli używasz)
