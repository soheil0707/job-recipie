import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

function GoogleBtn() {
  const onClick = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/app";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  return (
    <button data-testid="google-signin-btn" onClick={onClick} className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-3 text-sm">
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      Continue with Google
    </button>
  );
}

export default function Login() {
  const nav = useNavigate();
  const { loginWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await loginWithPassword(email, password);
      toast.success("Welcome back!");
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#050505] text-white">
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-[#FF5A1F] flex items-center justify-center font-display font-bold">JR</div>
            <span className="font-display text-xl">Job Recipe</span>
          </Link>
          <h1 className="font-display text-4xl mb-2 tracking-tight">Welcome back.</h1>
          <p className="text-white/60 mb-8">Sign in and keep building your recipe.</p>

          <GoogleBtn />
          <div className="my-6 flex items-center gap-3 text-xs text-white/40">
            <div className="flex-1 h-px bg-white/10" /> or <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <input data-testid="login-email" type="email" required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
            <input data-testid="login-password" type="password" required placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 focus:border-[#FF5A1F] outline-none" />
            <button data-testid="login-submit" disabled={busy} className="btn-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <div className="mt-6 text-sm text-white/60">
            New here? <Link data-testid="link-register" to="/register" className="text-[#FF5A1F] hover:underline">Create an account</Link>
          </div>
        </div>
      </div>
      <div className="hidden lg:block relative grid-bg border-l border-white/10">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md">
            <div className="text-xs uppercase tracking-widest text-[#FF5A1F] mb-3">Live recipe</div>
            <div className="font-display text-3xl tracking-tight leading-tight">"If you learn Kubernetes, Terraform, and CI/CD, your hiring chance goes from <span className="text-[#FF5A1F]">42% → 78%</span>."</div>
            <div className="mt-6 text-sm text-white/50">— Your AI Career Twin</div>
          </div>
        </div>
      </div>
    </div>
  );
}
