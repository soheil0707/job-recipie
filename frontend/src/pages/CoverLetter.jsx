import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Copy, Download } from "lucide-react";

export default function CoverLetter() {
  const [form, setForm] = useState({ company: "", role: "", job_description: "" });
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => { api.get("/cover-letter/list").then(r=>setHistory(r.data)); }, [text]);

  const gen = async () => {
    if (!form.company || !form.role) { toast.error("Company and role required"); return; }
    setBusy(true);
    try { const { data } = await api.post("/cover-letter", form); setText(data.text); toast.success("Cover letter generated"); }
    catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  const copy = () => { navigator.clipboard.writeText(text); toast.success("Copied"); };
  const download = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `cover-letter-${form.company}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="cover-page">
      <h1 className="font-display text-4xl tracking-tight">Cover Letter</h1>
      <div className="card grid md:grid-cols-2 gap-4">
        <input data-testid="cover-company" placeholder="Company" value={form.company} onChange={e=>setForm({...form, company:e.target.value})} className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <input data-testid="cover-role" placeholder="Role" value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <textarea data-testid="cover-jd" rows={5} placeholder="Paste job description (optional)" value={form.job_description} onChange={e=>setForm({...form, job_description:e.target.value})} className="md:col-span-2 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <div className="md:col-span-2">
          <button data-testid="cover-gen" onClick={gen} disabled={busy} className="btn-primary">{busy?"Writing…":"Generate cover letter"}</button>
        </div>
      </div>

      {text && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <div className="font-display text-xl">Generated letter</div>
            <div className="flex gap-2">
              <button onClick={copy} className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:border-white/30 inline-flex items-center gap-1"><Copy className="w-3 h-3" />Copy</button>
              <button onClick={download} className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:border-white/30 inline-flex items-center gap-1"><Download className="w-3 h-3" />Download</button>
            </div>
          </div>
          <textarea value={text} onChange={e=>setText(e.target.value)} rows={16} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none text-sm leading-relaxed" />
        </div>
      )}

      {history.length > 0 && (
        <div className="card">
          <div className="font-display text-xl mb-3">Previous letters</div>
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.cover_id} className="flex justify-between p-2 rounded-lg bg-white/5 text-sm">
                <div><div>{h.role} @ {h.company}</div><div className="text-xs text-white/40">{new Date(h.created_at).toLocaleString()}</div></div>
                <button onClick={()=>setText(h.text)} className="text-xs text-[#FF5A1F] hover:underline">Open</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
