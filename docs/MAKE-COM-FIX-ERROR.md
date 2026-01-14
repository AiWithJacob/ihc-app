# 🔧 Naprawa błędu "Unexpected token 'T'" w webhooku Make.com

## Problem

Gdy wysyłasz dane do webhooka Make.com i widzisz błąd:
```
Błąd połączenia: Unexpected token 'T', "There is n"... is not valid JSON
```

**To jest normalne!** ✅

## Dlaczego to się dzieje?

Webhook Make.com zwraca odpowiedź HTML/tekst zamiast JSON, gdy:
- Webhook nie ma jeszcze skonfigurowanego modułu HTTP Request
- Webhook otrzymał dane, ale nie wie co z nimi zrobić

## Rozwiązanie

Musisz dodać moduł **HTTP Request** w Make.com, który przekieruje dane do endpointu IHC.

---

## Krok po kroku - Dodaj moduł HTTP Request

### Krok 1: Wróć do Make.com

1. Otwórz Make.com w przeglądarce
2. Znajdź Scenario z webhookiem (ten, który właśnie utworzyłeś)
3. Kliknij na Scenario, aby go otworzyć

### Krok 2: Dodaj moduł HTTP Request

1. **Kliknij na "+"** po module webhook (duży fioletowy przycisk z plusem)
2. **Wyszukaj:** "HTTP"
3. **Wybierz:** "HTTP" → "Make an HTTP Request"

### Krok 3: Skonfiguruj HTTP Request

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

### Krok 4: Zapisz

1. Kliknij **"OK"** lub **"Save"**
2. Kliknij **"Save"** w lewym górnym rogu Scenario

---

## Krok 5: Przetestuj ponownie

### 5.1. W Make.com

1. Kliknij **"Run once"** (lub przycisk play ▶️)
2. Make.com wykona Scenario z ostatnimi danymi

### 5.2. Wyślij dane do webhooka

Użyj strony testowej lub curl:

**Strona testowa:**
1. Otwórz `test-webhook.html`
2. W polu "URL Endpoint" wklej: `https://hook.us2.make.com/vl333agh8o86ayel2myt2y54j8c54fp3`
3. Wypełnij dane testowe
4. Kliknij **"🚀 Wyślij Webhook"**

**Lub curl:**
```powershell
curl -X POST "https://hook.us2.make.com/vl333agh8o86ayel2myt2y54j8c54fp3" `
  -H "Content-Type: application/json" `
  -d '{
    "first_name": "Jan",
    "last_name": "Testowy",
    "phone_number": "123456789",
    "email": "jan@example.com",
    "custom_questions": "Test lead z Make.com"
  }'
```

### 5.3. Sprawdź wyniki

1. **W Make.com:**
   - Otwórz **Execution history**
   - Sprawdź czy webhook otrzymał dane (moduł 1 - zielony)
   - Sprawdź czy HTTP Request został wykonany (moduł 2 - zielony)
   - Kliknij na moduł HTTP Request → zobacz odpowiedź (powinno być `{"success": true, ...}`)

2. **W aplikacji IHC:**
   - Otwórz: https://ihc-app.vercel.app
   - Przejdź do **Kontakty**
   - Sprawdź czy lead "Jan Testowy" pojawił się w kolumnie **"Nowy kontakt"**

3. **W audit log:**
   - Przejdź do **Historia zmian**
   - Filtruj po źródle: **"Webhook"**
   - Sprawdź czy ostatni wpis ma `user_login: 'make_webhook'`

---

## ✅ Jeśli wszystko działa

1. **Aktywuj Scenario:**
   - Kliknij przełącznik **"ON"** w prawym górnym rogu Make.com
   - Scenario będzie automatycznie wykonywać się przy każdym webhooku

2. **Monitoruj:**
   - Sprawdzaj Execution history w Make.com
   - Sprawdzaj audit log w aplikacji

---

## ❌ Jeśli nadal nie działa

### Problem: HTTP Request zwraca błąd 500

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

---

## 📝 Checklist

- [ ] Dodano moduł "HTTP Request" w Make.com
- [ ] Skonfigurowano URL: `https://ihc-app.vercel.app/api/facebook-leads`
- [ ] Dodano Query String: `chiropractor=default`
- [ ] Dodano Headers: `X-Webhook-Source: make` i `Content-Type: application/json`
- [ ] Skonfigurowano Body JSON z mapowaniem pól `{{1.nazwa_pola}}`
- [ ] Zapisano Scenario
- [ ] Przetestowano webhook (wysłano dane)
- [ ] Zweryfikowano w Make.com (Execution history - oba moduły zielone)
- [ ] Zweryfikowano w aplikacji (lead się pojawił)
- [ ] Zweryfikowano audit log (`make_webhook`)

---

## 🎉 Gotowe!

Po dodaniu modułu HTTP Request, webhook będzie działał poprawnie i dane będą przekierowywane do endpointu IHC!
