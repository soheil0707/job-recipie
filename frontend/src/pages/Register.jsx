import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function Register() {
  const nav = useNavigate();
  const { registerWithPassword } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await registerWithPassword(form.name, form.email, form.password);
      toast.success("Account created!");
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally { setBusy(false); }
  };

  const google = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/app";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-8">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center font-display font-bold">JR</div>
          <span className="font-display text-xl">Job Recipe</span>
        </Link>
        <h1 className="font-display text-4xl mb-2 tracking-tight">Create your recipe.</h1>
        <p className="text-white/60 mb-8">Join thousands cooking their careers.</p>

        <button data-testid="google-signup-btn" onClick={google} className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-3 text-sm">
          Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3 text-xs text-white/40">
          <div className="flex-1 h-px bg-white/10" /> or <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input data-testid="reg-name" required placeholder="Full name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
          <input data-testid="reg-email" type="email" required placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
          <input data-testid="reg-password" type="password" required minLength={6} placeholder="Password (min 6)" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
          <button data-testid="reg-submit" disabled={busy} className="btn-primary w-full">{busy ? "Creating…" : "Create account"}</button>
        </form>
        <div className="mt-6 text-sm text-white/60">
          Have an account? <Link data-testid="link-login" to="/login" className="text-[#FF5A1F] hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
