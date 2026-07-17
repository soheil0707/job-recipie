import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ROLES = ["Software Engineer","Data Scientist","Data Analyst","DevOps Engineer","Cloud Engineer","UI UX Designer","Full Stack Developer","AI Engineer","Cybersecurity Analyst","Frontend Developer","Backend Engineer"];

export default function SkillGap() {
  const [role, setRole] = useState("Software Engineer");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(()=>{ api.get("/skill-gap").then(r=>setData(r.data)); }, []);
  const run = async () => {
    setBusy(true);
    try { const { data } = await api.post("/skill-gap", { target_role: role }); setData(data); toast.success("Skill gap analyzed"); }
    catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-6" data-testid="skillgap-page">
      <h1 className="font-display text-4xl tracking-tight">Skill Gap Analysis</h1>
      <div className="card flex flex-col sm:flex-row gap-3 sm:items-center">
        <select data-testid="skillgap-role" value={role} onChange={e=>setRole(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none">
          {ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
        <button data-testid="skillgap-run-btn" onClick={run} disabled={busy} className="btn-primary">{busy?"Analyzing…":"Analyze"}</button>
      </div>
      {data && data.match_percentage !== undefined && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-widest text-white/50">Match</div>
            <div className="font-display text-8xl text-[#FF5A1F]" data-testid="skillgap-match">{data.match_percentage}%</div>
            <div className="text-sm text-white/60">for {data.target_role}</div>
          </div>
          <div className="card">
            <div className="font-display text-xl mb-3">Strengths</div>
            <div className="flex flex-wrap gap-2">{(data.strengths||[]).map((s,i)=><span key={i} className="text-xs px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400">{s}</span>)}</div>
          </div>
          <div className="card">
            <div className="font-display text-xl mb-3">Missing skills</div>
            <div className="flex flex-wrap gap-2">{(data.missing_skills||[]).map((s,i)=><span key={i} className="text-xs px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">{s}</span>)}</div>
          </div>
          <div className="card lg:col-span-2">
            <div className="font-display text-xl mb-3">Priority to learn</div>
            <ol className="space-y-2 list-decimal pl-6 text-sm text-white/80">{(data.priority_skills||[]).map((s,i)=><li key={i}>{s}</li>)}</ol>
          </div>
          <div className="card">
            <div className="font-display text-xl mb-3">Estimated time</div>
            <div className="font-display text-5xl text-[#FF5A1F]">{data.estimated_time_weeks || 0}</div>
            <div className="text-sm text-white/60">weeks to job-ready</div>
          </div>
          <div className="card lg:col-span-3">
            <div className="font-display text-xl mb-3">Learning resources</div>
            <div className="grid md:grid-cols-2 gap-2">{(data.learning_resources||[]).map((r,i)=>(
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5"><div className="text-sm font-medium">{r.skill}</div><div className="text-xs text-white/60">{r.resource}</div></div>
            ))}</div>
          </div>
        </div>
      )}
    </div>
  );
}
