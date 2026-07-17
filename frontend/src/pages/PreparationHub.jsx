import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { BookOpen, Sparkles, Globe } from "lucide-react";

function LearningHub() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { setBusy(true); try { const { data } = await api.post("/learning/recommend", { skills: [] }); setData(data); } catch { toast.error("Failed"); } finally { setBusy(false); } };
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <button data-testid="learning-refresh" onClick={load} className="btn-primary text-sm">{busy?"Loading…":"Refresh recommendations"}</button>
      <div className="grid md:grid-cols-2 gap-4">
        {data?.tracks?.map((t, i) => (
          <div key={i} className="card">
            <div className="font-display text-xl">{t.skill}</div>
            <div className="mt-3">
              <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Courses</div>
              {t.courses.map((c, k) => <a key={k} href={c.url} target="_blank" rel="noreferrer" className="block text-sm p-2 rounded-lg bg-white/5 hover:bg-white/10 mb-1">{c.title} · <span className="text-white/50">{c.provider} · {c.hours}h</span></a>)}
            </div>
            <div className="mt-3">
              <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Videos</div>
              {t.videos.map((v, k) => <a key={k} href={v.url} target="_blank" rel="noreferrer" className="block text-sm p-2 rounded-lg bg-white/5 hover:bg-white/10 mb-1">▶ {v.title} · <span className="text-white/50">{v.channel}</span></a>)}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              {t.roadmaps.map((r, k) => <a key={k} href={r.url} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded-full border border-white/10 hover:border-[#FF5A1F]/40">{r.title}</a>)}
              {t.practice.map((p, k) => <a key={k} href={p.url} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 rounded-full border border-white/10 hover:border-[#FF5A1F]/40">{p.title}</a>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumeOptimizer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get("/resume").then(r => { const p = r.data.parsed || {}; const exp = (p.experience||[]).map(e=>`${e.title} @ ${e.company}: ${e.description||""}`).join("\n"); setText(exp || "Paste your resume bullet points here…"); }).catch(()=>{});
  }, []);
  const optimize = async () => {
    setBusy(true);
    try { const { data } = await api.post("/resume/optimize", { text }); setResult(data); toast.success(`ATS +${data.ats_delta}`); }
    catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Before</div>
        <textarea data-testid="optim-input" rows={16} value={text} onChange={e=>setText(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none text-sm" />
        <button data-testid="optim-run" onClick={optimize} disabled={busy} className="btn-primary mt-3">{busy?"Rewriting…":"Optimize with AI"}</button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">After</div>
          {result && <div className="text-xs text-green-400">ATS +{result.ats_delta}</div>}
        </div>
        <textarea readOnly rows={16} value={result?.optimized || ""} placeholder="Optimized version will appear here…" className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm" />
        {result?.improvements && (
          <div className="mt-3 card"><div className="text-xs uppercase tracking-widest text-white/50 mb-2">Key changes</div><ul className="text-sm text-white/70 list-disc pl-4 space-y-1">{result.improvements.map((s,i)=><li key={i}>{s}</li>)}</ul></div>
        )}
      </div>
    </div>
  );
}

function PortfolioGenerator() {
  const [theme, setTheme] = useState("midnight");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const gen = async () => {
    setBusy(true);
    try { const { data } = await api.post("/portfolio/generate", { theme, include_projects: true }); setResult(data); toast.success("Portfolio published"); }
    catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  const shareUrl = result ? `${window.location.origin}/portfolio/${result.slug}` : "";
  return (
    <div className="space-y-4">
      <div className="card grid md:grid-cols-2 gap-3">
        <select data-testid="port-theme" value={theme} onChange={e=>setTheme(e.target.value)} className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none">
          <option value="midnight">Midnight</option><option value="sunset">Sunset</option><option value="minimal">Minimal</option>
        </select>
        <button data-testid="port-gen" onClick={gen} disabled={busy} className="btn-primary">{busy?"Generating…":"Generate portfolio"}</button>
      </div>
      {result && (
        <div className="card">
          <div className="text-xs uppercase tracking-widest text-white/50">Shareable URL</div>
          <div className="mt-2 flex items-center gap-2">
            <input data-testid="port-share-url" readOnly value={shareUrl} className="flex-1 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm" />
            <button onClick={()=>{ navigator.clipboard.writeText(shareUrl); toast.success("Copied"); }} className="btn-primary text-sm">Copy</button>
            <a href={`/portfolio/${result.slug}`} target="_blank" rel="noreferrer" className="text-xs px-4 py-3 rounded-full border border-white/15 hover:border-[#FF5A1F]/40">Open</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreparationHub() {
  const [tab, setTab] = useState("learn");
  const tabs = [
    { key: "learn", label: "8A · Learning Hub", icon: BookOpen },
    { key: "optim", label: "8B · Resume Optimizer", icon: Sparkles },
    { key: "port", label: "8C · Portfolio", icon: Globe },
  ];
  return (
    <div className="space-y-6" data-testid="prep-hub">
      <div>
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Step 8</div>
        <h1 className="font-display text-4xl tracking-tight mt-1">Preparation Hub</h1>
      </div>
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} data-testid={`prep-tab-${t.key}`} onClick={()=>setTab(t.key)} className={`px-4 py-2 rounded-full text-sm inline-flex items-center gap-2 border transition-colors ${tab===t.key?"bg-[#FF5A1F] border-[#FF5A1F] text-white":"border-white/10 text-white/70 hover:border-white/30"}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>
      {tab === "learn" && <LearningHub />}
      {tab === "optim" && <ResumeOptimizer />}
      {tab === "port" && <PortfolioGenerator />}
    </div>
  );
}
