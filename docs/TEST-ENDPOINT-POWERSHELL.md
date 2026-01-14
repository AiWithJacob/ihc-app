# 🧪 Test endpointu w PowerShell - Poprawna składnia

## Problem

W PowerShell `curl` to alias dla `Invoke-WebRequest`, ale składnia jest inna niż w bash/curl.

## ✅ Poprawna komenda PowerShell

### Opcja 1: Użyj Invoke-RestMethod (Najłatwiejsze)

```powershell
$body = @{
    first_name = "Jan"
    last_name = "Testowy"
    phone_number = "123456789"
    email = "jan@example.com"
    custom_questions = "Test bezpośrednio do endpointu"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Webhook-Source" = "make"
}

$response = Invoke-RestMethod -Uri "https://ihc-app.vercel.app/api/facebook-leads?chiropractor=default" `
    -Method Post `
    -Headers $headers `
    -Body $body

$response | ConvertTo-Json
```

### Opcja 2: Użyj Invoke-WebRequest

```powershell
$body = @{
    first_name = "Jan"
    last_name = "Testowy"
    phone_number = "123456789"
    email = "jan@example.com"
    custom_questions = "Test bezpośrednio do endpointu"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Webhook-Source" = "make"
}

$response = Invoke-WebRequest -Uri "https://ihc-app.vercel.app/api/facebook-leads?chiropractor=default" `
    -Method Post `
    -Headers $headers `
    -Body $body

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

### Opcja 3: Jedna linia (dla szybkiego testu)

```powershell
Invoke-RestMethod -Uri "https://ihc-app.vercel.app/api/facebook-leads?chiropractor=default" -Method Post -Headers @{"Content-Type"="application/json"; "X-Webhook-Source"="make"} -Body (@{first_name="Jan"; last_name="Testowy"; phone_number="123456789"; email="jan@example.com"; custom_questions="Test"} | ConvertTo-Json)
```

---

## 🚀 Szybki test - Skopiuj i wklej

Otwórz PowerShell i wklej całą komendę:

```powershell
$body = @{
    first_name = "Jan"
    last_name = "Testowy"
    phone_number = "123456789"
    email = "jan@example.com"
    custom_questions = "Test bezpośrednio do endpointu"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "X-Webhook-Source" = "make"
}

Invoke-RestMethod -Uri "https://ihc-app.vercel.app/api/facebook-leads?chiropractor=default" -Method Post -Headers $headers -Body $body
```

**Jeśli działa:** Zobaczysz odpowiedź JSON z `success: true`

**Jeśli nie działa:** Zobaczysz komunikat błędu

---

## 📊 Co sprawdzić w odpowiedzi

### Sukces:
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

### Błąd:
```json
{
  "error": "Database not configured",
  "message": "..."
}
```

---

## ❌ Jeśli widzisz błąd

### Błąd: "Database not configured"

**Rozwiązanie:**
1. Sprawdź zmienne środowiskowe w Vercel
2. Dodaj `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY`
3. Wdróż ponownie na Vercel

### Błąd: 404 Not Found

**Rozwiązanie:**
1. Sprawdź czy URL jest poprawny
2. Sprawdź czy endpoint jest wdrożony na Vercel

### Błąd: 500 Internal Server Error

**Rozwiązanie:**
1. Sprawdź logi w Vercel (Functions → Logs)
2. Sprawdź czy zmienne środowiskowe są ustawione

---

## ✅ Po pomyślnym teście

1. Sprawdź w aplikacji: https://ihc-app.vercel.app → Kontakty
2. Sprawdź audit log: Historia zmian → filtruj po źródle "Webhook"
3. Jeśli działa, wróć do Make.com i przetestuj przez webhook
