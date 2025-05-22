"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useConfigContext } from "@/contexts/ConfigContext";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  ...props
}: ThemeProviderProps) {
  const { config, updateThemeSettings } = useConfigContext();
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Initialize theme from config
  useEffect(() => {
    const preferredMode = config.theme.preferredMode;
    setTheme(preferredMode);
  }, [config.theme.preferredMode]);

  // For backward compatibility
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme && savedTheme !== config.theme.preferredMode) {
      setTheme(savedTheme);
      // Update config to match saved theme
      updateThemeSettings({ preferredMode: savedTheme });
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
      // Also update the config
      updateThemeSettings({ preferredMode: theme });
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

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};