import { Outlet } from "react-router-dom";

export function ScoringLayout() {
  return (
    <div className="pt-16 pb-32">
      <Outlet />
    </div>
  );
}
