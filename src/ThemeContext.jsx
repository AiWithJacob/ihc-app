import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

// Nowa paleta kolorów - spójna ze stroną logowania
const themes = {
  dark: {
    name: "Dark",
    icon: "🌙",
    // Tło i powierzchnie
    background: "#0a0a0f",
    surface: "#12121a",
    surfaceElevated: "#1a1a24",
    surfaceHover: "#22222e",
    surfaceSolid: "#14141a",
    // Tekst
    text: "#ffffff",
    textSecondary: "rgba(255,255,255,0.5)",
    textMuted: "rgba(255,255,255,0.3)",
    // Ramki
    border: "#2a2a3a",
    borderHover: "#3a3a4a",
    borderAccent: "#667eea",
    // Akcenty - fioletowy gradient
    accent: "#667eea",
    accentHover: "#764ba2",
    accentDark: "#5a67d8",
    accentLight: "#818cf8",
    accentBorder: "rgba(102, 126, 234, 0.4)",
    accentBackground: "rgba(102, 126, 234, 0.1)",
    accentBackgroundHover: "rgba(102, 126, 234, 0.15)",
    // Gradient główny
    gradientPrimary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    gradientSecondary: "linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)",
    // Przyciski
    buttonBackground: "rgba(255,255,255,0.05)",
    inputBackground: "rgba(255,255,255,0.05)",
    // Karty - solidne tła
    cardBackground: "#16161e",
    cardBackgroundHover: "#1e1e2a",
    cardBorder: "#2a2a3a",
    // Gradient nawigacji
    gradient: "#14141a",
    navBackground: "#12121a",
    // Cienie i efekty
    shadow: "rgba(0, 0, 0, 0.4)",
    glow: "rgba(102, 126, 234, 0.4)",
    glowStrong: "rgba(102, 126, 234, 0.6)",
    // Statusy
    success: "#10b981",
    successDark: "#059669",
    successGlow: "rgba(16, 185, 129, 0.3)",
    successBackground: "rgba(16, 185, 129, 0.1)",
    warning: "#f59e0b",
    warningBackground: "rgba(245, 158, 11, 0.1)",
    error: "#ef4444",
    errorDark: "#dc2626",
    errorBorder: "rgba(239, 68, 68, 0.4)",
    errorShadow: "rgba(239, 68, 68, 0.3)",
    errorBackground: "rgba(239, 68, 68, 0.1)",
    // Kolory statusów leadów
    statusNew: "#667eea",
    statusContact: "#f59e0b",
    statusMeeting: "#8b5cf6",
    statusWon: "#10b981",
    statusLost: "#ef4444",
    // Backdrop
    backdrop: "rgba(0, 0, 0, 0.85)",
    backdropBlur: "blur(20px)",
  },
  light: {
    name: "Light",
    icon: "☀️",
    background: "#f5f7fa",
    surface: "#ffffff",
    surfaceElevated: "#ffffff",
    surfaceHover: "#f0f4f8",
    surfaceSolid: "#ffffff",
    text: "#1e293b",
    textSecondary: "#64748b",
    textMuted: "#94a3b8",
    border: "#e2e8f0",
    borderHover: "#cbd5e1",
    borderAccent: "#667eea",
    accent: "#667eea",
    accentHover: "#764ba2",
    accentDark: "#5a67d8",
    accentLight: "#818cf8",
    accentBorder: "rgba(102, 126, 234, 0.3)",
    accentBackground: "rgba(102, 126, 234, 0.08)",
    accentBackgroundHover: "rgba(102, 126, 234, 0.12)",
    gradientPrimary: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    gradientSecondary: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)",
    buttonBackground: "#ffffff",
    inputBackground: "#ffffff",
    cardBackground: "#ffffff",
    cardBackgroundHover: "#f8fafc",
    cardBorder: "#e2e8f0",
    gradient: "#ffffff",
    navBackground: "#ffffff",
    shadow: "rgba(0, 0, 0, 0.08)",
    glow: "rgba(102, 126, 234, 0.25)",
    glowStrong: "rgba(102, 126, 234, 0.4)",
    success: "#10b981",
    successDark: "#059669",
    successGlow: "rgba(16, 185, 129, 0.2)",
    successBackground: "rgba(16, 185, 129, 0.08)",
    warning: "#f59e0b",
    warningBackground: "rgba(245, 158, 11, 0.08)",
    error: "#ef4444",
    errorDark: "#dc2626",
    errorBorder: "rgba(239, 68, 68, 0.3)",
    errorShadow: "rgba(239, 68, 68, 0.15)",
    errorBackground: "rgba(239, 68, 68, 0.08)",
    statusNew: "#667eea",
    statusContact: "#f59e0b",
    statusMeeting: "#8b5cf6",
    statusWon: "#10b981",
    statusLost: "#ef4444",
    backdrop: "rgba(0, 0, 0, 0.5)",
    backdropBlur: "blur(12px)",
  },
  night: {
    name: "Night",
    icon: "🌌",
    background: "#050a05",
    surface: "#0a120a",
    surfaceElevated: "#101810",
    surfaceHover: "#152015",
    surfaceSolid: "#0a100a",
    text: "#a7f3d0",
    textSecondary: "#6b9b6b",
    textMuted: "#4a7a4a",
    border: "#1a2a1a",
    borderHover: "#2a3a2a",
    borderAccent: "#10b981",
    accent: "#10b981",
    accentHover: "#059669",
    accentDark: "#047857",
    accentLight: "#34d399",
    accentBorder: "rgba(16, 185, 129, 0.4)",
    accentBackground: "rgba(16, 185, 129, 0.1)",
    accentBackgroundHover: "rgba(16, 185, 129, 0.15)",
    gradientPrimary: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    gradientSecondary: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)",
    buttonBackground: "rgba(16, 185, 129, 0.05)",
    inputBackground: "rgba(16, 185, 129, 0.05)",
    cardBackground: "#0c140c",
    cardBackgroundHover: "#121a12",
    cardBorder: "#1a2a1a",
    gradient: "#0a100a",
    navBackground: "#0a120a",
    shadow: "rgba(0, 0, 0, 0.6)",
    glow: "rgba(16, 185, 129, 0.3)",
    glowStrong: "rgba(16, 185, 129, 0.5)",
    success: "#10b981",
    successDark: "#059669",
    successGlow: "rgba(16, 185, 129, 0.3)",
    successBackground: "rgba(16, 185, 129, 0.1)",
    warning: "#fbbf24",
    warningBackground: "rgba(251, 191, 36, 0.1)",
    error: "#f87171",
    errorDark: "#ef4444",
    errorBorder: "rgba(248, 113, 113, 0.4)",
    errorShadow: "rgba(248, 113, 113, 0.3)",
    errorBackground: "rgba(248, 113, 113, 0.1)",
    statusNew: "#10b981",
    statusContact: "#fbbf24",
    statusMeeting: "#a78bfa",
    statusWon: "#34d399",
    statusLost: "#f87171",
    backdrop: "rgba(0, 0, 0, 0.9)",
    backdropBlur: "blur(20px)",
  },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored || "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const themesOrder = ["dark", "light", "night"];
    const currentIndex = themesOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themesOrder.length;
    setTheme(themesOrder[nextIndex]);
  };

  const value = {
    theme,
    themeData: themes[theme],
    setTheme,
    toggleTheme,
    themes,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
