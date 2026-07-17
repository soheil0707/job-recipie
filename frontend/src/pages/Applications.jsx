import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

const COLUMNS = [
  { key: "saved", label: "Saved", color: "text-white/60" },
  { key: "applied", label: "Applied", color: "text-blue-400" },
  { key: "interview", label: "Interview", color: "text-[#FF5A1F]" },
  { key: "offer", label: "Offer", color: "text-green-400" },
  { key: "rejected", label: "Rejected", color: "text-red-400" },
];

export default function Applications() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/applications").then(r=>setItems(r.data));
  useEffect(() => { load(); }, []);

  const move = async (app_id, status) => {
    try { await api.patch(`/applications/${app_id}`, { status }); toast.success("Moved"); load(); }
    catch { toast.error("Failed"); }
  };
  const del = async (app_id) => {
    try { await api.delete(`/applications/${app_id}`); load(); toast.success("Removed"); } catch {}
  };

  return (
    <div className="space-y-6" data-testid="apps-page">
      <h1 className="font-display text-4xl tracking-tight">Application Tracker</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map(col => (
          <div key={col.key} className="kanban-col" data-testid={`col-${col.key}`}>
            <div className={`flex items-center justify-between mb-3 ${col.color}`}>
              <div className="text-xs uppercase tracking-widest">{col.label}</div>
              <div className="text-xs">{items.filter(i=>i.status===col.key).length}</div>
            </div>
            <div className="space-y-2">
              {items.filter(i=>i.status===col.key).map(app => (
                <motion.div key={app.app_id} initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} className="p-3 rounded-xl bg-[#050505] border border-white/10">
                  <div className="text-sm font-medium truncate">{app.job_snapshot?.title}</div>
                  <div className="text-xs text-white/50">{app.job_snapshot?.company}</div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {COLUMNS.filter(c=>c.key!==col.key).map(c => (
                      <button key={c.key} onClick={()=>move(app.app_id, c.key)} className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/60 hover:border-[#FF5A1F]/40 hover:text-[#FF5A1F]">→ {c.label}</button>
                    ))}
                    <button onClick={()=>del(app.app_id)} className="text-[10px] px-2 py-0.5 rounded-full border border-red-500/20 text-red-400 hover:border-red-500/40">×</button>
                  </div>
                </motion.div>
              ))}
              {items.filter(i=>i.status===col.key).length === 0 && <div className="text-xs text-white/30 py-4 text-center">Empty</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
