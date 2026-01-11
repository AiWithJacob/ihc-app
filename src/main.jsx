import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./ThemeContext.jsx";
import App from "./App.jsx";
import "./index.css";

console.log("main.jsx loaded!");

const root = document.getElementById("root");
console.log("Root element:", root);

if (!root) {
  console.error("Root element not found!");
  document.body.innerHTML = '<div style="color: red; padding: 20px; font-size: 24px;">BŁĄD: Element #root nie został znaleziony!</div>';
} else {
  console.log("Creating React root...");
  try {
    const reactRoot = createRoot(root);
    console.log("React root created, rendering App...");
    
    reactRoot.render(
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    );
    
    console.log("✅ App rendered successfully!");
  } catch (error) {
    console.error("❌ Error rendering app:", error);
    root.innerHTML = `
      <div style="color: red; padding: 20px; font-size: 20px; background: #222;">
        <h1>Błąd renderowania aplikacji</h1>
        <p>${error.message}</p>
        <pre style="color: #ff6b6b;">${error.stack}</pre>
      </div>
    `;
  }
}
