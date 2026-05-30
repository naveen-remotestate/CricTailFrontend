import { AppRoutes } from "@/routes";
import { useThemeStore } from "@/store/themeStore";
import { useEffect } from "react";

export default function App() {
  const { resolvedTheme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  return <AppRoutes />;
}
