import React, { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Mail, ListChecks, Sparkles, Bell, Copy } from "lucide-react";

export default function ApplicationAssistant() {
  const [form, setForm] = useState({ company: "", role: "", hiring_manager: "" });
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!form.company || !form.role) { toast.error("Company and role required"); return; }
    setBusy(true);
    try { const { data } = await api.post("/application-assistant", form); setData(data); toast.success("Kit ready"); }
    catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  const copy = (text) => { navigator.clipboard.writeText(text); toast.success("Copied"); };
  return (
    <div className="space-y-6" data-testid="assistant-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Step 15</div>
        <h1 className="font-display text-4xl tracking-tight mt-1">AI Application Assistant</h1>
        <p className="text-white/60 text-sm">Cold email, checklist, resume tips, interview reminder — all tailored to the role.</p>
      </div>
      <div className="card grid md:grid-cols-3 gap-3">
        <input data-testid="asst-company" placeholder="Company" value={form.company} onChange={e=>setForm({...form, company:e.target.value})} className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <input data-testid="asst-role" placeholder="Role" value={form.role} onChange={e=>setForm({...form, role:e.target.value})} className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <input data-testid="asst-manager" placeholder="Hiring manager (optional)" value={form.hiring_manager} onChange={e=>setForm({...form, hiring_manager:e.target.value})} className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <div className="md:col-span-3"><button data-testid="asst-run" onClick={run} disabled={busy} className="btn-primary">{busy?"Preparing…":"Generate kit"}</button></div>
      </div>
      {data && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-2"><div className="font-display text-xl flex items-center gap-2"><Mail className="w-4 h-4 text-[#FF5A1F]" />Cold email</div>
              <button onClick={()=>copy(data.cold_email)} className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:border-white/30 inline-flex items-center gap-1"><Copy className="w-3 h-3" />Copy</button></div>
            <textarea readOnly rows={9} value={data.cold_email} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm" />
          </div>
          <div className="card">
            <div className="font-display text-xl flex items-center gap-2 mb-3"><ListChecks className="w-4 h-4 text-[#FF5A1F]" />Checklist</div>
            <ul className="space-y-2 text-sm text-white/80">{data.checklist.map((s,i)=><li key={i} className="flex items-start gap-2"><input type="checkbox" className="mt-1 accent-[#FF5A1F]" />{s}</li>)}</ul>
          </div>
          <div className="card">
            <div className="font-display text-xl flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-[#FF5A1F]" />Resume tailoring tips</div>
            <ul className="space-y-2 text-sm text-white/80 list-disc pl-4">{data.resume_tips.map((s,i)=><li key={i}>{s}</li>)}</ul>
          </div>
          <div className="card lg:col-span-2">
            <div className="font-display text-xl flex items-center gap-2 mb-2"><Bell className="w-4 h-4 text-[#FF5A1F]" />Interview reminder</div>
            <div className="text-sm text-white/80">{data.reminder}</div>
          </div>
        </div>
      )}
    </div>
  );
}
