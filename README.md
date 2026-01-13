# IHC MVP - System zarządzania leadami i rezerwacjami

Aplikacja CRM do zarządzania leadami i rezerwacjami wizyt dla chiropraktyków.

## 🚀 Funkcjonalności

- **Zarządzanie leadami** - dodawanie, edycja, filtrowanie leadów
- **Kalendarz rezerwacji** - widok tygodniowy i dzienny, zarządzanie wizytami
- **Statystyki** - przegląd aktywności i konwersji
- **Historia zmian (Audit Log)** - pełna historia wszystkich zmian w systemie
- **Integracja z Facebook Lead Ads** - automatyczne dodawanie leadów z Facebook
- **Automatyczny backup** - codzienne backupy do Supabase Storage
- **Konsola diagnostyczna** - standalone HTML do przeglądania danych

## 📋 Wymagania

- Node.js 18+
- npm lub yarn
- Konto Supabase
- Konto Vercel (dla deploymentu)

## 🛠️ Instalacja

```bash
cd ihc-app
npm install
```

## 🚀 Uruchomienie

### Development

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:5173

### Build

```bash
npm run build
```

## 📁 Struktura projektu

```
ihc-app/
├── api/                    # Vercel Serverless Functions
│   ├── auditHelper.js     # Helper do audit log w API
│   ├── bookings.js        # Endpoint rezerwacji
│   ├── facebook-leads.js  # Webhook dla Facebook Lead Ads
│   ├── leads.js           # Endpoint leadów
│   └── supabase.js        # Konfiguracja Supabase
├── docs/                   # Dokumentacja
│   ├── AUDIT-LOG-SETUP.md
│   ├── BACKUP-SETUP-GUIDE.md
│   ├── DEPLOY-VERCEL.md
│   └── ...
├── src/                    # Kod źródłowy React
│   ├── App.jsx            # Główna aplikacja
│   ├── LeadsPage.jsx     # Strona leadów
│   ├── CalendarPage.jsx  # Kalendarz
│   ├── AuditLogPage.jsx  # Historia zmian
│   └── ...
├── supabase/              # Supabase konfiguracja
│   ├── migrations/       # Migracje SQL
│   └── functions/        # Edge Functions
└── audit-log-diagnostics.html  # Konsola diagnostyczna
```

## ⚙️ Konfiguracja

### Zmienne środowiskowe

Utwórz plik `.env.local` w katalogu `ihc-app/`:

```env
VITE_SUPABASE_URL=twoj_supabase_url
VITE_SUPABASE_ANON_KEY=twoj_supabase_anon_key
VITE_API_URL=https://twoja-aplikacja.vercel.app
```

### Supabase

1. Utwórz projekt w Supabase
2. Uruchom migracje z `supabase/migrations/`
3. Skonfiguruj Edge Functions (patrz `docs/BACKUP-SETUP-GUIDE.md`)

### Vercel

1. Połącz repozytorium z Vercel
2. Dodaj zmienne środowiskowe
3. Deploy automatyczny przy push do main

## 📚 Dokumentacja

Wszystka dokumentacja znajduje się w folderze `docs/`:

- `AUDIT-LOG-SETUP.md` - Konfiguracja systemu audit log
- `BACKUP-SETUP-GUIDE.md` - Konfiguracja automatycznego backupu
- `DEPLOY-VERCEL.md` - Instrukcja deploymentu
- `SUPABASE-SETUP.md` - Konfiguracja Supabase
- `QUICK-START-FACEBOOK.md` - Integracja z Facebook Lead Ads

## 🔧 Skrypty

- `npm run dev` - Uruchomienie w trybie development
- `npm run build` - Build produkcyjny
- `npm run lint` - Sprawdzenie kodu ESLint
- `npm run preview` - Podgląd builda

## 📝 Licencja

Prywatny projekt - wszystkie prawa zastrzeżone
