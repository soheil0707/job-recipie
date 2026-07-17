import React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import ChatWidget from "@/components/ChatWidget";
import BadgesDrawer from "@/components/BadgesDrawer";
import {
  LayoutDashboard, User, FileText, Gauge, Bot, Target, Map, GraduationCap, Mic, Code2,
  RefreshCw, Briefcase, Wand2, ShieldCheck, LineChart, Trophy, MessageSquare, PenLine, Kanban, LogOut
} from "lucide-react";

// 17-step pipeline (steps 1 = Login = implicit) + auth is done, so we show 17 stages
const STEPS = [
  { n: 1, to: "/app", end: true, icon: LayoutDashboard, label: "Dashboard" },
  { n: 2, to: "/app/profile", icon: User, label: "Profile" },
  { n: 3, to: "/app/resume", icon: FileText, label: "Resume · LinkedIn" },
  { n: 4, to: "/app/ats", icon: Gauge, label: "Resume Health" },
  { n: 5, to: "/app/career-twin", icon: Bot, label: "Career Twin" },
  { n: 6, to: "/app/skill-gap", icon: Target, label: "Target Career" },
  { n: 7, to: "/app/roadmap", icon: Map, label: "Job Recipe" },
  { n: 8, to: "/app/prep", icon: GraduationCap, label: "Preparation Hub" },
  { n: 9, to: "/app/interview", icon: Mic, label: "Mock Interview" },
  { n: 10, to: "/app/coding", icon: Code2, label: "Coding Assessment" },
  { n: 11, to: "/app/recalc", icon: RefreshCw, label: "Twin Recalc" },
  { n: 12, to: "/app/jobs", icon: Briefcase, label: "Jobs" },
  { n: 13, to: "/app/assistant", icon: Wand2, label: "App Assistant" },
  { n: 14, to: "/app/recruiter", icon: ShieldCheck, label: "Recruiter" },
  { n: 15, to: "/app/analytics", icon: LineChart, label: "Analytics" },
  { n: 16, to: "/app/hired", icon: Trophy, label: "Hired!" },
  { n: 17, to: "/app/coach", icon: MessageSquare, label: "Coach" },
];
const EXTRAS = [
  { to: "/app/cover-letter", icon: PenLine, label: "Cover Letter" },
  { to: "/app/applications", icon: Kanban, label: "Applications" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function PipelineTracker() {
  const loc = useLocation();
  const currentIdx = STEPS.findIndex(s => (s.end ? loc.pathname === s.to : loc.pathname.startsWith(s.to) && s.to !== "/app"));
  return (
    <div className="border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl sticky top-0 z-30" data-testid="pipeline-tracker">
      <div className="max-w-full overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 px-6 py-3 min-w-max">
          {STEPS.map((s, i) => {
            const isActive = i === currentIdx;
            const isDone = currentIdx > -1 && i < currentIdx;
            return (
              <NavLink key={s.n} to={s.to} end={s.end}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap ${isActive?"bg-[#FF5A1F] text-white":isDone?"bg-[#FF5A1F]/15 text-[#FF5A1F]":"bg-white/5 text-white/50 hover:text-white/80"}`}
                data-testid={`step-${s.n}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive?"bg-white/20":isDone?"bg-[#FF5A1F]/40":"bg-white/10"}`}>{s.n}</span>
                <span>{s.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const allNav = [...STEPS, ...EXTRAS];
  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <aside className="w-64 shrink-0 border-r border-white/10 bg-[#050505]/80 backdrop-blur-xl sticky top-0 h-screen flex flex-col" data-testid="sidebar">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center font-display font-bold">JR</div>
          <span className="font-display text-lg">Job Recipe</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {allNav.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}
              data-testid={`nav-${it.label.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${isActive ? "bg-[#FF5A1F]/15 text-[#FF5A1F] border border-[#FF5A1F]/30" : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"}`}>
              {it.n && <span className="text-[10px] w-4 text-white/40">{it.n}</span>}
              <it.icon className="w-4 h-4" />{it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-display text-sm">{user?.name?.[0]?.toUpperCase() || "?"}</div>
            <div className="min-w-0">
              <div className="text-xs text-white/40 truncate">{greeting()},</div>
              <div className="text-sm truncate" data-testid="user-name">{user?.name}</div>
            </div>
          </div>
          <button data-testid="logout-btn" onClick={async ()=>{ await logout(); nav("/", {replace:true}); }} className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/70 hover:bg-white/5">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <PipelineTracker />
        <div className="p-8 max-w-[1400px] mx-auto pb-24"><Outlet /></div>
      </main>
      <ChatWidget />
      <BadgesDrawer />
    </div>
  );
}
