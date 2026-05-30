import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { MainLayout } from "@/layouts/MainLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ScoringLayout } from "@/layouts/ScoringLayout";

// Pages
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import CreateMatchPage from "@/pages/matches/CreateMatchPage";
import MatchDetailPage from "@/pages/matches/MatchDetailPage";
import LiveScorePage from "@/pages/public/LiveScorePage";
import LiveScoringPage from "@/pages/scoring/LiveScoringPage";
import ScorecardPage from "@/pages/matches/ScorecardPage";
import ProfilePage from "@/pages/ProfilePage";
import TeamsPage from "@/pages/TeamsPage";
import NotFoundPage from "@/pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/matches/:id" element={<MatchDetailPage />} />
        <Route path="/matches/:id/live" element={<LiveScorePage />} />
        <Route path="/matches/:id/scorecard" element={<ScorecardPage />} />
      </Route>

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/matches/create" element={<CreateMatchPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/teams" element={<TeamsPage />} />
        </Route>
        <Route element={<ScoringLayout />}>
          <Route path="/matches/:id/score" element={<LiveScoringPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
