import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/lib/api";

export default function PortfolioPublic() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api.get(`/portfolio/${slug}`).then(r=>setP(r.data)).catch(()=>setErr(true)); }, [slug]);
  if (err) return <div className="min-h-screen bg-[#050505] text-white/60 flex items-center justify-center">Portfolio not found.</div>;
  if (!p) return <div className="min-h-screen bg-[#050505] text-white/60 flex items-center justify-center">Loading…</div>;
  const themeBg = p.theme === "sunset" ? "bg-gradient-to-br from-[#1a0a05] via-[#050505] to-[#0a0a0a]" : p.theme === "minimal" ? "bg-white text-black" : "bg-[#050505] text-white";
  return (
    <div className={`min-h-screen ${themeBg}`} data-testid="portfolio-public">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Portfolio</div>
        <h1 className="font-display text-6xl tracking-tighter mt-2">{p.name}</h1>
        {p.bio && <p className="mt-4 text-lg opacity-80">{p.bio}</p>}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {p.links?.linkedin && <a href={p.links.linkedin} target="_blank" rel="noreferrer" className="underline">LinkedIn</a>}
          {p.links?.github && <a href={p.links.github} target="_blank" rel="noreferrer" className="underline">GitHub</a>}
          {p.links?.portfolio && <a href={p.links.portfolio} target="_blank" rel="noreferrer" className="underline">Website</a>}
        </div>
        {p.skills?.length > 0 && (
          <div className="mt-10">
            <div className="text-xs uppercase tracking-widest opacity-60 mb-3">Skills</div>
            <div className="flex flex-wrap gap-2">{p.skills.map((s,i)=><span key={i} className="text-xs px-3 py-1 rounded-full bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 text-[#FF5A1F]">{s}</span>)}</div>
          </div>
        )}
        {p.projects?.length > 0 && (
          <div className="mt-10">
            <div className="text-xs uppercase tracking-widest opacity-60 mb-3">Projects</div>
            <div className="space-y-3">{p.projects.map((pr,i)=>(<div key={i} className="p-4 rounded-xl border border-white/10"><div className="font-display text-xl">{pr.name}</div><div className="text-sm opacity-70">{pr.description}</div><div className="text-xs mt-1 opacity-60">{Array.isArray(pr.tech)?pr.tech.join(", "):pr.tech}</div></div>))}</div>
          </div>
        )}
        {p.experience?.length > 0 && (
          <div className="mt-10">
            <div className="text-xs uppercase tracking-widest opacity-60 mb-3">Experience</div>
            <div className="space-y-3">{p.experience.map((e,i)=>(<div key={i} className="p-4 rounded-xl border border-white/10"><div className="font-medium">{e.title} @ {e.company}</div><div className="text-xs opacity-60">{e.duration}</div><div className="text-sm mt-1">{e.description}</div></div>))}</div>
          </div>
        )}
        <div className="mt-16 text-xs opacity-40">Cooked with Job Recipe.</div>
      </div>
    </div>
  );
}
