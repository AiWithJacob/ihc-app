# 🔍 Rozwiązywanie problemów z webhookiem Make.com

## Problem: "Ładuje się i nic nie pojawia"

Sprawdźmy krok po kroku, gdzie może być problem.

---

## Krok 1: Sprawdź Execution history w Make.com

### 1.1. Otwórz Execution history

1. W Make.com kliknij na Scenario (ten z webhookiem)
2. Kliknij **"Execution history"** (lub ikonę zegara/historii)
3. Zobaczysz listę wszystkich wykonanych scenariuszy

### 1.2. Sprawdź ostatnie wykonanie

1. Kliknij na najnowsze wykonanie (na górze listy)
2. Zobaczysz wizualizację wykonania z modułami:
   - **Moduł 1:** Webhook (powinien być zielony ✅)
   - **Moduł 2:** HTTP Request (sprawdź kolor)

### 1.3. Sprawdź status modułów

**Jeśli moduł jest zielony ✅:**
- Wszystko działa poprawnie
- Kliknij na moduł, aby zobaczyć szczegóły

**Jeśli moduł jest czerwony ❌:**
- Wystąpił błąd
- Kliknij na moduł, aby zobaczyć szczegóły błędu
- Sprawdź komunikat błędu

**Jeśli moduł jest szary ⏸️:**
- Moduł nie został wykonany
- Sprawdź czy poprzedni moduł zakończył się sukcesem

---

## Krok 2: Sprawdź szczegóły wykonania

### 2.1. Kliknij na moduł HTTP Request

1. W Execution history kliknij na moduł **"HTTP Request"** (moduł 2)
2. Zobaczysz szczegóły:
   - **Request:** Co zostało wysłane
   - **Response:** Co zostało zwrócone

### 2.2. Sprawdź Response

W sekcji **"Response"** powinieneś zobaczyć:

**Jeśli sukces:**
```json
{
  "success": true,
  "lead": {
    "id": 123,
    "name": "Jan Testowy",
    ...
  },
  "message": "Lead saved to Supabase successfully"
}
```

**Jeśli błąd:**
```json
{
  "error": "Database error",
  "message": "..."
}
```

---

## Krok 3: Sprawdź w aplikacji IHC

### 3.1. Otwórz aplikację

1. Otwórz: https://ihc-app.vercel.app
2. Zaloguj się (jeśli wymagane)

### 3.2. Sprawdź Kontakty

1. Przejdź do **Kontakty**
2. Sprawdź kolumnę **"Nowy kontakt"**
3. Czy widzisz lead "Jan Testowy" (lub inny testowy lead)?

**Jeśli NIE widzisz leada:**
- Sprawdź czy jesteś zalogowany jako właściwy chiropraktyk
- Sprawdź czy `chiropractor` w Query String jest poprawny
- Odśwież stronę (F5)

### 3.3. Sprawdź audit log

1. Przejdź do **Historia zmian**
2. Filtruj po źródle: **"Webhook"**
3. Sprawdź czy są wpisy z `user_login: 'make_webhook'`

**Jeśli NIE ma wpisów:**
- Webhook nie dotarł do endpointu
- Sprawdź Execution history w Make.com

---

## Krok 4: Sprawdź logi w Vercel

### 4.1. Otwórz Vercel Dashboard

1. Zaloguj się na https://vercel.com
2. Otwórz projekt **ihc-app**
3. Przejdź do **Functions** → **Logs**

### 4.2. Sprawdź logi endpointu

1. Znajdź funkcję: `api/facebook-leads`
2. Sprawdź ostatnie logi
3. Szukaj błędów lub komunikatów

**Co szukać:**
- `✅ Lead zapisany w Supabase` - sukces
- `❌ Błąd zapisywania leada` - błąd
- `Otrzymano lead z Make.com` - webhook dotarł

---

## Krok 5: Sprawdź konfigurację w Make.com

### 5.1. Sprawdź URL endpointu

W module HTTP Request sprawdź:
- **URL:** `https://ihc-app.vercel.app/api/facebook-leads`
- Czy URL jest poprawny? (bez spacji, bez błędów)

### 5.2. Sprawdź Query String

W module HTTP Request sprawdź:
- **Query parameters:** `chiropractor=default`
- Czy parametr jest poprawnie dodany?

### 5.3. Sprawdź Headers

W module HTTP Request sprawdź:
- **Header 1:** `X-Webhook-Source: make`
- **Header 2:** `Content-Type: application/json`
- Czy oba headery są dodane?

### 5.4. Sprawdź Body JSON

W module HTTP Request sprawdź:
- **Body content type:** `application/json`
- **Body:** Czy używa `{{1.nazwa_pola}}` (z podwójnymi nawiasami)?

**Przykład poprawnego Body:**
```json
{
  "first_name": "{{1.first_name}}",
  "last_name": "{{1.last_name}}",
  "phone_number": "{{1.phone_number}}",
  "email": "{{1.email}}",
  "custom_questions": "{{1.custom_questions}}"
}
```

---

## Krok 6: Przetestuj ponownie

### 6.1. Wyślij dane do webhooka

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
    "custom_questions": "Test lead"
  }'
```

### 6.2. Sprawdź Execution history

1. W Make.com sprawdź Execution history
2. Czy pojawiło się nowe wykonanie?
3. Czy oba moduły są zielone?

---

## Najczęstsze problemy i rozwiązania

### Problem 1: Moduł HTTP Request jest czerwony ❌

**Przyczyna:** Błąd w konfiguracji lub endpoint nie odpowiada

**Rozwiązanie:**
1. Sprawdź szczegóły błędu w Execution history
2. Sprawdź czy URL endpointu jest poprawny
3. Sprawdź czy Body JSON jest poprawnie sformatowany
4. Sprawdź logi w Vercel

### Problem 2: Moduł HTTP Request nie wykonuje się (szary)

**Przyczyna:** Webhook nie otrzymał danych lub poprzedni moduł nie zakończył się sukcesem

**Rozwiązanie:**
1. Sprawdź czy webhook otrzymał dane (moduł 1 - zielony?)
2. Wyślij dane do webhooka ponownie
3. Sprawdź czy Scenario jest włączony ("ON")

### Problem 3: Lead nie pojawia się w aplikacji

**Przyczyna:** Lead został zapisany, ale dla innego chiropraktyka lub błąd w zapisie

**Rozwiązanie:**
1. Sprawdź Response w Execution history - czy `success: true`?
2. Sprawdź czy `chiropractor` w Query String jest poprawny
3. Sprawdź audit log - czy lead został zapisany?
4. Sprawdź w bazie Supabase (jeśli masz dostęp)

### Problem 4: "Ładuje się i nic nie pojawia"

**Przyczyna:** Może być kilka:
- Webhook nie otrzymał danych
- Scenario nie jest włączony
- Błąd w konfiguracji

**Rozwiązanie:**
1. Sprawdź Execution history - czy są wykonania?
2. Sprawdź czy Scenario jest włączony ("ON")
3. Wyślij dane do webhooka ponownie
4. Sprawdź logi w Vercel

---

## Checklist diagnostyczny

- [ ] Sprawdzono Execution history w Make.com
- [ ] Sprawdzono status modułów (zielone/czerwone/szare)
- [ ] Sprawdzono Response w module HTTP Request
- [ ] Sprawdzono aplikację IHC (Kontakty)
- [ ] Sprawdzono audit log (Historia zmian)
- [ ] Sprawdzono logi w Vercel
- [ ] Sprawdzono konfigurację w Make.com (URL, Query, Headers, Body)
- [ ] Przetestowano ponownie (wysłano dane do webhooka)

---

## Co dalej?

Napisz mi:
1. **Co widzisz w Execution history?** (czy są wykonania? jakie kolory modułów?)
2. **Co widzisz w Response?** (sukces czy błąd? jaki komunikat?)
3. **Czy lead pojawia się w aplikacji?** (tak/nie)
4. **Czy są wpisy w audit log?** (tak/nie)

Na podstawie tego pomogę rozwiązać problem! 🚀
