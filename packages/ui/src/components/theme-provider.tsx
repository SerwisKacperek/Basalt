"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "theme-green" | "theme-blue" | "theme-purple";

interface ThemeStorage {
  getData: (key: string) => Promise<any>;
  saveData: (key: string, data: any) => Promise<void>;
}

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  storage: ThemeStorage;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ 
  children, 
  defaultTheme = "theme-green", 
  storageKey = "app_preferences", 
  storage, 
  ...props 
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const loadTheme = async () => {
      const prefs = await storage.getData(storageKey);
      if (prefs?.theme) setThemeState(prefs.theme as Theme);
    };
    loadTheme();
  }, [storage, storageKey]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("theme-green", "theme-blue", "theme-purple");
    root.classList.add(`${theme}`);
  }, [theme]);

  const value = {
    theme,
    setTheme: async (newTheme: Theme) => {
      setThemeState(newTheme);
      let currentPrefs = await storage.getData(storageKey);
      if (typeof currentPrefs !== 'object' || currentPrefs === null || Array.isArray(currentPrefs)) {
        currentPrefs = {};
      }
      const dataToSave = { theme: newTheme };
      await storage.saveData(newTheme, dataToSave);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme musi być wewnątrz ThemeProvider");
  return context;
};