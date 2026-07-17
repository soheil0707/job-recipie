import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function AuthCallback() {
  const nav = useNavigate();
  const { setSessionUser } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    const sid = match ? decodeURIComponent(match[1]) : null;
    if (!sid) { nav("/login", { replace: true }); return; }
    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id: sid });
        setSessionUser(data.user, data.token);
        window.history.replaceState(null, "", "/app");
        nav("/app", { replace: true });
      } catch (e) {
        toast.error("Sign-in failed");
        nav("/login", { replace: true });
      }
    })();
  }, [nav, setSessionUser]);

  return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white/60">Signing you in…</div>;
}
