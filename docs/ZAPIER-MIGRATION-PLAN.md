# Plan migracji z Zapier do Make.com

## Obecny stan - Zapier

### Gdzie jest używany Zapier:

1. **Endpoint webhook:** `/api/facebook-leads.js`
   - Odbiera leady z Facebook Lead Ads przez Zapier
   - Ustawia `source: 'webhook'` w audit log
   - Ustawia `login: 'zapier_webhook'` w kontekście użytkownika

### Jak działa obecnie:

1. **Facebook Lead Ads** → wysyła lead do Zapier
2. **Zapier** → przetwarza lead i wysyła do endpointu `/api/facebook-leads`
3. **Endpoint** → zapisuje lead do Supabase z `source: 'webhook'`

### Konfiguracja Zapier:

- **App:** "Webhooks by Zapier"
- **Action:** "POST" do URL endpointu
- **URL:** `https://ihc-app.vercel.app/api/facebook-leads?chiropractor=NAZWA_CHIROPRACTOR`
- **Method:** POST
- **Data:** JSON z danymi leada z Facebook

---

## Plan migracji do Make.com

### Krok 1: Przygotowanie (15 min)

1. **Utwórz konto Make.com**
   - Zarejestruj się na https://www.make.com
   - Wybierz plan (Make.com jest tańszy niż Zapier)

2. **Pobierz dane z Zapier**
   - Otwórz istniejący Zap w Zapier
   - Skopiuj format danych wysyłanych do endpointu
   - Zapisz mapowanie pól (np. `first_name`, `last_name`, `phone_number`)

### Krok 2: Konfiguracja Make.com (20 min)

1. **Utwórz nowy Scenario w Make.com**
   - Kliknij "Create a new scenario"
   - Nazwa: "Facebook Lead Ads → IHC App"

2. **Dodaj trigger: Facebook Lead Ads**
   - Wyszukaj: "Facebook Lead Ads"
   - Wybierz: "New Lead"
   - Połącz z kontem Facebook (jeśli jeszcze nie połączone)
   - Wybierz formularz Lead Ads

3. **Dodaj moduł: HTTP Request**
   - Wyszukaj: "HTTP"
   - Wybierz: "Make an HTTP Request"
   - **Method:** POST
   - **URL:** `https://ihc-app.vercel.app/api/facebook-leads`
   - **Query String:**
     ```
     chiropractor={{nazwa_chiropraktyka}}
     ```
   - **Body Type:** JSON
   - **Body:** Mapuj pola z Facebook Lead Ads:
     ```json
     {
       "first_name": "{{trigger.first_name}}",
       "last_name": "{{trigger.last_name}}",
       "phone_number": "{{trigger.phone_number}}",
       "email": "{{trigger.email}}",
       "custom_questions": "{{trigger.custom_questions}}",
       "chiropractor": "{{nazwa_chiropraktyka}}"
     }
     ```

4. **Zapisz i aktywuj Scenario**
   - Kliknij "Save"
   - Kliknij "Run once" aby przetestować
   - Jeśli działa, kliknij "Turn on" aby aktywować

### Krok 3: Testowanie (10 min)

1. **Wyślij test lead z Facebook Lead Ads**
   - Utwórz test lead w Facebook Lead Ads
   - Sprawdź czy lead trafił do Make.com
   - Sprawdź czy lead został wysłany do endpointu
   - Sprawdź czy lead pojawił się w aplikacji

2. **Sprawdź audit log**
   - Otwórz aplikację → Historia zmian
   - Filtruj po źródle: "Webhook"
   - Sprawdź czy lead ma `source: 'webhook'` i `user_login: 'zapier_webhook'` (lub nowy login dla Make)

### Krok 4: Aktualizacja kodu (opcjonalnie) (10 min)

Jeśli chcesz rozróżnić Make od Zapier w audit log:

1. **Zaktualizuj `/api/facebook-leads.js`:**
   ```javascript
   // Sprawdź User-Agent lub dodaj custom header
   const isMake = req.headers['user-agent']?.includes('make.com') || 
                  req.headers['x-webhook-source'] === 'make';
   
   const userContext = {
     id: null,
     login: isMake ? 'make_webhook' : 'zapier_webhook',
     email: null,
     chiropractor: newLead.chiropractor,
     source: 'webhook',
     session_id: `webhook_${Date.now()}`
   };
   ```

2. **Lub dodaj custom header w Make.com:**
   - W module HTTP Request → Headers
   - Dodaj: `X-Webhook-Source: make`

### Krok 5: Dezaktywacja Zapier (5 min)

1. **Wyłącz Zap w Zapier**
   - Otwórz Zapier → Twoje Zaps
   - Znajdź Zap "Facebook Lead Ads → IHC App"
   - Kliknij "Turn off"

2. **Zweryfikuj że Make.com działa**
   - Poczekaj na nowy lead z Facebook
   - Sprawdź czy lead trafił do aplikacji
   - Sprawdź audit log

3. **Usuń Zap z Zapier (opcjonalnie)**
   - Jeśli wszystko działa, możesz usunąć stary Zap

---

## Różnice między Zapier a Make.com

### Zalety Make.com:

1. **Tańszy** - niższe ceny niż Zapier
2. **Więcej operacji** - więcej darmowych operacji w planie podstawowym
3. **Lepszy interfejs** - bardziej wizualny i intuicyjny
4. **Więcej integracji** - większa biblioteka dostępnych aplikacji

### Różnice w konfiguracji:

1. **Make.com używa "Scenarios" zamiast "Zaps"**
2. **Mapowanie pól jest bardziej wizualne**
3. **Testowanie jest łatwiejsze** - "Run once" działa lepiej

---

## Troubleshooting

### Problem: Lead nie trafia do aplikacji

**Rozwiązanie:**
1. Sprawdź logi w Make.com (Execution history)
2. Sprawdź czy endpoint zwraca 200 OK
3. Sprawdź format danych w Body (JSON)
4. Sprawdź czy `chiropractor` jest ustawiony w Query String

### Problem: Lead trafia, ale bez danych

**Rozwiązanie:**
1. Sprawdź mapowanie pól w Make.com
2. Sprawdź czy pola z Facebook Lead Ads mają poprawne nazwy
3. Sprawdź logi w Make.com - zobacz jakie dane są wysyłane

### Problem: Audit log nie pokazuje źródła

**Rozwiązanie:**
1. Sprawdź czy `source: 'webhook'` jest ustawione w `userContext`
2. Sprawdź czy `setAuditContextForAPI` jest wywoływane
3. Sprawdź czy `metadata.source` jest zapisywane w audit log

---

## Checklist migracji

- [ ] Utworzono konto Make.com
- [ ] Utworzono Scenario w Make.com
- [ ] Skonfigurowano trigger Facebook Lead Ads
- [ ] Skonfigurowano HTTP Request do endpointu
- [ ] Przetestowano z test leadem
- [ ] Zweryfikowano w aplikacji
- [ ] Zweryfikowano audit log
- [ ] Wyłączono Zap w Zapier
- [ ] Zweryfikowano że Make.com działa produkcyjnie
- [ ] (Opcjonalnie) Zaktualizowano kod dla rozróżnienia Make/Zapier

---

## Po migracji

### Monitorowanie:

1. **Sprawdzaj logi w Make.com** - Execution history
2. **Sprawdzaj audit log** - filtruj po źródle "Webhook"
3. **Sprawdzaj aplikację** - czy leady trafiają poprawnie

### Backup:

- Make.com ma wbudowany backup scenarios
- Eksportuj scenario jako backup (Make.com → Scenario → Export)

---

## Kontakt

W razie problemów z migracją:
1. Sprawdź dokumentację Make.com: https://www.make.com/en/help
2. Sprawdź logi w Make.com (Execution history)
3. Sprawdź logi w Vercel (Functions → Logs)

---

## Data migracji

- **Planowana data:** [DO UZUPEŁNIENIA]
- **Wykonane przez:** [DO UZUPEŁNIENIA]
- **Status:** [ ] Nie rozpoczęte | [ ] W trakcie | [ ] Zakończone
