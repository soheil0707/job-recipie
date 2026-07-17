import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function Profile() {
  const [p, setP] = useState({ name: "", phone: "", location: "", linkedin: "", github: "", portfolio: "", bio: "", skills: [], preferred_roles: [], expected_salary: "", work_mode: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/profile").then(r => {
      const prof = r.data.profile || {};
      setP({ name: r.data.name || "", phone: prof.phone || "", location: prof.location || "", linkedin: prof.linkedin || "", github: prof.github || "", portfolio: prof.portfolio || "", bio: prof.bio || "", skills: prof.skills || [], preferred_roles: prof.preferred_roles || [], expected_salary: prof.expected_salary || "", work_mode: prof.work_mode || "" });
    });
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await api.put("/profile", p);
      toast.success("Profile updated");
    } catch { toast.error("Save failed"); } finally { setBusy(false); }
  };

  const chip = (arr, setArr, ph, testId) => (
    <div>
      <input data-testid={testId} placeholder={ph} onKeyDown={(e)=>{ if(e.key==='Enter' && e.target.value.trim()){ setArr([...arr, e.target.value.trim()]); e.target.value=''; } }} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
      <div className="mt-2 flex flex-wrap gap-2">{arr.map((s,i)=>(<span key={i} className="text-xs px-2 py-1 rounded-full bg-[#FF5A1F]/15 border border-[#FF5A1F]/30 text-[#FF5A1F]">{s} <button onClick={()=>setArr(arr.filter((_,j)=>j!==i))} className="ml-1">×</button></span>))}</div>
    </div>
  );

  const field = (label, key, type="text") => (
    <div>
      <label className="text-xs uppercase tracking-widest text-white/50">{label}</label>
      <input data-testid={`profile-${key}`} type={type} value={p[key] || ""} onChange={e=>setP({...p, [key]: e.target.value})} className="mt-1 w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
    </div>
  );

  return (
    <div className="space-y-6" data-testid="profile-page">
      <h1 className="font-display text-4xl tracking-tight">Profile</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {field("Full name","name")}
        {field("Phone","phone")}
        {field("Location","location")}
        {field("LinkedIn","linkedin")}
        {field("GitHub","github")}
        {field("Portfolio","portfolio")}
        {field("Expected salary","expected_salary")}
        <div>
          <label className="text-xs uppercase tracking-widest text-white/50">Work mode</label>
          <select data-testid="profile-work_mode" value={p.work_mode} onChange={e=>setP({...p, work_mode:e.target.value})} className="mt-1 w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none">
            <option value="">Any</option><option>Remote</option><option>Hybrid</option><option>Onsite</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-white/50">Bio</label>
        <textarea data-testid="profile-bio" rows={4} value={p.bio} onChange={e=>setP({...p, bio:e.target.value})} className="mt-1 w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs uppercase tracking-widest text-white/50">Skills (press Enter)</label>
          {chip(p.skills, (v)=>setP({...p, skills:v}), "React, Python…", "profile-skills-input")}
        </div>
        <div>
          <label className="text-xs uppercase tracking-widest text-white/50">Preferred roles</label>
          {chip(p.preferred_roles, (v)=>setP({...p, preferred_roles:v}), "Software Engineer…", "profile-roles-input")}
        </div>
      </div>
      <button data-testid="profile-save" onClick={save} disabled={busy} className="btn-primary">{busy?"Saving…":"Save profile"}</button>
    </div>
  );
}
