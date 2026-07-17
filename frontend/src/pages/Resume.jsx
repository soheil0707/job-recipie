import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { UploadCloud, FileText, Linkedin, History } from "lucide-react";

export default function Resume() {
  const [parsed, setParsed] = useState(null);
  const [filename, setFilename] = useState(null);
  const [busy, setBusy] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [versions, setVersions] = useState([]);
  const fileRef = useRef(null);

  const loadVersions = () => api.get("/resume/versions").then(r=>setVersions(r.data)).catch(()=>{});
  useEffect(() => { api.get("/resume").then(r=>{ setParsed(r.data.parsed || {}); setFilename(r.data.filename); }); loadVersions(); }, []);

  const upload = async (file) => {
    if (!file) return; setBusy(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const { data } = await api.post("/resume/upload", fd, { headers: { "Content-Type": "multipart/form-data" }});
      setParsed(data.parsed); setFilename(data.filename); toast.success("Resume parsed with AI");
    } catch (e) { toast.error("Upload failed: " + (e?.response?.data?.detail || "error")); }
    finally { setBusy(false); }
  };

  const importLinkedin = async () => {
    if (!linkedinUrl.trim()) { toast.error("Paste your LinkedIn URL"); return; }
    setBusy(true);
    try { const { data } = await api.post("/linkedin/import", { profile_url: linkedinUrl }); setParsed(data.parsed); setFilename("LinkedIn (imported)"); toast.success("Imported from LinkedIn"); }
    catch { toast.error("Import failed"); } finally { setBusy(false); }
  };

  const saveVersion = async () => {
    try { await api.post("/resume/versions"); toast.success("Version saved"); loadVersions(); } catch { toast.error("Failed"); }
  };

  const Section = ({ title, items, render }) => (
    <div className="card">
      <div className="font-display text-xl mb-3">{title}</div>
      {(!items || items.length === 0) ? <div className="text-sm text-white/40">Not found</div> :
        <ul className="space-y-2 text-sm text-white/80">{items.map((it,i)=>(<li key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">{render ? render(it) : String(it)}</li>))}</ul>}
    </div>
  );

  return (
    <div className="space-y-6" data-testid="resume-page">
      <h1 className="font-display text-4xl tracking-tight">Resume</h1>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-display text-xl">Upload PDF or DOCX</div>
          <div className="text-sm text-white/60">We'll parse skills, education, experience, projects, and more.</div>
          {filename && <div className="mt-2 text-xs text-white/50 flex items-center gap-2"><FileText className="w-3.5 h-3.5" />{filename}</div>}
          <input data-testid="resume-file-input" ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e=>upload(e.target.files?.[0])} />
          <button data-testid="resume-upload-btn" disabled={busy} onClick={()=>fileRef.current?.click()} className="btn-primary mt-4 inline-flex items-center gap-2"><UploadCloud className="w-4 h-4" />{busy?"Parsing…":"Upload & parse"}</button>
        </div>
        <div className="card">
          <div className="font-display text-xl flex items-center gap-2"><Linkedin className="w-4 h-4 text-[#FF5A1F]" />Import from LinkedIn</div>
          <div className="text-sm text-white/60">Paste your public LinkedIn profile URL.</div>
          <input data-testid="linkedin-url" placeholder="https://linkedin.com/in/yourname" value={linkedinUrl} onChange={e=>setLinkedinUrl(e.target.value)} className="mt-3 w-full px-4 py-3 rounded-xl bg-[#050505] border border-white/10 focus:border-[#FF5A1F] outline-none" />
          <button data-testid="linkedin-import-btn" onClick={importLinkedin} disabled={busy} className="btn-primary mt-3">{busy?"Importing…":"Import"}</button>
        </div>
      </div>

      {parsed && Object.keys(parsed).length > 0 && (
        <>
          <div className="flex justify-end">
            <button data-testid="save-version" onClick={saveVersion} className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:border-[#FF5A1F]/40 inline-flex items-center gap-1"><History className="w-3 h-3" />Save version</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Section title="Skills" items={parsed.skills} />
            <Section title="Education" items={parsed.education} render={(e)=>`${e.degree || ''} — ${e.institution || ''} ${e.year ? '('+e.year+')' : ''}`} />
            <Section title="Experience" items={parsed.experience} render={(e)=>(<div><div className="font-medium">{e.title} @ {e.company}</div><div className="text-xs text-white/50">{e.duration}</div><div className="text-xs text-white/60 mt-1">{e.description}</div></div>)} />
            <Section title="Projects" items={parsed.projects} render={(p)=>(<div><div className="font-medium">{p.name}</div><div className="text-xs text-white/60">{p.description}</div><div className="text-xs text-[#FF5A1F] mt-1">{Array.isArray(p.tech) ? p.tech.join(", ") : p.tech}</div></div>)} />
            <Section title="Certifications" items={parsed.certifications} />
            <Section title="Achievements" items={parsed.achievements} />
            <Section title="Languages" items={parsed.languages} />
          </div>
        </>
      )}

      {versions.length > 0 && (
        <div className="card">
          <div className="font-display text-xl mb-3">Version history</div>
          <div className="space-y-2">
            {versions.map(v => (
              <div key={v.version_id} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                <div>
                  <div className="text-sm">{v.filename || v.version_id}</div>
                  <div className="text-xs text-white/40">{new Date(v.created_at).toLocaleString()}</div>
                </div>
                <div className="font-display text-xl text-[#FF5A1F]">ATS {v.ats_score}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
