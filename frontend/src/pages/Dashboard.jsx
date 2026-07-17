import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Gauge, Target, Briefcase, Mic, Sparkles, Download, Trophy } from "lucide-react";
import { jsPDF } from "jspdf";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

function Stat({ label, value, suffix = "", icon: Icon }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-white/50">{label}</div>
        {Icon && <Icon className="w-4 h-4 text-[#FF5A1F]" />}
      </div>
      <div className="mt-3 font-display text-4xl">{value}<span className="text-lg text-white/40">{suffix}</span></div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [badges, setBadges] = useState(null);
  useEffect(() => { api.get("/dashboard").then(r=>setD(r.data)); api.get("/badges").then(r=>setBadges(r.data)); }, []);

  const download = () => {
    if (!d) return;
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(255, 90, 31); doc.text("Job Recipe — Career Report", 20, 20);
    doc.setFontSize(12); doc.setTextColor(0); doc.text(`Name: ${user?.name || ""}`, 20, 32);
    doc.text(`Email: ${user?.email || ""}`, 20, 40);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 48);
    let y = 64;
    doc.setFontSize(14); doc.text("Snapshot", 20, y); y+=8;
    doc.setFontSize(11);
    doc.text(`ATS Score: ${d.ats_score}/100`, 25, y); y+=6;
    doc.text(`Skill Match: ${d.skill_match}%`, 25, y); y+=6;
    doc.text(`Avg Interview: ${d.avg_interview_score}/100`, 25, y); y+=6;
    doc.text(`Total Applications: ${d.total_applications}`, 25, y); y+=6;
    doc.text(`Interviews taken: ${d.interviews_count}`, 25, y); y+=10;
    if (badges) {
      doc.setFontSize(14); doc.text("Badges", 20, y); y+=8; doc.setFontSize(11);
      badges.badges.filter(b=>b.unlocked).forEach(b => { doc.text(`✓ ${b.title} — ${b.desc}`, 25, y); y+=6; });
    }
    doc.save("jobrecipe-report.pdf");
  };

  if (!d) return <div className="text-white/50">Loading…</div>;

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">{greeting()}, {user?.name?.split(" ")[0] || "friend"}</div>
          <h1 className="font-display text-4xl tracking-tight mt-1">Your career kitchen</h1>
        </div>
        <div className="flex gap-2">
          {badges && <div className="px-4 py-2 rounded-full glass text-xs inline-flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-[#FF5A1F]" />{badges.unlocked_count}/{badges.total} badges</div>}
          <button data-testid="download-report" onClick={download} className="btn-primary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" />Download report</button>
        </div>
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
                  <div><div className="text-sm">{i.role}</div><div className="text-xs text-white/50">{i.round_type}</div></div>
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
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#FF5A1F]"><Sparkles className="w-3 h-3" /> Next in your recipe</div>
          <div className="mt-2 font-display text-2xl">{d.ats_score === 0 ? "Upload your resume to unlock ATS, Skill Gap, and Job Match." : d.skill_match === 0 ? "Run a Skill Gap analysis for your target role." : "Take a mock interview to boost your readiness score."}</div>
          <Link to={d.ats_score === 0 ? "/app/resume" : d.skill_match === 0 ? "/app/skill-gap" : "/app/interview"} className="btn-primary inline-block mt-4">Continue cooking</Link>
        </div>
      </div>
    </div>
  );
}
