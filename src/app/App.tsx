import { AppRoutes } from "@/routes";
import { useThemeStore } from "@/store/themeStore";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SplashScreen } from "@/components/ui/SplashScreen";

export default function App() {
  const { resolvedTheme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  const isHomePage = location.pathname === "/";

  return (
    <>
      {isHomePage && <SplashScreen />}
      <AppRoutes />
    </>
  );
}
