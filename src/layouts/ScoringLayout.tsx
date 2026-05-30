import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";

export function ScoringLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-16 pb-32">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
