import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Moon, Star, ShieldCheck } from "lucide-react";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function Login() {
  const { user, loading } = useAuth();
  if (!loading && user) {
    window.location.href = "/";
    return null;
  }
  const handleLogin = () => {
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 relative overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #FBBF24 1px, transparent 2px), radial-gradient(circle at 80% 70%, #10B981 1px, transparent 2px)", backgroundSize: "60px 60px" }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Moon className="text-emerald-950" size={24} strokeWidth={2.5} />
            </div>
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
            Login satu klik dengan akun Google
          </div>
          <div className="islamic-divider mt-6 opacity-50" />
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-emerald-100">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center">
              <Moon className="text-amber-300" size={20} />
            </div>
            <div className="font-bold text-emerald-900">AS SHIDIQ</div>
          </div>
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-2">Login Admin</div>
          <h2 className="text-2xl font-bold text-emerald-950 mb-2">Selamat Datang Kembali</h2>
          <p className="text-slate-500 text-sm mb-8">Masuk untuk melanjutkan mengelola data santri & administrasi pondok.</p>

          <Button
            data-testid="google-login-button"
            onClick={handleLogin}
            className="w-full h-12 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-300 shadow-sm font-medium"
          >
            <svg className="mr-2" width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Lanjutkan dengan Google
          </Button>

          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Info</div>
            <div className="text-sm text-slate-700">
              Login pertama akan memberikan akses <b>Super Admin</b> otomatis kepada pemilik akun. Admin tambahan dapat diundang melalui menu <b>Manajemen Admin</b>.
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
