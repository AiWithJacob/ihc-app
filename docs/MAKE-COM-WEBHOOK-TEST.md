# 🧪 Test Webhook w Make.com - Krok po kroku

## Widzę, że jesteś już w Make.com! 🎉

Teraz pokażę Ci dokładnie jak skonfigurować webhook do testów.

---

## Krok 1: Dodaj moduł "Custom webhook"

### 1.1. Kliknij na duży fioletowy przycisk "+" w środku ekranu

Widzisz duży fioletowy okrąg z białym plusem w środku? Kliknij na niego!

### 1.2. Wybierz "Custom webhook"

1. W prawym panelu widzisz sekcję **"TRIGGERS"**
2. Znajdź **"Custom webhook"** (z ikoną webhooka i tagiem "INSTANT")
3. Kliknij na **"Custom webhook"**

### 1.3. Skonfiguruj webhook

1. Zobaczysz okno konfiguracji
2. **Nazwa modułu:** Możesz zostawić domyślną lub zmienić na "Test Webhook"
3. Kliknij **"Save"** (lub **"OK"**)

### 1.4. Skopiuj URL webhooka

Po zapisaniu, Make.com wygeneruje unikalny URL webhooka, np.:
```
https://hook.integromat.com/xxxxx/yyyyy
```

**WAŻNE:** Skopiuj ten URL - będziesz go potrzebować do testów!

---

## Krok 2: Dodaj moduł "HTTP Request"

### 2.1. Kliknij na "+" po module webhook

Po dodaniu webhooka, zobaczysz kolejny fioletowy przycisk "+" - kliknij na niego.

### 2.2. Wyszukaj "HTTP"

1. W prawym panelu użyj wyszukiwarki na dole
2. Wpisz: **"HTTP"**
3. Wybierz: **"HTTP"** → **"Make an HTTP Request"**

### 2.3. Skonfiguruj HTTP Request

Wypełnij następujące pola:

#### Method:
- Wybierz: **POST**

#### URL:
```
https://ihc-app.vercel.app/api/facebook-leads
```

#### Query String:
Kliknij **"Add item"** i dodaj:
- **Name:** `chiropractor`
- **Value:** `default` (lub nazwa chiropraktyka)

#### Headers:
Kliknij **"Add item"** i dodaj:
- **Name:** `X-Webhook-Source`
- **Value:** `make`

Kliknij **"Add item"** ponownie i dodaj:
- **Name:** `Content-Type`
- **Value:** `application/json`

#### Body Type:
- Wybierz: **JSON**

#### Request Body (JSON):
Kliknij w pole i wklej:

```json
{
  "first_name": "{{1.first_name}}",
  "last_name": "{{1.last_name}}",
  "phone_number": "{{1.phone_number}}",
  "email": "{{1.email}}",
  "custom_questions": "{{1.custom_questions}}"
}
```

**Uwaga:** `{{1.nazwa_pola}}` oznacza pole z modułu 1 (webhook). Make.com automatycznie zamieni to na dane z webhooka.

### 2.4. Zapisz moduł

Kliknij **"OK"** lub **"Save"**

---

## Krok 3: Zapisz Scenario

1. Kliknij **"Save"** w lewym górnym rogu (lub Ctrl+S)
2. Nadaj nazwę Scenario: **"Test Webhook → IHC App"**

---

## Krok 4: Przetestuj webhook

### 4.1. Uruchom test w Make.com

1. Kliknij **"Run once"** (lub przycisk play ▶️)
2. Make.com wyświetli URL webhooka
3. **Skopiuj ten URL** - będziesz go potrzebować

### 4.2. Wyślij testowe dane do webhooka

Masz kilka opcji:

#### Opcja A: Użyj curl (jeśli masz zainstalowany)

Otwórz PowerShell lub Command Prompt i wpisz:

```powershell
curl -X POST "https://hook.integromat.com/xxxxx/yyyyy" `
  -H "Content-Type: application/json" `
  -d '{
    "first_name": "Jan",
    "last_name": "Testowy",
    "phone_number": "123456789",
    "email": "jan@example.com",
    "custom_questions": "Test lead z Make.com"
  }'
```

**Uwaga:** Zamień `https://hook.integromat.com/xxxxx/yyyyy` na rzeczywisty URL z Make.com!

#### Opcja B: Użyj Postman

1. Otwórz Postman
2. Method: **POST**
3. URL: Wklej URL webhooka z Make.com
4. Headers:
   - `Content-Type: application/json`
5. Body: Wybierz **"raw"** → **"JSON"** i wklej:
   ```json
   {
     "first_name": "Jan",
     "last_name": "Testowy",
     "phone_number": "123456789",
     "email": "jan@example.com",
     "custom_questions": "Test lead z Make.com"
   }
   ```
6. Kliknij **"Send"**

#### Opcja C: Użyj strony testowej (jeśli możesz otworzyć)

1. Otwórz `test-webhook.html` w przeglądarce
2. W polu **"URL Endpoint"** wklej URL webhooka z Make.com (zamiast endpointu IHC)
3. Wypełnij dane testowe
4. Kliknij **"🚀 Wyślij Webhook"**

---

## Krok 5: Sprawdź wyniki

### 5.1. W Make.com

1. Sprawdź **Execution history** (historia wykonania)
2. Kliknij na wykonanie
3. Sprawdź moduł **"HTTP Request"**:
   - ✅ Zielony = sukces
   - ❌ Czerwony = błąd
4. Kliknij na moduł, aby zobaczyć odpowiedź

### 5.2. W aplikacji IHC

1. Otwórz aplikację: https://ihc-app.vercel.app
2. Przejdź do **Kontakty**
3. Sprawdź czy lead pojawił się w kolumnie **"Nowy kontakt"**

### 5.3. W audit log

1. W aplikacji przejdź do **Historia zmian**
2. Filtruj po źródle: **"Webhook"**
3. Sprawdź ostatni wpis:
   - `user_login: 'make_webhook'` ✅
   - `source: 'webhook'` ✅
   - `table_name: 'leads'` ✅

---

## ✅ Jeśli wszystko działa

1. **Aktywuj Scenario:**
   - Kliknij przełącznik **"ON"** w prawym górnym rogu
   - Scenario będzie automatycznie wykonywać się przy każdym webhooku

2. **Monitoruj:**
   - Sprawdzaj Execution history w Make.com
   - Sprawdzaj audit log w aplikacji

---

## ❌ Jeśli coś nie działa

### Problem: HTTP Request zwraca błąd

**Sprawdź:**
1. Czy URL endpointu jest poprawny: `https://ihc-app.vercel.app/api/facebook-leads`
2. Czy Query String zawiera `chiropractor=default`
3. Czy Body JSON jest poprawnie sformatowany
4. Sprawdź Execution history → kliknij na moduł HTTP Request → zobacz szczegóły błędu

### Problem: Lead nie pojawia się w aplikacji

**Sprawdź:**
1. Czy HTTP Request zwrócił `success: true` (sprawdź Execution history)
2. Czy `chiropractor` jest poprawnie ustawiony
3. Odśwież aplikację (F5)

### Problem: Audit log pokazuje `zapier_webhook` zamiast `make_webhook`

**Sprawdź:**
1. Czy dodałeś header `X-Webhook-Source: make` w HTTP Request
2. Sprawdź Execution history → moduł HTTP Request → Headers

---

## 📝 Checklist

- [ ] Dodano moduł "Custom webhook"
- [ ] Skopiowano URL webhooka
- [ ] Dodano moduł "HTTP Request"
- [ ] Skonfigurowano URL: `https://ihc-app.vercel.app/api/facebook-leads`
- [ ] Dodano Query String: `chiropractor=default`
- [ ] Dodano Headers: `X-Webhook-Source: make` i `Content-Type: application/json`
- [ ] Skonfigurowano Body JSON z mapowaniem pól
- [ ] Zapisano Scenario
- [ ] Przetestowano webhook (curl/Postman/strona testowa)
- [ ] Zweryfikowano w aplikacji (lead się pojawił)
- [ ] Zweryfikowano audit log (`make_webhook`)
- [ ] Aktywowano Scenario ("ON")

---

## 🎉 Gotowe!

Po wykonaniu wszystkich kroków, webhook będzie działał i będziesz mógł testować bez Facebook Lead Ads!

**Następny krok:** Gdy będziesz gotowy, skonfiguruj Make.com z Facebook Lead Ads (patrz: `MAKE-COM-SETUP.md`)
