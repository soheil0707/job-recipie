import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

function Bar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-white/60">{label}</span><span className="text-white/80">{value || 0}</span></div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#FF5A1F]" style={{ width: `${value || 0}%` }} /></div>
    </div>
  );
}

export default function ATS() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(()=>{ api.get("/resume/ats").then(r=>setData(r.data)); }, []);
  const analyze = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/resume/ats");
      setData(data); toast.success("ATS analysis complete");
    } catch (e) { toast.error(e?.response?.data?.detail || "Upload a resume first"); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-6" data-testid="ats-page">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl tracking-tight">ATS Score</h1>
          <p className="text-white/60 text-sm">Applicant Tracking System compatibility report.</p>
        </div>
        <button data-testid="ats-run-btn" onClick={analyze} disabled={busy} className="btn-primary">{busy?"Analyzing…":"Run ATS analysis"}</button>
      </div>

      {data && data.ats_score !== undefined && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card lg:col-span-1 flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-widest text-white/50">ATS Score</div>
            <div className="font-display text-8xl text-[#FF5A1F]" data-testid="ats-score-value">{data.ats_score}</div>
            <div className="text-sm text-white/60">/ 100</div>
          </div>
          <div className="card lg:col-span-2 space-y-3">
            <div className="font-display text-xl">Sub-scores</div>
            <Bar label="Formatting" value={data.formatting} />
            <Bar label="Keywords" value={data.keywords} />
            <Bar label="Readability" value={data.readability} />
            <Bar label="Grammar" value={data.grammar} />
            <Bar label="Experience quality" value={data.experience_quality} />
            <Bar label="Skills coverage" value={data.skills_coverage} />
          </div>
          <div className="card">
            <div className="font-display text-xl mb-3">Strengths</div>
            <ul className="space-y-1 text-sm text-white/70 list-disc pl-4">{(data.strengths||[]).map((s,i)=><li key={i}>{s}</li>)}</ul>
          </div>
          <div className="card">
            <div className="font-display text-xl mb-3">Weaknesses</div>
            <ul className="space-y-1 text-sm text-white/70 list-disc pl-4">{(data.weaknesses||[]).map((s,i)=><li key={i}>{s}</li>)}</ul>
          </div>
          <div className="card">
            <div className="font-display text-xl mb-3">Improvements</div>
            <ul className="space-y-1 text-sm text-white/70 list-disc pl-4">{(data.improvements||[]).map((s,i)=><li key={i}>{s}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
