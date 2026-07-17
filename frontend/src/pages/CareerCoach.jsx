import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Send } from "lucide-react";

export default function CareerCoach() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.get("/chat/history").then(r => {
      const flat = [];
      r.data.forEach(m => { flat.push({ role: 'user', text: m.user_msg }); flat.push({ role: 'assistant', text: m.assistant_msg }); });
      setMessages(flat);
    }).catch(()=>{});
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!text.trim() || busy) return;
    const msg = text.trim(); setText(""); setBusy(true);
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    try {
      const { data } = await api.post("/chat", { message: msg });
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', text: 'Something went wrong.' }]); }
    finally { setBusy(false); }
  };

  const suggestions = ["Should I learn React or Vue?", "How do I become a Data Scientist in 6 months?", "What salary can I expect as a junior SDE in India?", "Prep me for a Google technical round"];

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col" data-testid="coach-page">
      <div>
        <h1 className="font-display text-4xl tracking-tight">AI Career Coach</h1>
        <p className="text-white/60 text-sm">Ask anything about your career journey.</p>
      </div>
      <div ref={scrollRef} className="flex-1 card overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="text-sm text-white/60">Try asking:</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s} onClick={()=>setText(s)} className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:border-[#FF5A1F]/40 text-white/70">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m,i)=>(
          <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${m.role==='user'?'bg-[#FF5A1F] text-white rounded-br-sm':'bg-white/5 border border-white/10 text-white/90 rounded-bl-sm'}`}>{m.text}</div>
          </div>
        ))}
        {busy && <div className="text-xs text-white/40">Coach is thinking…</div>}
      </div>
      <div className="flex gap-2">
        <input data-testid="coach-input" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask your coach…" className="flex-1 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
        <button data-testid="coach-send" onClick={send} disabled={busy} className="btn-primary inline-flex items-center gap-2"><Send className="w-4 h-4" />Send</button>
      </div>
    </div>
  );
}
