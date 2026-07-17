import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Gauge, Target, Briefcase, Mic, Sparkles } from "lucide-react";

function Stat({ label, value, suffix = "", icon: Icon, accent }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-white/50">{label}</div>
        {Icon && <Icon className={`w-4 h-4 ${accent || "text-[#FF5A1F]"}`} />}
      </div>
      <div className="mt-3 font-display text-4xl">{value}<span className="text-lg text-white/40">{suffix}</span></div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/dashboard").then(r=>setData(r.data)).catch(()=>{}); }, []);
  const d = data || { ats_score: 0, skill_match: 0, avg_interview_score: 0, total_applications: 0, status_counts: {}, recent_interviews: [] };
  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Overview</div>
        <h1 className="font-display text-4xl tracking-tight mt-1">Your career kitchen</h1>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="ATS Score" value={d.ats_score} suffix="/100" icon={Gauge} />
        <Stat label="Skill Match" value={d.skill_match} suffix="%" icon={Target} />
        <Stat label="Avg Interview" value={d.avg_interview_score} suffix="/100" icon={Mic} />
        <Stat label="Applications" value={d.total_applications} icon={Briefcase} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-xl">Recent interviews</div>
            <Link to="/app/interview" className="text-xs text-[#FF5A1F] hover:underline">Start new →</Link>
          </div>
          {d.recent_interviews.length === 0 ? (
            <div className="text-sm text-white/50 py-6">No interviews yet. Start your first mock interview.</div>
          ) : (
            <div className="space-y-2">
              {d.recent_interviews.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <div className="text-sm">{i.role}</div>
                    <div className="text-xs text-white/50">{i.round_type}</div>
                  </div>
                  <div className="font-display text-xl text-[#FF5A1F]">{i.score}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <div className="font-display text-xl mb-4">Application funnel</div>
          <div className="space-y-2 text-sm">
            {["saved","applied","interview","offer","rejected"].map(s => (
              <div key={s} className="flex justify-between p-2 rounded-lg bg-white/5">
                <span className="capitalize text-white/70">{s}</span>
                <span className="font-display">{d.status_counts?.[s] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card noise relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF5A1F]/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF5A1F]"><Sparkles className="w-3 h-3" /> Next step</div>
          <div className="mt-2 font-display text-2xl">Upload your resume to unlock ATS, Skill Gap, and Job Match.</div>
          <Link to="/app/resume" className="btn-primary inline-block mt-4">Upload resume</Link>
        </div>
      </div>
    </div>
  );
}
