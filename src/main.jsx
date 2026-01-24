import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext.jsx";
import App from "./App.jsx";
import "./index.css";

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  const root = document.getElementById("root");
  if (!root) {
    console.error("❌ Root element not found!");
    document.body.innerHTML = '<div style="color: red; padding: 20px; font-size: 24px; background: #fff; z-index: 9999; position: fixed; top: 0; left: 0; right: 0; bottom: 0;">BŁĄD: Element #root nie został znaleziony!</div>';
    return;
  }

  try {
    root.innerHTML = '';
    const reactRoot = createRoot(root);
    reactRoot.render(
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    );

    // Fallback jeśli nic się nie wyświetla po 2 s
    setTimeout(() => {
      if (root.children.length === 0) {
        console.warn("⚠️ No content rendered after 2 seconds!");
        root.innerHTML = '<div style="color: white; padding: 20px; font-size: 18px; background: #1a1a1a; min-height: 100vh;">Aplikacja się ładuje... Sprawdź konsolę przeglądarki (F12) dla szczegółów.</div>';
      }
    }, 2000);
    
  } catch (error) {
    console.error("❌ Error rendering app:", error);
    root.innerHTML = `
      <div style="color: white; padding: 20px; font-size: 20px; background: #1a1a1a; min-height: 100vh;">
        <h1 style="color: #ff6b6b;">Błąd renderowania aplikacji</h1>
        <p>${error.message}</p>
        <pre style="color: #ff6b6b; background: #0a0a0a; padding: 10px; border-radius: 4px; overflow: auto;">${error.stack}</pre>
      </div>
    `;
  }
}
