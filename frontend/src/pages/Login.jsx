import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, ShieldCheck, Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const { user, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: "", password: "", remember_me: false });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    window.location.href = "/";
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!form.identifier.trim() || !form.password) {
      setError("Username dan password wajib diisi");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("session_token", data.session_token);
      setUser(data.user);
      navigate("/", { replace: true });
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Login gagal. Periksa kembali username & password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 relative overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #FBBF24 1px, transparent 2px), radial-gradient(circle at 80% 70%, #10B981 1px, transparent 2px)", backgroundSize: "60px 60px" }} />
        <div className="relative">
          <div className="flex items-center gap-4 mb-8">
            <img src="/assets/logo.png" alt="Logo Ponpes As Shidiq" className="w-20 h-20 object-contain drop-shadow-xl" />
            <div>
              <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold">Pondok Pesantren</div>
              <div className="text-xl font-bold">AS SHIDIQ</div>
            </div>
          </div>
          <div className="font-arabic text-3xl text-amber-200 mb-2">أهلاً وسهلاً</div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
            Sistem Manajemen<br /><span className="text-amber-300">Santri Modern</span>
          </h1>
          <p className="text-emerald-100/80 max-w-md">
            Kelola data santri, pembayaran, dan administrasi pondok dalam satu panel terpusat yang bersih & aman.
          </p>
        </div>
        <div className="relative space-y-3">
          <div className="flex items-center gap-3 text-emerald-100/90 text-sm">
            <ShieldCheck size={18} className="text-amber-300" />
            Akses berbasis peran (Super Admin & Admin)
          </div>
          <div className="flex items-center gap-3 text-emerald-100/90 text-sm">
            <Star size={18} className="text-amber-300" />
            Password terenkripsi & proteksi brute-force
          </div>
          <div className="islamic-divider mt-6 opacity-50" />
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-emerald-100">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <img src="/assets/logo.png" alt="Logo Ponpes As Shidiq" className="w-12 h-12 object-contain" />
            <div className="font-bold text-emerald-900">AS SHIDIQ</div>
          </div>
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-2">Login Admin</div>
          <h2 className="text-2xl font-bold text-emerald-950 mb-2">Selamat Datang Kembali</h2>
          <p className="text-slate-500 text-sm mb-8">Masuk untuk melanjutkan mengelola data santri & administrasi pondok.</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-identifier" className="text-xs font-semibold text-emerald-900">Username / Email</Label>
              <Input
                id="login-identifier"
                data-testid="login-username-input"
                autoComplete="username"
                placeholder="Masukkan username atau email"
                value={form.identifier}
                onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-xs font-semibold text-emerald-900">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  data-testid="login-password-input"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  data-testid="login-toggle-password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-700"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                data-testid="login-remember-checkbox"
                checked={form.remember_me}
                onChange={(e) => setForm({ ...form, remember_me: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 accent-emerald-700"
              />
              <span className="text-sm text-slate-600">Ingat saya (30 hari)</span>
            </label>

            {error && (
              <div data-testid="login-error" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={busy}
              data-testid="login-submit-button"
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
            >
              <LogIn size={18} className="mr-2" />
              {busy ? "Memproses…" : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Info</div>
            <div className="text-sm text-slate-700">
              Akun admin dibuat oleh <b>Super Admin</b> melalui menu <b>Manajemen Admin</b>. Lupa password? Minta Super Admin untuk me-reset password Anda.
            </div>
          </div>

          <div className="islamic-divider my-6" />
          <div className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Pondok Pesantren As Shidiq. Barokallahu fiikum.
          </div>
        </div>
      </div>
    </div>
  );
}
