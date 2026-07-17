import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import confetti from "canvas-confetti";
import { Trophy, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function Hired() {
  const { user } = useAuth();
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [celebrated, setCelebrated] = useState(false);
  const fired = useRef(false);

  const boom = () => {
    if (fired.current) return; fired.current = true;
    const end = Date.now() + 3000;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FF5A1F', '#ffffff', '#22c55e'] });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FF5A1F', '#ffffff', '#3b82f6'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const celebrate = async () => {
    await api.post("/hired"); setCelebrated(true); boom(); toast.success("Congrats! 🎉");
  };

  useEffect(() => { if (celebrated) boom(); }, [celebrated]);

  const share = () => {
    const text = `I got hired as ${role || "a rockstar"}${company ? " @ " + company : ""}! 🎉 Cooked with Job Recipe.`;
    if (navigator.share) navigator.share({ title: "I got hired!", text }); else { navigator.clipboard.writeText(text); toast.success("Share text copied"); }
  };

  return (
    <div className="space-y-6" data-testid="hired-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Step 18</div>
        <h1 className="font-display text-5xl tracking-tighter mt-1">You got hired?! Let's celebrate.</h1>
      </div>
      <div className="card grid md:grid-cols-2 gap-3">
        <input placeholder="Role you got (optional)" value={role} onChange={e=>setRole(e.target.value)} data-testid="hired-role" className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <input placeholder="Company (optional)" value={company} onChange={e=>setCompany(e.target.value)} data-testid="hired-company" className="px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <div className="md:col-span-2 flex gap-3">
          <button data-testid="hired-celebrate" onClick={celebrate} className="btn-primary inline-flex items-center gap-2"><Trophy className="w-4 h-4" />I got hired!</button>
          <button data-testid="hired-share" onClick={share} className="px-6 py-3 rounded-full border border-white/15 hover:border-white/30 text-sm inline-flex items-center gap-2"><Share2 className="w-4 h-4" />Share the news</button>
        </div>
      </div>
      {celebrated && (
        <div className="card noise relative text-center py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF5A1F]/20 via-transparent to-transparent" />
          <div className="relative">
            <div className="text-8xl">🏆</div>
            <h2 className="font-display text-5xl mt-4 tracking-tighter">Congratulations, {user?.name?.split(" ")[0]}!</h2>
            <p className="mt-4 text-lg text-white/70">{role ? `Newly minted ${role}` : "Dream job unlocked"}{company ? ` @ ${company}` : ""} 🎉</p>
            <div className="mt-6 flex justify-center gap-2 flex-wrap">
              <span className="px-4 py-2 rounded-full bg-[#FF5A1F]/15 border border-[#FF5A1F]/40 text-[#FF5A1F] text-sm">Dream Job</span>
              <span className="px-4 py-2 rounded-full bg-green-500/15 border border-green-500/40 text-green-400 text-sm">Recipe Complete</span>
              <span className="px-4 py-2 rounded-full bg-blue-500/15 border border-blue-500/40 text-blue-400 text-sm">Career Twin ✓</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
