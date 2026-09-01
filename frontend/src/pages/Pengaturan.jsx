import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Moon, LogOut, Info } from "lucide-react";

export default function Pengaturan() {
  const { user, logout } = useAuth();
  return (
    <div className="space-y-4 max-w-3xl" data-testid="page-pengaturan">
      <div>
        <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Pengaturan</div>
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-950 font-display">Profil & Preferensi</h1>
      </div>
      <Card><CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-amber-400">
            <AvatarImage src={user?.picture} />
            <AvatarFallback className="bg-emerald-700 text-white">{(user?.name || "A").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold text-emerald-950 text-lg">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
            <div className="text-xs text-amber-700 font-medium mt-1">{user?.role === "super_admin" ? "Super Admin" : "Admin"}</div>
          </div>
          <Button variant="outline" onClick={logout} className="text-rose-600" data-testid="pengaturan-logout"><LogOut size={16} className="mr-2" />Keluar</Button>
        </div>
      </CardContent></Card>
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50/40 to-white"><CardContent className="p-6">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0"><Moon className="text-amber-700" size={20} /></div>
          <div>
            <div className="font-semibold text-emerald-950">Tentang Aplikasi</div>
            <div className="text-sm text-slate-600 mt-1">AS SHIDIQ SANTRI MANAGEMENT — Sistem manajemen data & administrasi santri Pondok Pesantren As Shidiq.</div>
            <div className="text-xs text-slate-500 mt-2 font-arabic text-base">جزاكم الله خيراً</div>
          </div>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-6">
        <div className="flex gap-3">
          <Info className="text-emerald-700" />
          <div>
            <div className="font-semibold text-emerald-950 mb-1">Fitur Roadmap Berikutnya</div>
            <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
              <li>Absensi santri & Kartu digital RFID</li>
              <li>Notifikasi WhatsApp otomatis tagihan</li>
              <li>Pembayaran online (Midtrans/Xendit)</li>
              <li>Rapor, ujian online, perizinan & PPDB online</li>
            </ul>
          </div>
        </div>
      </CardContent></Card>
    </div>
  );
}
