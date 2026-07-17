import React, { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Code2, HelpCircle, Database, Brain, Bug } from "lucide-react";

const KINDS = [
  { key: "coding", label: "Coding", icon: Code2 },
  { key: "mcq", label: "MCQ", icon: HelpCircle },
  { key: "sql", label: "SQL", icon: Database },
  { key: "aptitude", label: "Aptitude", icon: Brain },
  { key: "debugging", label: "Debugging", icon: Bug },
];

function runJs(code, input) {
  // Sandboxed-ish JS execution using Function constructor.
  try {
    // Extract function name
    const m = code.match(/function\s+(\w+)/);
    if (!m) return { error: "No function definition found" };
    const fnName = m[1];
    const wrapped = `${code}\nreturn ${fnName}(${input});`;
    // eslint-disable-next-line no-new-func
    const fn = new Function(wrapped);
    const out = fn();
    return { result: JSON.stringify(out) };
  } catch (e) { return { error: e.message }; }
}

export default function CodingAssessment() {
  const [kind, setKind] = useState("coding");
  const [state, setState] = useState({ assessment_id: null, questions: [], codes: [], answers: [] });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [outputs, setOutputs] = useState({});

  const start = async () => {
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/coding/assessment/start", { kind, difficulty: "Medium" });
      const codes = data.questions.map(q => q.template || "");
      setState({ assessment_id: data.assessment_id, questions: data.questions, codes, answers: [] });
      setOutputs({});
    } catch { toast.error("Failed"); } finally { setBusy(false); }
  };

  const runTests = (idx) => {
    const q = state.questions[idx];
    const code = state.codes[idx] || "";
    let allPass = true; const results = [];
    for (const t of q.tests || []) {
      const r = runJs(code, t.input);
      const ok = !r.error && r.result?.replace(/"/g,'') === t.expected.replace(/"/g,'');
      results.push({ ...t, got: r.result || r.error, ok });
      if (!ok) allPass = false;
    }
    setOutputs(o => ({ ...o, [idx]: { results, allPass } }));
    return allPass;
  };

  const submit = async () => {
    setBusy(true);
    const answers = state.questions.map((q, i) => {
      if (q.tests) { return { q_index: i, answer: outputs[i]?.allPass ? 1 : 0 }; }
      if (q.expected_keywords) { return { q_index: i, answer: state.codes[i] || "" }; }
      return { q_index: i, answer: state.answers[i] ?? -1 };
    });
    try { const { data } = await api.post("/coding/assessment/submit", { assessment_id: state.assessment_id, answers }); setResult(data); toast.success(`Score: ${data.score}`); }
    catch { toast.error("Failed"); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6" data-testid="coding-page">
      <div>
        <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Step 10</div>
        <h1 className="font-display text-4xl tracking-tight mt-1">Coding Assessment</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {KINDS.map(k => (
          <button key={k.key} data-testid={`kind-${k.key}`} onClick={()=>setKind(k.key)} className={`px-4 py-2 rounded-full text-sm inline-flex items-center gap-2 border ${kind===k.key?"bg-[#FF5A1F] border-[#FF5A1F]":"border-white/10 hover:border-white/30 text-white/70"}`}>
            <k.icon className="w-4 h-4" />{k.label}
          </button>
        ))}
        <button data-testid="assess-start" onClick={start} disabled={busy} className="btn-primary text-sm">{busy?"Loading…":"Start assessment"}</button>
      </div>

      {state.questions.map((q, i) => (
        <div key={i} className="card">
          <div className="text-xs uppercase tracking-widest text-white/50">Question {i+1}</div>
          <div className="font-display text-lg mt-1">{q.q}</div>
          {q.options && (
            <div className="mt-3 space-y-2">
              {q.options.map((opt, k) => (
                <label key={k} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
                  <input type="radio" name={`q${i}`} data-testid={`q${i}-opt${k}`} checked={state.answers[i] === k} onChange={()=>{ const a=[...state.answers]; a[i]=k; setState({...state, answers:a}); }} />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          )}
          {(q.template !== undefined) && (
            <div className="mt-3">
              <textarea data-testid={`q${i}-code`} rows={q.expected_keywords ? 4 : 8} value={state.codes[i] || ""} onChange={e=>{ const c=[...state.codes]; c[i]=e.target.value; setState({...state, codes:c}); }} className="w-full px-4 py-3 rounded-xl bg-[#050505] border border-white/10 focus:border-[#FF5A1F] outline-none font-mono text-sm" spellCheck={false} />
              {q.tests && (
                <div className="mt-2">
                  <button data-testid={`q${i}-run`} onClick={()=>runTests(i)} className="text-xs px-3 py-1.5 rounded-full border border-white/15 hover:border-[#FF5A1F]/40">Run tests</button>
                  {outputs[i] && (
                    <div className="mt-2 space-y-1">
                      {outputs[i].results.map((r, k) => (
                        <div key={k} className={`text-xs p-2 rounded-lg ${r.ok?'bg-green-500/10 border border-green-500/30 text-green-300':'bg-red-500/10 border border-red-500/30 text-red-300'}`}>
                          <span className="font-mono">Input: {r.input} → Expected: {r.expected} · Got: {r.got}</span> {r.ok?'✓':'✗'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {state.assessment_id && !result && <button data-testid="assess-submit" onClick={submit} disabled={busy} className="btn-primary">{busy?"Grading…":"Submit assessment"}</button>}

      {result && (
        <div className="card noise relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF5A1F]/10 via-transparent to-transparent" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">Score</div>
              <div className="font-display text-6xl text-[#FF5A1F]" data-testid="assess-score">{result.score}</div>
              <div className="text-sm text-white/60">{result.correct} / {result.total} correct</div>
            </div>
            <button onClick={()=>{ setState({ assessment_id: null, questions: [], codes: [], answers: [] }); setResult(null); }} className="btn-primary text-sm">Try another</button>
          </div>
        </div>
      )}
    </div>
  );
}
