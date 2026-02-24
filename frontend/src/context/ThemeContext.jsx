import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "theme-preference";

const defaultState = { mode: "light" };

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const mode = parsed?.mode === "dark" ? "dark" : "light";
        setTheme({ mode });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark", "dark");
    const isDark = theme.mode === "dark";
    root.classList.add(isDark ? "theme-dark" : "theme-light");
    if (isDark) root.classList.add("dark");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const setMode = useCallback((mode) => {
    setTheme((t) => ({ ...t, mode }));
  }, []);

  const toggleDark = useCallback(() => {
    setTheme((t) => ({ ...t, mode: t.mode === "dark" ? "light" : "dark" }));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};

export default ThemeProvider;
