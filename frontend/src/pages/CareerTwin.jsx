import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

function Dial({ value, label, max = 100, accent = "#FF5A1F" }) {
  const pct = Math.min(Math.max(value || 0, 0), max) / max;
  const r = 40, C = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} stroke="#1f1f1f" strokeWidth="8" fill="none" />
        <circle cx="55" cy="55" r={r} stroke={accent} strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform="rotate(-90 55 55)" style={{ transition: "stroke-dashoffset .8s" }} />
        <text x="55" y="60" textAnchor="middle" fill="#fff" fontSize="20" fontFamily="Clash Display" fontWeight="600">{value || 0}</text>
      </svg>
      <div className="text-xs text-white/60 mt-2 uppercase tracking-widest">{label}</div>
    </div>
  );
}

const ROLES = ["Software Engineer","Cloud Engineer","AI Engineer","Data Analyst","DevOps Engineer","Cybersecurity Analyst","UI UX Designer","Product Manager","Full Stack Developer"];

export default function CareerTwin() {
  const [role, setRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/career-twin").then(r=>setData(r.data)); }, []);

  const run = async () => {
    setBusy(true);
    try {
      const target = customRole.trim() || role;
      const { data } = await api.post("/career-twin", { target_role: target });
      setData(data); toast.success("Career Twin ready");
    } catch { toast.error("Failed"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6" data-testid="career-twin-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Step 6</div>
        <h1 className="font-display text-4xl tracking-tight mt-1">AI Career Twin</h1>
        <p className="text-white/60 text-sm">Predict your hiring probability, salary and readiness.</p>
      </div>

      <div className="card grid md:grid-cols-3 gap-3">
        <select data-testid="twin-role" value={role} onChange={e=>{setRole(e.target.value); setCustomRole("");}} className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none">
          {ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
        <input data-testid="twin-custom" placeholder="Or enter custom role…" value={customRole} onChange={e=>setCustomRole(e.target.value)} className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <button data-testid="twin-run" onClick={run} disabled={busy} className="btn-primary">{busy?"Analyzing…":"Run Career Twin"}</button>
      </div>

      {data && data.hiring_probability !== undefined && (
        <>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="card flex flex-col items-center justify-center"><Dial value={data.hiring_probability} label="Hiring Prob." /></div>
            <div className="card flex flex-col items-center justify-center"><Dial value={data.readiness_score} label="Readiness" /></div>
            <div className="card flex flex-col items-center justify-center"><Dial value={data.industry_demand} label="Industry Demand" accent="#22c55e" /></div>
            <div className="card flex flex-col items-center justify-center"><Dial value={data.competition_level} label="Competition" accent="#ef4444" /></div>
            <div className="card flex flex-col items-center justify-center">
              <div className="font-display text-5xl text-[#FF5A1F]">{data.time_to_ready_weeks}</div>
              <div className="text-xs text-white/60 mt-2 uppercase tracking-widest">Weeks to ready</div>
            </div>
          </div>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card noise relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5A1F]/10 via-transparent to-transparent" />
            <div className="relative">
              <div className="text-xs uppercase tracking-widest text-white/50">Expected salary</div>
              <div className="font-display text-5xl mt-1 text-[#FF5A1F]">{data.salary_prediction}</div>
              <div className="mt-4 text-sm text-white/70 max-w-2xl">{data.verdict}</div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
