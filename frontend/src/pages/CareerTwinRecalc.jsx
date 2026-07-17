import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export default function CareerTwinRecalc() {
  const [role, setRole] = useState("Software Engineer");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(()=>{ api.get("/career-twin").then(r=>{ if (r.data?.target_role) setRole(r.data.target_role); }); }, []);
  const run = async () => {
    setBusy(true);
    try { const { data } = await api.post("/career-twin/recalc", { target_role: role }); setData(data); }
    catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  const Compare = ({ label, before, after, suffix = "" }) => (
    <div className="card grid grid-cols-3 items-center gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50">Before learning</div>
        <div className="font-display text-5xl text-white/60 mt-1">{before}{suffix}</div>
      </div>
      <div className="flex justify-center"><ArrowRight className="w-10 h-10 text-[#FF5A1F]" /></div>
      <div className="text-right">
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">After recipe</div>
        <div className="font-display text-6xl text-[#FF5A1F] mt-1">{after}{suffix}</div>
      </div>
      <div className="col-span-3 text-xs uppercase tracking-widest text-white/50 text-center">{label}</div>
    </div>
  );
  return (
    <div className="space-y-6" data-testid="recalc-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Step 13</div>
        <h1 className="font-display text-4xl tracking-tight mt-1">Career Twin Recalculation</h1>
        <p className="text-white/60 text-sm">See how far you've come. And how far you can still go.</p>
      </div>
      <div className="card flex gap-3">
        <input value={role} onChange={e=>setRole(e.target.value)} className="flex-1 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" data-testid="recalc-role" />
        <button data-testid="recalc-run" onClick={run} disabled={busy} className="btn-primary">{busy?"Recalculating…":"Recalculate"}</button>
      </div>
      {data && (
        <div className="space-y-4">
          <Compare label="Hiring Chance" before={data.before?.hiring_probability || 0} after={data.after?.hiring_probability || 0} suffix="%" />
          <Compare label="Readiness Score" before={data.before?.readiness_score || 0} after={data.after?.readiness_score || 0} suffix="%" />
          <Compare label="Expected Salary" before={data.before?.salary_prediction || "—"} after={data.after?.salary_prediction || "—"} />
          <div className="card text-center">
            <div className="text-xs uppercase tracking-widest text-white/50">Overall boost</div>
            <div className="font-display text-6xl text-[#FF5A1F]" data-testid="recalc-boost">+{data.boost}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
