import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { Download } from "lucide-react";
import { jsPDF } from "jspdf";

const COLORS = ["#FF5A1F", "#22c55e", "#3b82f6", "#a855f7", "#f43f5e", "#eab308"];

export default function Analytics() {
  const [d, setD] = useState(null);
  useEffect(()=>{ api.get("/analytics").then(r=>setD(r.data)).catch(()=>{}); }, []);
  const download = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.setTextColor(255, 90, 31); doc.text("Job Recipe — Analytics Report", 20, 20);
    doc.setFontSize(12); doc.setTextColor(0); doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    let y = 45;
    if (d) {
      doc.text(`Total applications: ${d.total_applications}`, 20, y); y+=8;
      doc.text(`Offer success rate: ${d.success_rate}%`, 20, y); y+=8;
      doc.text(`Interview success (>=70): ${d.interview_success}%`, 20, y); y+=8;
      doc.text(`Learning streak: ${d.learning_streak} days`, 20, y); y+=8;
      doc.text(`Skills strengthened: ${d.skills_learned}`, 20, y); y+=12;
      doc.text("Application funnel:", 20, y); y+=8;
      Object.entries(d.status_counts || {}).forEach(([k,v])=>{ doc.text(`  ${k}: ${v}`, 25, y); y+=6; });
    }
    doc.save("jobrecipe-analytics.pdf");
  };

  if (!d) return <div className="text-white/50" data-testid="analytics-page">Loading…</div>;
  const funnelData = Object.entries(d.status_counts || {}).map(([k,v])=>({name: k, value: v}));

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">Step 17</div>
          <h1 className="font-display text-4xl tracking-tight mt-1">Analytics Dashboard</h1>
        </div>
        <button data-testid="analytics-download" onClick={download} className="btn-primary text-sm inline-flex items-center gap-2"><Download className="w-4 h-4" />Download PDF</button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><div className="text-xs uppercase tracking-widest text-white/50">Applications</div><div className="font-display text-4xl mt-1">{d.total_applications}</div></div>
        <div className="card"><div className="text-xs uppercase tracking-widest text-white/50">Offer rate</div><div className="font-display text-4xl mt-1 text-[#FF5A1F]">{d.success_rate}%</div></div>
        <div className="card"><div className="text-xs uppercase tracking-widest text-white/50">Interview success</div><div className="font-display text-4xl mt-1">{d.interview_success}%</div></div>
        <div className="card"><div className="text-xs uppercase tracking-widest text-white/50">Learning streak</div><div className="font-display text-4xl mt-1">🔥 {d.learning_streak}d</div></div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-display text-xl mb-3">Interview scores over time</div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={d.interview_timeline}>
                <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} domain={[0,100]} />
                <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid #1a1a1a', borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="#FF5A1F" strokeWidth={2} dot={{ fill: '#FF5A1F' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="font-display text-xl mb-3">Resume ATS progress</div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={d.resume_timeline}>
                <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} domain={[0,100]} />
                <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid #1a1a1a', borderRadius: 8 }} />
                <Line type="monotone" dataKey="ats" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="font-display text-xl mb-3">Application funnel</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={funnelData}>
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid #1a1a1a', borderRadius: 8 }} />
                <Bar dataKey="value" radius={[8,8,0,0]}>{funnelData.map((_, i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="font-display text-xl mb-3">Status breakdown</div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={funnelData} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={4}>{funnelData.map((_, i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie>
                <Tooltip contentStyle={{ background: '#0A0A0A', border: '1px solid #1a1a1a', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
