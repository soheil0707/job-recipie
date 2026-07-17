import React, { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { MessageSquare, X, Send } from "lucide-react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);
  const scRef = useRef(null);
  useEffect(() => { scRef.current?.scrollTo({ top: scRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs, open]);
  const send = async () => {
    if (!text.trim() || busy) return;
    const m = text.trim(); setText(""); setMsgs(prev => [...prev, { role: 'user', text: m }]); setBusy(true);
    try { const { data } = await api.post("/chat", { message: m }); setMsgs(prev => [...prev, { role: 'assistant', text: data.reply }]); }
    catch { setMsgs(prev => [...prev, { role: 'assistant', text: 'Sorry — try again.' }]); }
    finally { setBusy(false); }
  };
  return (
    <>
      {!open && (
        <button data-testid="chat-fab" onClick={()=>setOpen(true)} className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#FF5A1F] shadow-[0_0_32px_rgba(255,90,31,0.4)] flex items-center justify-center hover:scale-105 transition-transform">
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[380px] max-w-[calc(100vw-32px)] h-[520px] max-h-[calc(100vh-48px)] rounded-2xl glass flex flex-col overflow-hidden" data-testid="chat-widget">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center text-sm font-bold">JR</div><div><div className="font-display text-sm">AI Coach</div><div className="text-xs text-white/50">Ask anything</div></div></div>
            <button data-testid="chat-close" onClick={()=>setOpen(false)} className="text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div ref={scRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {msgs.length === 0 && <div className="text-xs text-white/50">Try: "How do I prepare for a Google interview in 2 weeks?"</div>}
            {msgs.map((m,i)=>(<div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role==='user'?'bg-[#FF5A1F]':'bg-white/5 border border-white/10 text-white/90'}`}>{m.text}</div></div>))}
            {busy && <div className="text-xs text-white/40">Thinking…</div>}
          </div>
          <div className="p-2 border-t border-white/10 flex gap-2">
            <input data-testid="chat-widget-input" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask your coach…" className="flex-1 px-3 py-2 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none text-sm" />
            <button data-testid="chat-widget-send" onClick={send} disabled={busy} className="btn-primary text-xs px-3"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </>
  );
}
