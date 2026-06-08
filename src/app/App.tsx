import { AppRoutes } from "@/routes";
import { useThemeStore } from "@/store/themeStore";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SplashScreen } from "@/components/ui/SplashScreen";

export default function App() {
  const { resolvedTheme } = useThemeStore();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(() => {
    // Only show if it hasn't been shown in this session
    return !sessionStorage.getItem("splashShown");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  useEffect(() => {
    if (showSplash) {
      sessionStorage.setItem("splashShown", "true");
      // The SplashScreen component unmounts itself visually, 
      // but we can also stop rendering it after a delay to be clean
      const timer = setTimeout(() => setShowSplash(false), 2500); 
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const isHomePage = location.pathname === "/";

  return (
    <>
      {isHomePage && showSplash && <SplashScreen />}
      <AppRoutes />
    </>
  );
}
