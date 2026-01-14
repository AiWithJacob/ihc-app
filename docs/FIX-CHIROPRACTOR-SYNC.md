# 🔧 Naprawa: Lead nie pojawia się w aplikacji

## Problem

Lead został zapisany w Supabase, ale nie pojawia się w aplikacji.

**Przyczyna:** Lead został zapisany z `chiropractor=default`, a użytkownik jest zalogowany jako inny chiropraktyk (np. "Krzysztof"). Aplikacja filtruje leady po chiropraktyku.

---

## Rozwiązanie 1: Użyj poprawnego chiropraktyka w teście

### Krok 1: Sprawdź, jaki chiropraktyk jest w aplikacji

1. W aplikacji sprawdź, dla kogo pracujesz (w górnym lewym rogu)
2. Widzę: "Pracujesz dla Krzysztof"
3. **Chiropraktyk:** "Krzysztof"

### Krok 2: Przetestuj z poprawnym chiropraktykiem

Użyj PowerShell (zamień `default` na `Krzysztof`):

```powershell
$body = @{
    first_name = "Anna"
    last_name = "Kowalska"
    phone_number = "987654321"
    email = "anna@example.com"
    custom_questions = "Test z poprawnym chiropraktykiem"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Webhook-Source" = "make"
}

Invoke-RestMethod -Uri "https://ihc-app.vercel.app/api/facebook-leads?chiropractor=Krzysztof" -Method Post -Headers $headers -Body $body
```

**Uwaga:** Zamień `Krzysztof` na rzeczywistą nazwę chiropraktyka z aplikacji!

### Krok 3: Sprawdź w aplikacji

1. Odśwież aplikację (F5)
2. Sprawdź Kontakty → kolumna "Nowy kontakt"
3. Lead powinien się pojawić!

---

## Rozwiązanie 2: Zaktualizuj Make.com z poprawnym chiropraktykiem

### Krok 1: W Make.com

1. Otwórz Scenario z webhookiem
2. Kliknij na moduł **HTTP Request**
3. Znajdź **Query parameters**
4. Zmień wartość `chiropractor` z `default` na `Krzysztof` (lub właściwą nazwę)

### Krok 2: Zapisz i przetestuj

1. Kliknij **"Save"**
2. Wyślij dane do webhooka ponownie
3. Sprawdź w aplikacji

---

## Rozwiązanie 3: Sprawdź, czy lead jest w bazie

### Krok 1: Sprawdź audit log

1. W aplikacji przejdź do **Historia zmian**
2. Filtruj po tabeli: **"leads"**
3. Filtruj po akcji: **"INSERT"**
4. Sprawdź czy jest wpis dla leada "Jan Testowy"
5. Sprawdź `chiropractor` w szczegółach

### Krok 2: Sprawdź bezpośrednio w Supabase (jeśli masz dostęp)

1. Otwórz Supabase Dashboard
2. Przejdź do **Table Editor** → **leads**
3. Sprawdź czy lead "Jan Testowy" jest w bazie
4. Sprawdź kolumnę `chiropractor` - jaki ma chiropraktyk?

---

## Szybki test - użyj poprawnego chiropraktyka

**W PowerShell:**

```powershell
# Zamień "Krzysztof" na rzeczywistą nazwę chiropraktyka z aplikacji!
$body = @{
    first_name = "Anna"
    last_name = "Kowalska"
    phone_number = "987654321"
    email = "anna@example.com"
    custom_questions = "Test z poprawnym chiropraktykiem"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Webhook-Source" = "make"
}

Invoke-RestMethod -Uri "https://ihc-app.vercel.app/api/facebook-leads?chiropractor=Krzysztof" -Method Post -Headers $headers -Body $body
```

**Uwaga:** Zamień `Krzysztof` na rzeczywistą nazwę chiropraktyka!

---

## Co sprawdzić

1. **Jaki chiropraktyk jest w aplikacji?** (sprawdź w górnym lewym rogu)
2. **Jaki chiropraktyk został użyty w teście?** (`default` czy właściwa nazwa?)
3. **Czy lead jest w bazie?** (sprawdź audit log lub Supabase)

---

## Najważniejsze

**Aplikacja filtruje leady po chiropraktyku!**

- Jeśli lead jest dla `chiropractor=default`
- A użytkownik jest zalogowany jako `chiropractor=Krzysztof`
- To lead się nie pojawi!

**Rozwiązanie:** Użyj poprawnego chiropraktyka w teście i w Make.com!
