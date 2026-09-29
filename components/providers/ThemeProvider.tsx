"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const STORAGE_KEY = "dentai-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => { },
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Theme store ─────────────────────────────────────
// The persisted preference and the OS setting live outside React, so they are
// read through useSyncExternalStore instead of being copied into state.

const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function setStoredTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  listeners.forEach((notify) => notify());
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep the <html> class in sync with the current theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggle() {
    setStoredTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
