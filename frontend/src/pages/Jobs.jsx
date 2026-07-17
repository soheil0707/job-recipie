import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MapPin, Briefcase, DollarSign, Bookmark, Send } from "lucide-react";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/jobs/recommend/me").then(r=>{ setJobs(r.data); setLoading(false); }).catch(()=>setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = jobs.filter(j => !q || j.title.toLowerCase().includes(q.toLowerCase()) || j.company.toLowerCase().includes(q.toLowerCase()));

  const openMatch = async (job) => {
    setSelected(job); setMatch(null);
    try { const { data } = await api.post(`/jobs/${job.job_id}/match`); setMatch(data); } catch {}
  };
  const saveApp = async (status) => {
    if (!selected) return;
    try { await api.post("/applications", { job_id: selected.job_id, status }); toast.success(status === 'applied' ? "Applied!" : "Saved to tracker"); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6" data-testid="jobs-page">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Jobs</h1>
          <p className="text-white/60 text-sm">Ranked by your match score.</p>
        </div>
        <input data-testid="jobs-search" placeholder="Search jobs, companies, skills…" value={q} onChange={e=>setQ(e.target.value)} className="w-full max-w-sm px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
      </div>
      {loading && <div className="text-sm text-white/50">Loading…</div>}
      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map(j => (
          <div key={j.job_id} className="card group" data-testid={`job-card-${j.job_id}`}>
            <div className="flex items-start gap-4">
              <img src={j.logo} alt={j.company} className="w-12 h-12 rounded-xl bg-white/10 object-contain p-1" onError={(e)=>{ e.currentTarget.style.display='none'; }} />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg truncate">{j.title}</div>
                <div className="text-sm text-white/60">{j.company}</div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>
                  <span className="inline-flex items-center gap-1"><Briefcase className="w-3 h-3" />{j.type} · {j.mode}</span>
                  <span className="inline-flex items-center gap-1"><DollarSign className="w-3 h-3" />{j.salary}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {j.skills.slice(0,5).map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">{s}</span>)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/50">Match</div>
                <div className="font-display text-3xl text-[#FF5A1F]">{j.match?.score || 0}%</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button data-testid={`job-view-${j.job_id}`} onClick={()=>openMatch(j)} className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:border-white/30">View match</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={()=>setSelected(null)}>
          <div className="max-w-2xl w-full card noise relative" onClick={e=>e.stopPropagation()} data-testid="job-detail-modal">
            <button onClick={()=>setSelected(null)} className="absolute top-4 right-4 text-white/50 hover:text-white">✕</button>
            <div className="flex items-center gap-4">
              <img src={selected.logo} alt="" className="w-14 h-14 rounded-xl bg-white/10 object-contain p-1" onError={(e)=>e.currentTarget.style.display='none'} />
              <div>
                <div className="font-display text-2xl">{selected.title}</div>
                <div className="text-sm text-white/60">{selected.company} · {selected.location}</div>
              </div>
            </div>
            {match && (
              <div className="mt-6 p-4 rounded-xl bg-[#FF5A1F]/10 border border-[#FF5A1F]/30">
                <div className="text-sm">You are <span className="font-display text-2xl text-[#FF5A1F]">{match.score}%</span> suitable for this job.</div>
                {match.missing?.length > 0 && <div className="text-xs text-white/60 mt-2">Missing: {match.missing.join(", ")}</div>}
              </div>
            )}
            <p className="mt-4 text-sm text-white/70">{selected.description}</p>
            <div className="mt-6 flex gap-3">
              <button data-testid="job-save-btn" onClick={()=>saveApp('saved')} className="px-4 py-2 rounded-full border border-white/15 text-sm inline-flex items-center gap-2"><Bookmark className="w-4 h-4" />Save</button>
              <button data-testid="job-apply-btn" onClick={()=>saveApp('applied')} className="btn-primary text-sm inline-flex items-center gap-2"><Send className="w-4 h-4" />Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
