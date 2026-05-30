import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useLogout } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatPlayerName } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut,
  User,
  Trophy,
  Home,
  LayoutDashboard,
} from "lucide-react";

export function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const logout = useLogout();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      navigate("/");
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-primary" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                <path d="M12 22a10 10 0 0 0 10-10" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-lg font-bold">CricTail</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="gap-2">
                <Home className="h-4 w-4" />
                Home
              </Link>
            </Button>
            {isAuthenticated && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/teams" className="gap-2">
                <Trophy className="h-4 w-4" />
                Teams
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <div className="hidden sm:flex items-center rounded-lg border bg-muted p-1">
              <button
                onClick={() => setTheme("light")}
                className={`rounded p-1.5 transition-colors ${theme === "light" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`rounded p-1.5 transition-colors ${theme === "dark" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Moon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`rounded p-1.5 transition-colors ${theme === "system" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/profile" className="gap-2">
                    <User className="h-4 w-4" />
                    {formatPlayerName(user?.full_name?.split(" ")[0])}
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={logout.isPending}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Top Dropdown Style */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[80] md:hidden pt-16">
            {/* Full screen backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Top Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-16 left-0 right-0 border-t bg-background shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
            >
              <div className="p-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start font-bold" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/" className="gap-3"><Home className="h-5 w-5 text-primary" /> Home</Link>
                </Button>
                
                {isAuthenticated && (
                  <Button variant="ghost" className="w-full justify-start font-bold" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/dashboard" className="gap-3"><LayoutDashboard className="h-5 w-5 text-primary" /> Dashboard</Link>
                  </Button>
                )}
                
                <Button variant="ghost" className="w-full justify-start font-bold" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/teams" className="gap-3"><Trophy className="h-5 w-5 text-primary" /> Teams</Link>
                </Button>
                
                <div className="h-[1px] bg-border my-2" />
                
                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" className="w-full justify-start font-bold" asChild onClick={() => setMobileMenuOpen(false)}>
                      <Link to="/profile" className="gap-3"><User className="h-5 w-5 text-primary" /> {formatPlayerName(user?.full_name)}</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start font-bold text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                      isLoading={logout.isPending}
                    >
                      <LogOut className="h-5 w-5 mr-3" /> Logout
                    </Button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" className="font-bold" asChild onClick={() => setMobileMenuOpen(false)}>
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button className="font-bold" asChild onClick={() => setMobileMenuOpen(false)}>
                      <Link to="/register">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Theme Selector in Mobile Menu */}
              <div className="p-4 border-t bg-muted/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">Appearance</p>
                <div className="flex items-center justify-around bg-background rounded-xl p-1 border">
                   <button onClick={() => setTheme("light")} className={`flex-1 flex justify-center py-2 rounded-lg ${theme === "light" ? "bg-primary text-white shadow-md" : "text-muted-foreground"}`}><Sun className="h-4 w-4" /></button>
                   <button onClick={() => setTheme("dark")} className={`flex-1 flex justify-center py-2 rounded-lg ${theme === "dark" ? "bg-primary text-white shadow-md" : "text-muted-foreground"}`}><Moon className="h-4 w-4" /></button>
                   <button onClick={() => setTheme("system")} className={`flex-1 flex justify-center py-2 rounded-lg ${theme === "system" ? "bg-primary text-white shadow-md" : "text-muted-foreground"}`}><Monitor className="h-4 w-4" /></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
