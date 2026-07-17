import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "@/App.css";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AuthCallback from "@/pages/AuthCallback";
import DashboardLayout from "@/pages/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Resume from "@/pages/Resume";
import ATS from "@/pages/ATS";
import SkillGap from "@/pages/SkillGap";
import Roadmap from "@/pages/Roadmap";
import Jobs from "@/pages/Jobs";
import CareerCoach from "@/pages/CareerCoach";
import Interview from "@/pages/Interview";
import CoverLetter from "@/pages/CoverLetter";
import Applications from "@/pages/Applications";
import { useAuth } from "@/lib/auth";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white/60">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  // Handle Emergent OAuth callback (URL fragment)
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app" element={<Protected><DashboardLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="resume" element={<Resume />} />
        <Route path="ats" element={<ATS />} />
        <Route path="skill-gap" element={<SkillGap />} />
        <Route path="roadmap" element={<Roadmap />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="coach" element={<CareerCoach />} />
        <Route path="interview" element={<Interview />} />
        <Route path="cover-letter" element={<CoverLetter />} />
        <Route path="applications" element={<Applications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <div className="App"><AppRouter /></div>;
}
