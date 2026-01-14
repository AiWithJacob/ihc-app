# Konfiguracja Make.com - Krok po kroku

## 📋 Wymagania wstępne

- ✅ Konto Make.com (zarejestruj się na https://www.make.com)
- ✅ Konto Facebook z dostępem do Lead Ads
- ✅ URL endpointu: `https://ihc-app.vercel.app/api/facebook-leads`
- ✅ Nazwa chiropraktyka (np. "Dr. Kowalski")

---

## 🚀 Krok 1: Utwórz Scenario w Make.com

### 1.1. Zaloguj się do Make.com

1. Przejdź na https://www.make.com
2. Zaloguj się do swojego konta
3. Kliknij **"Create a new scenario"** (lub **"Scenarios"** → **"Create a new scenario"**)

### 1.2. Nazwij Scenario

- **Nazwa:** `Facebook Lead Ads → IHC App`
- Kliknij **"OK"** lub **"Create"**

---

## 🔗 Krok 2: Dodaj trigger Facebook Lead Ads

### 2.1. Wybierz moduł triggera

1. W nowym Scenario, kliknij **"+"** (dodaj moduł)
2. Wyszukaj: **"Facebook Lead Ads"**
3. Wybierz: **"Facebook Lead Ads"** → **"New Lead"**

### 2.2. Połącz z Facebook

1. Jeśli jeszcze nie połączyłeś konta Facebook:
   - Kliknij **"Add"** obok "Connection"
   - Zaloguj się do Facebook
   - Zezwól Make.com na dostęp do Lead Ads
   - Kliknij **"Save"**

2. Jeśli już masz połączenie:
   - Wybierz istniejące połączenie z listy

### 2.3. Wybierz formularz Lead Ads

1. W polu **"Form"** wybierz formularz Lead Ads z Facebook
2. Kliknij **"OK"** lub **"Save"**

**✅ Trigger jest gotowy!** Powinieneś zobaczyć moduł "Facebook Lead Ads" w Scenario.

---

## 📤 Krok 3: Dodaj moduł HTTP Request

### 3.1. Dodaj moduł HTTP

1. Kliknij **"+"** po module Facebook Lead Ads
2. Wyszukaj: **"HTTP"**
3. Wybierz: **"HTTP"** → **"Make an HTTP Request"**

### 3.2. Skonfiguruj HTTP Request

#### Method:
- Wybierz: **POST**

#### URL:
```
https://ihc-app.vercel.app/api/facebook-leads
```

#### Query String Parameters:
Kliknij **"Add item"** i dodaj:
- **Name:** `chiropractor`
- **Value:** `[NAZWA_CHIROPRACTOR]` (np. "Dr. Kowalski")

**Przykład:**
```
chiropractor: Dr. Kowalski
```

#### Headers (opcjonalnie):
Kliknij **"Add item"** i dodaj (dla rozróżnienia Make/Zapier w audit log):
- **Name:** `X-Webhook-Source`
- **Value:** `make`

#### Body Type:
- Wybierz: **JSON**

#### Request Body (JSON):
Kliknij w pole i użyj mapowania pól z Facebook Lead Ads:

```json
{
  "first_name": "{{1.first_name}}",
  "last_name": "{{1.last_name}}",
  "phone_number": "{{1.phone_number}}",
  "email": "{{1.email}}",
  "custom_questions": "{{1.custom_questions}}",
  "chiropractor": "[NAZWA_CHIROPRACTOR]"
}
```

**⚠️ WAŻNE:** 
- `{{1.nazwa_pola}}` oznacza pole z modułu 1 (Facebook Lead Ads trigger)
- W Make.com użyj `{{1.nazwa_pola}}` zamiast `{{trigger.nazwa_pola}}`
- Zamień `[NAZWA_CHIROPRACTOR]` na rzeczywistą nazwę chiropraktyka (lub użyj zmiennej)

**Jak mapować pola:**
1. Kliknij w pole JSON (np. `"first_name": ""`)
2. Kliknij ikonę **"{{}}"** (mapowanie)
3. Wybierz moduł **"1. Facebook Lead Ads"**
4. Wybierz pole (np. `first_name`)
5. Powtórz dla wszystkich pól

#### Przykładowe mapowanie pól:

| Pole w JSON | Mapowanie w Make.com |
|-------------|---------------------|
| `first_name` | `{{1.first_name}}` |
| `last_name` | `{{1.last_name}}` |
| `phone_number` | `{{1.phone_number}}` |
| `email` | `{{1.email}}` |
| `custom_questions` | `{{1.custom_questions}}` |
| `chiropractor` | `"Dr. Kowalski"` (lub zmienna) |

### 3.3. Zapisz moduł

1. Kliknij **"OK"** lub **"Save"**

**✅ HTTP Request jest gotowy!** Powinieneś zobaczyć dwa moduły w Scenario.

---

## 🧪 Krok 4: Przetestuj Scenario

### 4.1. Uruchom test

1. Kliknij **"Run once"** (lub **"Test"**)
2. Make.com wykona Scenario z ostatnim leadem z Facebook
3. Sprawdź **Execution history** (historia wykonania)

### 4.2. Sprawdź wyniki

1. Kliknij na wykonanie w **Execution history**
2. Sprawdź moduł **"HTTP Request"**:
   - ✅ Status: **"Success"** (zielony)
   - ✅ Response: powinien zwrócić `{"success": true, ...}`
   - ❌ Jeśli błąd: sprawdź szczegóły błędu

### 4.3. Sprawdź w aplikacji

1. Otwórz aplikację IHC: https://ihc-app.vercel.app
2. Przejdź do **Kontakty**
3. Sprawdź czy nowy lead pojawił się w kolumnie **"Nowy kontakt"**

### 4.4. Sprawdź audit log

1. W aplikacji przejdź do **Historia zmian**
2. Filtruj po źródle: **"Webhook"**
3. Sprawdź czy ostatni lead ma:
   - `user_login: 'make_webhook'`
   - `source: 'webhook'`

---

## ✅ Krok 5: Aktywuj Scenario

### 5.1. Włącz automatyczne wykonywanie

1. Jeśli test działa poprawnie, kliknij **"Turn on"** (lub przełącznik w prawym górnym rogu)
2. Scenario będzie teraz automatycznie wykonywać się przy każdym nowym leadzie z Facebook

### 5.2. Sprawdź status

- Scenario powinien pokazywać status: **"ON"** (zielony)
- Make.com będzie teraz automatycznie przekazywać leady do aplikacji

---

## 🔄 Krok 6: Dezaktywuj Zapier (opcjonalnie)

### 6.1. Wyłącz Zap w Zapier

1. Otwórz Zapier: https://zapier.com
2. Przejdź do **"My Zaps"**
3. Znajdź Zap **"Facebook Lead Ads → IHC App"**
4. Kliknij **"Turn off"** (lub przełącznik)

### 6.2. Zweryfikuj, że Make.com działa

1. Poczekaj na nowy lead z Facebook
2. Sprawdź w Make.com → Execution history → czy Scenario się wykonał
3. Sprawdź w aplikacji → czy lead pojawił się w Kontaktach

---

## 📊 Monitorowanie

### Sprawdzanie logów w Make.com:

1. Przejdź do **"Scenarios"**
2. Kliknij na Scenario **"Facebook Lead Ads → IHC App"**
3. Kliknij **"Execution history"**
4. Zobaczysz wszystkie wykonania Scenario:
   - ✅ Zielone = sukces
   - ❌ Czerwone = błąd
   - Kliknij na wykonanie, aby zobaczyć szczegóły

### Sprawdzanie w aplikacji:

1. **Kontakty** → sprawdź czy leady trafiają
2. **Historia zmian** → filtruj po źródle "Webhook" → sprawdź `user_login: 'make_webhook'`

---

## 🐛 Troubleshooting

### Problem: Scenario nie wykonuje się

**Rozwiązanie:**
1. Sprawdź czy Scenario jest **"ON"** (włączony)
2. Sprawdź czy trigger Facebook Lead Ads jest poprawnie skonfigurowany
3. Sprawdź czy formularz Lead Ads w Facebook jest aktywny

### Problem: HTTP Request zwraca błąd 500

**Rozwiązanie:**
1. Sprawdź format JSON w Body
2. Sprawdź czy wszystkie wymagane pola są mapowane
3. Sprawdź logi w Vercel (Functions → Logs)

### Problem: Lead nie pojawia się w aplikacji

**Rozwiązanie:**
1. Sprawdź Execution history w Make.com → czy HTTP Request zwrócił `success: true`
2. Sprawdź logi w Vercel → czy endpoint otrzymał dane
3. Sprawdź czy `chiropractor` jest poprawnie ustawiony

### Problem: Audit log pokazuje `zapier_webhook` zamiast `make_webhook`

**Rozwiązanie:**
1. Sprawdź czy dodałeś header `X-Webhook-Source: make` w HTTP Request
2. Sprawdź czy kod został zaktualizowany (patrz: `api/facebook-leads.js`)

---

## 📝 Checklist konfiguracji

- [ ] Utworzono konto Make.com
- [ ] Utworzono Scenario "Facebook Lead Ads → IHC App"
- [ ] Dodano trigger "Facebook Lead Ads" → "New Lead"
- [ ] Połączono z kontem Facebook
- [ ] Wybrano formularz Lead Ads
- [ ] Dodano moduł "HTTP Request"
- [ ] Skonfigurowano URL: `https://ihc-app.vercel.app/api/facebook-leads`
- [ ] Dodano Query String: `chiropractor=[NAZWA]`
- [ ] Dodano Header: `X-Webhook-Source: make` (opcjonalnie)
- [ ] Skonfigurowano Body JSON z mapowaniem pól
- [ ] Przetestowano Scenario ("Run once")
- [ ] Zweryfikowano w aplikacji (lead pojawił się)
- [ ] Zweryfikowano audit log (`make_webhook`)
- [ ] Aktywowano Scenario ("Turn on")
- [ ] (Opcjonalnie) Wyłączono Zap w Zapier

---

## 🎉 Gotowe!

Po wykonaniu wszystkich kroków, Make.com będzie automatycznie przekazywać leady z Facebook Lead Ads do aplikacji IHC.

**Następne kroki:**
- Monitoruj Execution history w Make.com
- Sprawdzaj audit log w aplikacji
- W razie problemów, sprawdź sekcję Troubleshooting

---

## 📞 Wsparcie

W razie problemów:
1. Sprawdź dokumentację Make.com: https://www.make.com/en/help
2. Sprawdź logi w Make.com (Execution history)
3. Sprawdź logi w Vercel (Functions → Logs)
4. Sprawdź audit log w aplikacji
