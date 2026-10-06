import { useState, useEffect, useCallback } from "react";

export type ThemeType =
  | "default"
  | "star-wars"
  | "alien"
  | "cyberpunk"
  | "light";

export interface ThemeOption {
  id: ThemeType;
  label: string;
  color: string;
  glowColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "default",
    label: "MATRIX",
    color: "#00ed3f",
    glowColor: "rgba(0, 237, 63, 0.4)",
  },
  {
    id: "star-wars",
    label: "HOLO BLUE",
    color: "#1a6dff",
    glowColor: "rgba(26, 109, 255, 0.4)",
  },
  {
    id: "alien",
    label: "NOSTROMO",
    color: "#E0D5BE",
    glowColor: "rgba(224, 213, 190, 0.4)",
  },
  {
    id: "cyberpunk",
    label: "CYBERPUNK",
    color: "#FF0080",
    glowColor: "rgba(255, 0, 128, 0.4)",
  },
  {
    id: "light",
    label: "LAB LIGHT",
    color: "#0062E6",
    glowColor: "rgba(0, 98, 230, 0.4)",
  },
];

const THEME_STORAGE_KEY = "scifi-rag-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window === "undefined") return "default";
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType | null;
    if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
      return saved;
    }
    return "default";
  });

  const applyTheme = useCallback((themeName: ThemeType) => {
    if (themeName === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeName);
    }
    localStorage.setItem(THEME_STORAGE_KEY, themeName);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const cycleTheme = () => {
    const currentIndex = THEME_OPTIONS.findIndex((t) => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEME_OPTIONS.length;
    setTheme(THEME_OPTIONS[nextIndex].id);
  };

  return {
    theme,
    setTheme,
    cycleTheme,
    options: THEME_OPTIONS,
    currentThemeOption:
      THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0],
  };
}
