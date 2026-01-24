# 🔗 Vercel – połączenie z GitHub i wdrożenie

Jeśli **nic się nie pojawia** na Vercel, projekt może nie być podłączony do repozytorium. Poniżej kroki.

---

## 1. Sprawdź, czy projekt jest w Vercel

1. Wejdź na **https://vercel.com** i zaloguj się (np. przez GitHub).
2. Na stronie głównej zobacz listę projektów.
3. Szukaj projektu **ihc-app** (lub podobnej nazwy).

- **Jeśli projektu nie ma** → przejdź do sekcji **„Dodaj projekt po raz pierwszy”**.
- **Jeśli projekt jest** → przejdź do sekcji **„Ręczny redeploy”**.

---

## 2. Dodaj projekt po raz pierwszy

1. **https://vercel.com** → **Add New…** → **Project**.
2. W **Import Git Repository** wybierz **GitHub**.
3. Jeśli nie widzisz repozytorium:
   - **Adjust GitHub App Permissions** / **Configure** i daj Vercel dostęp do organizacji/konta, w którym jest **AiWithJacob/ihc-app**.
   - Odśwież listę i wybierz **AiWithJacob/ihc-app**.
4. Po wybraniu repozytorium w **Configure Project** ustaw:

   | Ustawienie         | Wartość        |
   |--------------------|----------------|
   | **Framework Preset** | Vite           |
   | **Root Directory**   | *zostaw puste* (kropka lub puste – katalog główny repo to już aplikacja) |
   | **Build Command**    | `npm run build` |
   | **Output Directory** | `dist`         |

   **Uwaga:** jeśli w rogu jest **Root Directory: `ihc-app`**, **zmień na puste** – w tym repo korzeń to od razu aplikacja.

5. W **Environment Variables** (opcjonalnie, jeśli używasz):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - itd. – według `docs/GOOGLE-CALENDAR-SETUP.md` i innych instrukcji.

6. Kliknij **Deploy**.

Po zakończeniu builda powinna być domena typu `https://ihc-app-xxx.vercel.app`.

---

## 3. Ręczny redeploy (gdy projekt już jest)

1. **https://vercel.com** → wybierz projekt **ihc-app**.
2. Zakładka **Deployments**.
3. Przy ostatnim deploymencie: **⋮** (Options) → **Redeploy** (albo **Redeploy with existing Build Cache**).
4. Zostaw **Use existing Build Cache** wg uznania i potwierdź.

Alternatywnie: **Deployments** → **Create** → **Deploy** (jeśli masz taki przycisk) – to zbuduje i wdroży najnowszy commit z GitHub.

---

## 4. Wdrożenie z Vercel CLI (po zalogowaniu)

W katalogu **ihc-app** (tam, gdzie są `package.json` i `vercel.json`):

```bash
cd "c:\Users\anita\OneDrive\Pulpit\Projekt Systemu\ihc_mvp\ihc-app"

# Zaloguj się (otworzy się przeglądarka)
npx vercel login

# Wdróż na produkcję
npx vercel --prod
```

Przy pierwszym `vercel --prod`:
- jeśli projekt nie jest jeszcze powiązany, zapyta o **Set up and deploy?** → **Y**,
- potem wybierz **Scope** (konto / team) i **Link to existing project?** – wybierz projekt **ihc-app**, jeśli istnieje.

---

## 5. Vercel buduje stary commit (np. 4883e46 zamiast 5a0b8da)

To zwykle oznacza, że **projekt jest podpięty pod inne repo lub branch**.

1. **Vercel** → **ihc-app** → **Settings** → **Git**
2. Sprawdź: **Connected Git Repository** = `AiWithJacob/ihc-app`, **Production Branch** = `main`
3. Jeśli repo jest inne: **Disconnect**, potem **Import** ponownie `AiWithJacob/ihc-app` (Root Directory = puste)
4. **Deployments** → **Create Deployment** → branch **main** (zbuduje najnowszy commit)
5. **Uwaga:** „Redeploy” na deploymencie z **4883e46** dalej buduje 4883e46. Potrzebny jest **nowy** deployment z commita **c81687d** lub **5a0b8da**.

---

## 6. Najczęstsze przyczyny „nic się nie pojawia”

| Problem | Co zrobić |
|---------|-----------|
| Projekt w Vercel w ogóle nie istnieje | Dodać projekt jak w **sekcji 2** (Import z GitHub). |
| **Root Directory** = `ihc-app` | W **Settings → General → Root Directory** ustawić na puste i zapisać, potem zrobić **Redeploy**. |
| **Vercel buduje stary commit** | **Settings → Git**: repo = `AiWithJacob/ihc-app`, branch = `main`. Potem **Deployments** → **Create Deployment** → `main`. |
| Vercel nie ma dostępu do `AiWithJacob/ihc-app` | W GitHub: **Settings → Applications → Vercel** (albo w Vercel: **Settings → Git**) i dać dostęp do repo / organizacji. |
| Build się wysypuje | W **Deployments** wejść w ostatni deployment → **Building** / **Logs** i sprawdzić błąd (np. brak zmiennych, błąd `npm run build`). |
| Strona się ładuje, ale biały ekran / 404 | Sprawdzić **Settings → Domains** i czy `vercel.json` ma `rewrites` do `index.html` (w Twoim projekcie jest). |

---

## 7. Repozytorium i branch

- **Repo:** https://github.com/AiWithJacob/ihc-app  
- **Branch do deployu:** `main`  
- Każdy **push na `main`** powinien uruchamiać nowy deployment, jeśli połączenie z GitHubem jest poprawne.

---

## 8. Szybki link do importu

Bezpośredni import projektu z repozytorium GitHub:

**https://vercel.com/new/import?s=https://github.com/AiWithJacob/ihc-app**

(Otwórz po zalogowaniu w Vercel; upewnij się, że Root Directory jest puste.)
