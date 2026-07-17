import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const ROLES = ["Software Engineer","Data Scientist","DevOps Engineer","Cloud Engineer","UI UX Designer","Full Stack Developer","AI Engineer"];

export default function Roadmap() {
  const [role, setRole] = useState("Software Engineer");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(()=>{ api.get("/roadmap").then(r=>setData(r.data)); }, []);
  const gen = async () => {
    setBusy(true);
    try { const { data } = await api.post("/roadmap", { target_role: role }); setData(data); toast.success("Roadmap generated"); }
    catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-6" data-testid="roadmap-page">
      <h1 className="font-display text-4xl tracking-tight">Career Roadmap</h1>
      <div className="card flex flex-col sm:flex-row gap-3 sm:items-center">
        <select data-testid="roadmap-role" value={role} onChange={e=>setRole(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none">
          {ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
        <button data-testid="roadmap-gen-btn" onClick={gen} disabled={busy} className="btn-primary">{busy?"Generating…":"Generate roadmap"}</button>
      </div>
      {data?.steps && (
        <div className="relative pl-8">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-[#FF5A1F]/40" />
          {data.steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.05 }} className="relative mb-6">
              <div className="absolute -left-6 top-4 w-3 h-3 rounded-full bg-[#FF5A1F] shadow-[0_0_16px_rgba(255,90,31,0.6)]" />
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">{s.phase}</div>
                    <div className="font-display text-xl mt-1">{s.title}</div>
                  </div>
                  <div className="text-xs text-white/50">{s.duration_weeks} weeks</div>
                </div>
                {s.items?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-white/70">
                    {s.items.map((it,k)=>(<li key={k} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#FF5A1F] mt-0.5" />{it}</li>))}
                  </ul>
                )}
                {s.resources?.length > 0 && <div className="mt-3 text-xs text-white/50">Resources: {s.resources.join(" • ")}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
