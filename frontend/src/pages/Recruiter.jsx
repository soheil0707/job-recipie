import React, { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Users, FileText, Star } from "lucide-react";

export default function Recruiter() {
  const [jd, setJd] = useState("Looking for a Senior Full Stack Engineer with React, Node.js, MongoDB, AWS, TypeScript, Kubernetes experience. 3+ years.");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shortlist, setShortlist] = useState([]);

  const rank = async () => {
    setBusy(true);
    try { const { data } = await api.post("/recruiter/rank", { job_description: jd }); setResult(data); toast.success(`Ranked ${data.candidates.length} candidates`); }
    catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  const toggle = (id) => setShortlist(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  return (
    <div className="space-y-6" data-testid="recruiter-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Step 16</div>
        <h1 className="font-display text-4xl tracking-tight mt-1">Recruiter Dashboard</h1>
        <p className="text-white/60 text-sm">Upload a JD. Get AI-ranked candidates.</p>
      </div>
      <div className="card">
        <div className="font-display text-xl mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-[#FF5A1F]" />Job description</div>
        <textarea data-testid="rec-jd" rows={5} value={jd} onChange={e=>setJd(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none text-sm" />
        <button data-testid="rec-rank" onClick={rank} disabled={busy} className="btn-primary mt-3 inline-flex items-center gap-2"><Users className="w-4 h-4" />{busy?"Ranking…":"Rank candidates"}</button>
      </div>
      {result && (
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Extracted skills: <span className="text-[#FF5A1F]">{result.required_skills.join(" · ")}</span></div>
          <div className="grid md:grid-cols-2 gap-4">
            {result.candidates.map(c => (
              <div key={c.cand_id} className="card" data-testid={`cand-${c.cand_id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-lg">{c.name}</div>
                    <div className="text-xs text-white/50">{c.current_role} · {c.experience_years}y · {c.location}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/50">Match</div>
                    <div className="font-display text-3xl text-[#FF5A1F]">{c.match_score}%</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">{c.matched_skills.map(s=><span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">{s}</span>)}</div>
                <div className="mt-1 flex flex-wrap gap-1">{c.missing_skills.map(s=><span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">{s}</span>)}</div>
                <button data-testid={`shortlist-${c.cand_id}`} onClick={()=>toggle(c.cand_id)} className={`mt-3 text-xs px-3 py-1.5 rounded-full border inline-flex items-center gap-1 ${shortlist.includes(c.cand_id)?"bg-[#FF5A1F] border-[#FF5A1F]":"border-white/15 hover:border-white/30"}`}>
                  <Star className="w-3 h-3" />{shortlist.includes(c.cand_id)?"Shortlisted":"Shortlist"}
                </button>
              </div>
            ))}
          </div>
          {shortlist.length > 0 && (
            <div className="mt-4 card">
              <div className="font-display text-lg mb-2">Shortlisted ({shortlist.length})</div>
              <div className="text-sm text-white/70">{result.candidates.filter(c=>shortlist.includes(c.cand_id)).map(c=>c.name).join(", ")}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
