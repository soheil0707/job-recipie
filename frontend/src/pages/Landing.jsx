import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Target, Rocket, Brain, LineChart, Briefcase, Zap, ArrowRight } from "lucide-react";

const HERO = "https://images.unsplash.com/photo-1729169927271-7826d8aae360?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHRlY2hub2xvZ3klMjBibGFjayUyMG9yYW5nZXxlbnwwfHx8fDE3ODI0NDQ3NTN8MA&ixlib=rb-4.1.0&q=85";

const features = [
  { icon: Brain, title: "AI Resume Parser", desc: "Upload PDF/DOCX. We extract skills, experience, and achievements in seconds." },
  { icon: Target, title: "ATS Score", desc: "Get a 100-point ATS report with actionable improvements." },
  { icon: LineChart, title: "Skill Gap Analysis", desc: "Compare your skills against any target role. See exactly what to learn." },
  { icon: Rocket, title: "Career Roadmap", desc: "Personalized week-by-week plan from where you are to where you want to be." },
  { icon: Briefcase, title: "Job Match %", desc: "Every job scored against your resume. Apply only where you fit." },
  { icon: Zap, title: "AI Mock Interviews", desc: "HR, technical & behavioral rounds with detailed evaluation." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center font-display font-bold">JR</div>
            <span className="font-display font-semibold text-xl">Job Recipe</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link data-testid="nav-login" to="/login" className="text-sm text-white/80 hover:text-white px-4 py-2">Sign in</Link>
            <Link data-testid="nav-register" to="/register" className="btn-primary text-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative grid-bg">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-28 grid lg:grid-cols-12 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-white/70 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5A1F]" /> AI Career Assistant — Powered by Gemini
            </div>
            <h1 className="font-display font-bold text-5xl md:text-7xl leading-[0.95] tracking-tighter">
              Cook your <span className="text-[#FF5A1F]">dream job</span>,<br /> ingredient by ingredient.
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-xl leading-relaxed">
              Upload your resume. Get an ATS score. Discover the skills you're missing. Follow a personalized roadmap. Nail every interview.
              Job Recipe is your end-to-end AI career kitchen.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link data-testid="hero-cta-start" to="/register" className="btn-primary inline-flex items-center gap-2">
                Start free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link data-testid="hero-cta-login" to="/login" className="px-6 py-3 rounded-full border border-white/15 hover:border-white/30 text-sm">
                I already have an account
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-white/40 uppercase tracking-widest">
              <span>Trusted stack</span>
              <span>Gemini • React • FastAPI</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_24px_80px_rgba(255,90,31,0.15)]">
              <img src={HERO} alt="Job Recipe" className="w-full h-[520px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4">
                <div className="text-xs text-white/50 uppercase tracking-widest">Live match</div>
                <div className="mt-1 flex items-baseline gap-3">
                  <div className="font-display text-4xl text-[#FF5A1F] font-bold">91%</div>
                  <div className="text-sm text-white/70">suitability for Software Engineer @ Google</div>
                </div>
                <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF5A1F]" style={{ width: "91%" }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-12">
          <div className="text-xs uppercase tracking-widest text-[#FF5A1F]">The recipe</div>
          <h2 className="font-display text-4xl md:text-5xl mt-2 tracking-tight">Every ingredient for your career.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card group"
              data-testid={`feature-${i}`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#FF5A1F]" />
              </div>
              <div className="font-display text-xl mb-2">{f.title}</div>
              <div className="text-sm text-white/60 leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Big CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 p-12 md:p-20 text-center noise">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF5A1F]/20 via-transparent to-transparent" />
          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-6xl tracking-tighter">From <span className="text-[#FF5A1F]">42% → 78%</span> hiring probability.</h2>
            <p className="mt-4 text-white/60 max-w-xl mx-auto">Job Recipe tracks the delta between where you are and where you need to be — and gives you the exact next step.</p>
            <Link data-testid="footer-cta" to="/register" className="btn-primary mt-8 inline-flex items-center gap-2">
              Cook my first recipe <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/40">
        © 2026 Job Recipe. Built for careers that matter.
      </footer>
    </div>
  );
}
