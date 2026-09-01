import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  LayoutDashboard, Users, CreditCard, Receipt, BarChart3, Database,
  ShieldCheck, History, Settings, LogOut, Search, Menu, X, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, tid: "sidebar-nav-dashboard", end: true },
  { to: "/santri", label: "Data Santri", icon: Users, tid: "sidebar-nav-santri" },
  { to: "/pembayaran", label: "Pembayaran", icon: CreditCard, tid: "sidebar-nav-pembayaran" },
  { to: "/tagihan", label: "Tagihan", icon: Receipt, tid: "sidebar-nav-tagihan" },
  { to: "/laporan", label: "Laporan", icon: BarChart3, tid: "sidebar-nav-laporan" },
  { to: "/master-data", label: "Master Data", icon: Database, tid: "sidebar-nav-master" },
  { to: "/admin", label: "Manajemen Admin", icon: ShieldCheck, tid: "sidebar-nav-admin", role: "super_admin" },
  { to: "/aktivitas", label: "Aktivitas", icon: History, tid: "sidebar-nav-aktivitas", role: "super_admin" },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings, tid: "sidebar-nav-pengaturan" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!searchOpen || q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setResults(data.santri || []);
      } catch { setResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, searchOpen]);

  const visibleNav = NAV.filter((n) => !n.role || n.role === user?.role);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 lg:w-72 flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl border-r border-emerald-800/50 fixed inset-y-0 left-0 z-40">
        <BrandHeader />
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {visibleNav.map((n) => <NavItem key={n.to} {...n} />)}
        </nav>
        <FooterQuote />
      </aside>

      {/* Mobile sidebar */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="p-0 md:hidden bg-emerald-950 text-white border-emerald-800 max-w-xs">
          <BrandHeader onClose={() => setMobileOpen(false)} />
          <nav className="px-3 py-2 space-y-1">
            {visibleNav.map((n) => <NavItem key={n.to} {...n} onClick={() => setMobileOpen(false)} />)}
          </nav>
        </DialogContent>
      </Dialog>

      <div className="flex-1 md:ml-64 lg:ml-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-emerald-100 px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} data-testid="mobile-menu-toggle">
              <Menu size={20} />
            </Button>
            <button
              data-testid="global-search-input"
              onClick={() => setSearchOpen(true)}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-300 transition text-slate-500 text-sm"
            >
              <Search size={16} />
              <span className="flex-1 text-left">Cari santri, nomor induk, NIK…</span>
              <kbd className="hidden md:inline-block text-xs px-1.5 py-0.5 bg-white border border-slate-200 rounded">⌘K</kbd>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:inline-flex border-amber-300 text-amber-700 bg-amber-50">
              {user?.role === "super_admin" ? "Super Admin" : "Admin"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-trigger" className="flex items-center gap-2 hover:bg-slate-100 rounded-lg px-2 py-1.5">
                  <Avatar className="w-8 h-8 border-2 border-emerald-200">
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback className="bg-emerald-700 text-white text-xs">{(user?.name || "A").slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-emerald-950 leading-tight">{user?.name || "-"}</div>
                    <div className="text-xs text-slate-500 leading-tight">{user?.email}</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Akun</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/pengaturan")} data-testid="menu-settings">
                  <Settings size={16} className="mr-2" /> Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} data-testid="menu-logout" className="text-rose-600 focus:text-rose-700">
                  <LogOut size={16} className="mr-2" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Global search dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl p-0">
          <div className="border-b border-slate-200 p-3 flex items-center gap-2">
            <Search size={18} className="text-emerald-700" />
            <Input
              data-testid="global-search-inner-input"
              autoFocus placeholder="Cari nama santri, nomor induk, NIK, WhatsApp…"
              value={q} onChange={(e) => setQ(e.target.value)}
              className="border-0 focus-visible:ring-0 shadow-none"
            />
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {results.length === 0 && q.length >= 2 && (
              <div className="p-6 text-center text-sm text-slate-500">Tidak ada hasil</div>
            )}
            {results.map((s) => (
              <button
                key={s.santri_id}
                onClick={() => { setSearchOpen(false); navigate(`/santri/${s.santri_id}`); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 text-left"
                data-testid={`search-result-${s.santri_id}`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-semibold">
                  {(s.nama || "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{s.nama}</div>
                  <div className="text-xs text-slate-500">{s.nomor_induk} • {s.kelas} • {s.program}</div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandHeader({ onClose }) {
  return (
    <div className="p-5 border-b border-emerald-800/40 relative">
      <div className="flex items-center gap-3">
        <img src="/assets/logo.png" alt="Logo Ponpes As Shidiq" className="w-12 h-12 object-contain drop-shadow-lg" />
        <div>
          <div className="text-[10px] uppercase tracking-widest text-amber-300 font-bold">Pondok Pesantren</div>
          <div className="text-base font-bold leading-tight">AS SHIDIQ</div>
          <div className="text-[10px] text-emerald-200/70">Santri Management</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="absolute right-3 top-3 text-white/70"><X size={20} /></button>
        )}
      </div>
      <div className="islamic-divider mt-4 opacity-60" />
    </div>
  );
}

function NavItem({ to, label, icon: Icon, tid, end, onClick }) {
  return (
    <NavLink
      to={to} end={end} data-testid={tid} onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive
            ? "bg-emerald-800/60 text-white shadow-inner border-l-2 border-amber-400"
            : "text-emerald-100/80 hover:bg-emerald-800/40 hover:text-white"
        }`
      }
    >
      <Icon size={18} strokeWidth={2} />
      {label}
    </NavLink>
  );
}

function FooterQuote() {
  return (
    <div className="px-5 py-4 border-t border-emerald-800/40">
      <div className="font-arabic text-amber-300 text-base leading-tight">اطلبوا العلم من المهد إلى اللحد</div>
      <div className="text-[10px] text-emerald-200/60 mt-1">"Tuntutlah ilmu dari buaian hingga liang lahat"</div>
    </div>
  );
}
