import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const hash = location.hash || "";
    const m = hash.match(/session_id=([^&]+)/);
    if (!m) { navigate("/login", { replace: true }); return; }
    const session_id = decodeURIComponent(m[1]);
    (async () => {
      try {
        const { data } = await api.post("/auth/session", { session_id });
        setUser(data.user);
        window.history.replaceState(null, "", "/");
        navigate("/", { replace: true, state: { user: data.user } });
      } catch (e) {
        console.error(e);
        navigate("/login", { replace: true });
      }
    })();
  }, [location.hash, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-emerald-800 font-medium">Menyiapkan sesi Anda…</div>
    </div>
  );
}
