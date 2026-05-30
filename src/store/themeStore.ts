import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

function getSystemTheme(): "light" | "dark" {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: getSystemTheme(),
      setTheme: (theme) => {
        set({ theme });
        const resolved = theme === "system" ? getSystemTheme() : theme;
        set({ resolvedTheme: resolved });
        document.documentElement.classList.toggle("dark", resolved === "dark");
      },
    }),
    {
      name: "cric-tail-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved =
            state.theme === "system" ? getSystemTheme() : state.theme;
          state.resolvedTheme = resolved;
          document.documentElement.classList.toggle("dark", resolved === "dark");
        }
      },
    }
  )
);
