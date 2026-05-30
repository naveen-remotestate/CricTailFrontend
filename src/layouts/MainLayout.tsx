import { Outlet } from "react-router-dom";

export function MainLayout() {
  return (
    <div className="pt-16 pb-20 md:pb-0">
      <Outlet />
    </div>
  );
}
