import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ROUNDS = ["HR","Technical","Behavioral","Managerial"];
const DIFFS = ["Easy","Medium","Hard"];
const COMPANIES = ["Google","Microsoft","Amazon","TCS","Infosys","Wipro","Accenture","Deloitte","Capgemini","Cognizant","IBM","Oracle"];

export default function Interview() {
  const [setup, setSetup] = useState({ role: "Software Engineer", round_type: "HR", difficulty: "Medium", company: "" });
  const [state, setState] = useState({ interview_id: null, question: null, index: 0, total: 0, done: false });
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => { api.get("/interview/history").then(r=>setHistory(r.data)); }, [evaluation]);

  const start = async () => {
    setBusy(true); setEvaluation(null);
    try {
      const { data } = await api.post("/interview/start", setup);
      setState({ interview_id: data.interview_id, question: data.question, index: 0, total: data.total, done: false });
    } catch { toast.error("Failed to start"); } finally { setBusy(false); }
  };
  const submit = async () => {
    if (!answer.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post("/interview/answer", { interview_id: state.interview_id, answer });
      setAnswer("");
      if (data.done) { setState(s => ({ ...s, done: true })); evaluate(state.interview_id); }
      else setState(s => ({ ...s, question: data.next_question, index: data.index }));
    } catch { toast.error("Failed"); } finally { setBusy(false); }
  };
  const evaluate = async (id) => {
    setBusy(true);
    try { const { data } = await api.post(`/interview/${id}/evaluate`); setEvaluation(data); toast.success("Evaluation ready"); }
    catch { toast.error("Evaluation failed"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6" data-testid="interview-page">
      <h1 className="font-display text-4xl tracking-tight">AI Mock Interview</h1>

      {!state.interview_id && !evaluation && (
        <div className="card grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50">Role</label>
            <input data-testid="int-role" value={setup.role} onChange={e=>setSetup({...setup, role:e.target.value})} className="mt-1 w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50">Company (optional)</label>
            <select data-testid="int-company" value={setup.company} onChange={e=>setSetup({...setup, company:e.target.value})} className="mt-1 w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none">
              <option value="">Any</option>{COMPANIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50">Round</label>
            <select data-testid="int-round" value={setup.round_type} onChange={e=>setSetup({...setup, round_type:e.target.value})} className="mt-1 w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none">
              {ROUNDS.map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-white/50">Difficulty</label>
            <select data-testid="int-difficulty" value={setup.difficulty} onChange={e=>setSetup({...setup, difficulty:e.target.value})} className="mt-1 w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none">
              {DIFFS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <button data-testid="int-start" onClick={start} disabled={busy} className="btn-primary">{busy?"Generating…":"Start interview"}</button>
          </div>
        </div>
      )}

      {state.interview_id && !state.done && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-white/50">Question {state.index + 1} / {state.total}</div>
            <div className="flex gap-2">
              <button data-testid="int-speak" onClick={()=>{ if('speechSynthesis' in window){ const u = new SpeechSynthesisUtterance(state.question); u.rate = 0.95; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);} }} className="text-xs px-3 py-1 rounded-full border border-white/15 hover:border-[#FF5A1F]/40">🔊 Hear question</button>
              <button data-testid="int-mic" onClick={()=>{
                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SR) { toast.error("Voice not supported in this browser"); return; }
                const rec = new SR(); rec.lang = 'en-US'; rec.continuous = false; rec.interimResults = false;
                rec.onresult = (e) => { const t = e.results[0][0].transcript; setAnswer(a => (a ? a + " " : "") + t); toast.success("Captured"); };
                rec.onerror = () => toast.error("Mic error");
                rec.start();
              }} className="text-xs px-3 py-1 rounded-full border border-white/15 hover:border-[#FF5A1F]/40">🎤 Record answer</button>
            </div>
          </div>
          <div className="mt-2 font-display text-2xl">{state.question}</div>
          <textarea data-testid="int-answer" rows={6} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="Type or record your answer…" className="mt-4 w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
          <button data-testid="int-submit" onClick={submit} disabled={busy} className="btn-primary mt-3">{busy?"Submitting…":"Submit & next"}</button>
        </div>
      )}

      {evaluation && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="card flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-widest text-white/50">Overall</div>
            <div className="font-display text-8xl text-[#FF5A1F]" data-testid="int-overall">{evaluation.overall_score}</div>
            <div className="text-sm text-white/60">/ 100</div>
          </div>
          <div className="card lg:col-span-2">
            <div className="font-display text-xl mb-3">Section scores</div>
            {["technical_knowledge","communication","grammar","confidence","logical_thinking","problem_solving"].map(k => (
              <div key={k} className="mb-2">
                <div className="flex justify-between text-xs mb-1"><span className="text-white/60 capitalize">{k.replace('_',' ')}</span><span>{evaluation[k]}</span></div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#FF5A1F]" style={{width:`${evaluation[k]||0}%`}} /></div>
              </div>
            ))}
          </div>
          <div className="card"><div className="font-display text-xl mb-2">Strengths</div><ul className="text-sm text-white/70 list-disc pl-4 space-y-1">{(evaluation.strengths||[]).map((s,i)=><li key={i}>{s}</li>)}</ul></div>
          <div className="card"><div className="font-display text-xl mb-2">Weaknesses</div><ul className="text-sm text-white/70 list-disc pl-4 space-y-1">{(evaluation.weaknesses||[]).map((s,i)=><li key={i}>{s}</li>)}</ul></div>
          <div className="card"><div className="font-display text-xl mb-2">Improvements</div><ul className="text-sm text-white/70 list-disc pl-4 space-y-1">{(evaluation.improvements||[]).map((s,i)=><li key={i}>{s}</li>)}</ul></div>
          <div className="card lg:col-span-3 flex justify-between items-center">
            <div className="text-sm text-white/70">{evaluation.verdict}</div>
            <button onClick={()=>{ setState({ interview_id: null, question: null, index: 0, total: 0, done: false }); setEvaluation(null); }} className="btn-primary text-sm">Try another</button>
          </div>
        </div>
      )}

      {history.length > 0 && !state.interview_id && (
        <div className="card">
          <div className="font-display text-xl mb-3">History</div>
          <div className="space-y-2">
            {history.slice(0,10).map(h => (
              <div key={h.interview_id} className="flex justify-between text-sm p-2 rounded-lg bg-white/5">
                <div><div>{h.role} · {h.round_type} · {h.difficulty}</div><div className="text-xs text-white/40">{new Date(h.started_at).toLocaleString()}</div></div>
                <div className="font-display text-lg text-[#FF5A1F]">{h.evaluation?.overall_score || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
