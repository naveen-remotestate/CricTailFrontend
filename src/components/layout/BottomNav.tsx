import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Home, Trophy, LayoutDashboard, User, PlusCircle } from "lucide-react";

export function BottomNav() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    ...(isAuthenticated ? [
      { to: "/my-matches", icon: Trophy, label: "Matches" },
      { to: "/matches/create", icon: PlusCircle, label: "New" },
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/profile", icon: User, label: "Profile" },
    ] : [
      { to: "/login", icon: User, label: "Login" }
    ]),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg md:hidden safe-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
