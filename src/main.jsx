import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext.jsx";
import App from "./App.jsx";
import "./index.css";

console.log("🚀 main.jsx loaded!");
console.log("Document ready state:", document.readyState);
console.log("Document body:", document.body);

// Upewnij się, że DOM jest gotowy
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  console.log("🔧 Initializing app...");

const root = document.getElementById("root");
console.log("Root element:", root);
  console.log("Root element exists:", !!root);

if (!root) {
    console.error("❌ Root element not found!");
    document.body.innerHTML = '<div style="color: red; padding: 20px; font-size: 24px; background: #fff; z-index: 9999; position: fixed; top: 0; left: 0; right: 0; bottom: 0;">BŁĄD: Element #root nie został znaleziony!</div>';
    return;
  }
  
  console.log("✅ Root element found, creating React root...");
  
  try {
    // Wyczyść root przed renderowaniem
    root.innerHTML = '';
    
    const reactRoot = createRoot(root);
    console.log("✅ React root created, rendering App...");
    
    reactRoot.render(
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    console.log("✅ App rendered successfully!");
    
    // Dodaj fallback jeśli nic się nie wyświetla po 2 sekundach
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
