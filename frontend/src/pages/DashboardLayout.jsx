import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, User, FileText, Gauge, Target, Map, Briefcase, MessageSquare, Mic, PenLine, Kanban, LogOut } from "lucide-react";

const items = [
  { to: "/app", end: true, icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/profile", icon: User, label: "Profile" },
  { to: "/app/resume", icon: FileText, label: "Resume" },
  { to: "/app/ats", icon: Gauge, label: "ATS Score" },
  { to: "/app/skill-gap", icon: Target, label: "Skill Gap" },
  { to: "/app/roadmap", icon: Map, label: "Roadmap" },
  { to: "/app/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/app/coach", icon: MessageSquare, label: "AI Coach" },
  { to: "/app/interview", icon: Mic, label: "Mock Interview" },
  { to: "/app/cover-letter", icon: PenLine, label: "Cover Letter" },
  { to: "/app/applications", icon: Kanban, label: "Applications" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/10 bg-[#050505]/80 backdrop-blur-xl sticky top-0 h-screen flex flex-col" data-testid="sidebar">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center font-display font-bold">JR</div>
          <span className="font-display text-lg">Job Recipe</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to} to={it.to} end={it.end}
              data-testid={`nav-${it.label.toLowerCase().replace(/\s+/g,'-')}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive ? "bg-[#FF5A1F]/15 text-[#FF5A1F] border border-[#FF5A1F]/30" : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"}`}
            >
              <it.icon className="w-4 h-4" />{it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-display text-sm">
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <div className="text-sm truncate" data-testid="user-name">{user?.name}</div>
              <div className="text-xs text-white/40 truncate">{user?.email}</div>
            </div>
          </div>
          <button data-testid="logout-btn" onClick={async ()=>{ await logout(); nav("/", {replace:true}); }} className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/5">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 min-w-0"><div className="p-8 max-w-[1400px] mx-auto"><Outlet /></div></main>
    </div>
  );
}
