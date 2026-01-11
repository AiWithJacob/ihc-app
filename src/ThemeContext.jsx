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

// Palety kolorów dla różnych trybów
const themes = {
  dark: {
    name: "Dark",
    icon: "🌙",
    background: "#0f0f0f",
    surface: "#1a1a1a",
    surfaceElevated: "#222",
    surfaceHover: "#2a2a2a",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    border: "#2a2a2a",
    accent: "#2563eb",
    accentHover: "#1d4ed8",
    accentDark: "#1e40af",
    accentLight: "#3b82f6",
    accentBorder: "#3b82f6",
    accentBackground: "rgba(37, 99, 235, 0.1)",
    accentBackgroundHover: "rgba(37, 99, 235, 0.15)",
    buttonBackground: "#1a1a1a",
    inputBackground: "#0f0f0f",
    cardBackground: "rgba(37, 99, 235, 0.1)",
    cardBackgroundHover: "rgba(37, 99, 235, 0.15)",
    gradient: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
    shadow: "rgba(0, 0, 0, 0.5)",
    glow: "rgba(37, 99, 235, 0.3)",
    success: "#22c55e",
    successDark: "#16a34a",
    successGlow: "rgba(34, 197, 94, 0.3)",
    error: "#ef4444",
    errorDark: "#dc2626",
    errorBorder: "#f87171",
    errorShadow: "rgba(239, 68, 68, 0.3)",
  },
  light: {
    name: "Light",
    icon: "☀️",
    background: "#f5f5f5",
    surface: "#ffffff",
    surfaceElevated: "#fafafa",
    surfaceHover: "#f0f0f0",
    text: "#1a1a1a",
    textSecondary: "#666666",
    border: "#e0e0e0",
    accent: "#2563eb",
    accentHover: "#1d4ed8",
    accentDark: "#1e40af",
    accentLight: "#3b82f6",
    accentBorder: "#3b82f6",
    accentBackground: "rgba(37, 99, 235, 0.08)",
    accentBackgroundHover: "rgba(37, 99, 235, 0.12)",
    buttonBackground: "#ffffff",
    inputBackground: "#fafafa",
    cardBackground: "rgba(37, 99, 235, 0.08)",
    cardBackgroundHover: "rgba(37, 99, 235, 0.12)",
    gradient: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
    shadow: "rgba(0, 0, 0, 0.1)",
    glow: "rgba(37, 99, 235, 0.2)",
    success: "#22c55e",
    successDark: "#16a34a",
    successGlow: "rgba(34, 197, 94, 0.2)",
    error: "#ef4444",
    errorDark: "#dc2626",
    errorBorder: "#f87171",
    errorShadow: "rgba(239, 68, 68, 0.2)",
  },
  night: {
    name: "Night",
    icon: "🌌",
    background: "#0a0f0a",
    surface: "#0f1510",
    surfaceElevated: "#151a15",
    surfaceHover: "#1a251a",
    text: "#a8d5a8",
    textSecondary: "#6b8e6b",
    border: "#1a2a1a",
    accent: "#2d5a2d",
    accentHover: "#1e3a1e",
    accentDark: "#1e3a1e",
    accentLight: "#3d7a3d",
    accentBorder: "#3d7a3d",
    accentBackground: "rgba(45, 90, 45, 0.15)",
    accentBackgroundHover: "rgba(45, 90, 45, 0.2)",
    buttonBackground: "#0f1510",
    inputBackground: "#0a0f0a",
    cardBackground: "rgba(45, 90, 45, 0.15)",
    cardBackgroundHover: "rgba(45, 90, 45, 0.2)",
    gradient: "linear-gradient(135deg, #0f1510 0%, #0a0f0a 100%)",
    shadow: "rgba(0, 0, 0, 0.9)",
    glow: "rgba(45, 90, 45, 0.25)",
    success: "#2d5a2d",
    successDark: "#1e3a1e",
    successGlow: "rgba(45, 90, 45, 0.25)",
    error: "#5a2d2d",
    errorDark: "#3a1e1e",
    errorBorder: "#7a3d3d",
    errorShadow: "rgba(90, 45, 45, 0.25)",
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
