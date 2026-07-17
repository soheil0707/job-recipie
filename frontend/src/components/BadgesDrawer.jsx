import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, X } from "lucide-react";

export default function BadgesDrawer() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  useEffect(() => { if (open) api.get("/badges").then(r=>setData(r.data)); }, [open]);
  return (
    <>
      <button data-testid="badges-fab" onClick={()=>setOpen(true)} className="fixed bottom-6 right-24 z-40 w-14 h-14 rounded-full bg-white/10 backdrop-blur border border-white/20 hover:border-[#FF5A1F]/50 flex items-center justify-center">
        <Trophy className="w-5 h-5 text-[#FF5A1F]" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-end" onClick={()=>setOpen(false)}>
          <div className="w-full max-w-md h-full bg-[#050505] border-l border-white/10 p-6 overflow-y-auto" onClick={e=>e.stopPropagation()} data-testid="badges-drawer">
            <div className="flex justify-between items-center mb-6">
              <div>
                <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Achievements</div>
                <div className="font-display text-2xl mt-1">Badges</div>
                {data && <div className="text-xs text-white/50 mt-1">{data.unlocked_count} / {data.total} unlocked</div>}
              </div>
              <button onClick={()=>setOpen(false)}><X className="w-5 h-5 text-white/60" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data?.badges?.map(b => (
                <div key={b.id} className={`p-4 rounded-2xl border ${b.unlocked?"border-[#FF5A1F]/40 bg-[#FF5A1F]/5":"border-white/5 bg-white/2 opacity-40"}`}>
                  <Trophy className={`w-6 h-6 mb-2 ${b.unlocked?"text-[#FF5A1F]":"text-white/30"}`} />
                  <div className="font-display text-sm">{b.title}</div>
                  <div className="text-xs text-white/50 mt-1">{b.desc}</div>
                  {b.unlocked && <div className="text-[10px] text-green-400 mt-1 uppercase tracking-widest">Unlocked</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
