import React, { useEffect, useState } from "react";
import { api, fmtIDR } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Wallet, AlertCircle, Sparkles, GraduationCap, BookOpen } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const EMERALD = "#047857";
const GOLD = "#D97706";
const TEAL = "#0D9488";
const AMBER = "#F59E0B";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([api.get("/dashboard/stats"), api.get("/dashboard/charts")]);
      setStats(s.data); setCharts(c.data);
    })();
  }, []);

  const S = stats || {};
  const cards = [
    { title: "Total Santri", value: S.total_santri, sub: "Terdaftar", icon: Users, color: "emerald", tid: "stat-total" },
    { title: "Santri Putra", value: S.santri_putra, sub: "Laki-laki", icon: UserCheck, color: "teal", tid: "stat-putra" },
    { title: "Santri Putri", value: S.santri_putri, sub: "Perempuan", icon: UserCheck, color: "amber", tid: "stat-putri" },
    { title: "Santri Aktif", value: S.santri_aktif, sub: "Sedang mondok", icon: GraduationCap, color: "emerald", tid: "stat-aktif" },
    { title: "Nonaktif", value: S.santri_nonaktif, sub: "Boyong / lulus", icon: UserX, color: "slate", tid: "stat-nonaktif" },
    { title: "Pembayaran Bulan Ini", value: fmtIDR(S.pembayaran_bulan_ini), sub: "Total pemasukan", icon: Wallet, color: "gold", tid: "stat-bulan", isMoney: true },
    { title: "Tagihan Belum Lunas", value: S.tagihan_belum_lunas, sub: "Perlu ditindak", icon: AlertCircle, color: "rose", tid: "stat-belum" },
    { title: "Santri Baru", value: S.santri_baru, sub: "30 hari terakhir", icon: Sparkles, color: "amber", tid: "stat-baru" },
  ];

  return (
    <div className="space-y-6" data-testid="page-dashboard">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Dashboard</div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-emerald-950 font-display">Selamat datang di AS SHIDIQ</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan data santri, pembayaran & aktivitas pondok.</p>
        </div>
        <div className="font-arabic text-2xl text-emerald-800/70 hidden md:block">بسم الله الرحمن الرحيم</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => <StatCard key={c.tid} {...c} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-emerald-950">Pemasukan 6 Bulan Terakhir</h3>
              <BookOpen size={18} className="text-emerald-700" />
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={charts?.payments_monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v/1000000).toFixed(1)}jt`} />
                  <Tooltip formatter={(v) => fmtIDR(v)} contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Line type="monotone" dataKey="total" stroke={EMERALD} strokeWidth={3} dot={{ fill: GOLD, r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-emerald-950 mb-4">Distribusi Gender</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={charts?.by_gender || []} dataKey="count" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                    {(charts?.by_gender || []).map((_, i) => (
                      <Cell key={i} fill={[EMERALD, GOLD, TEAL][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-slate-200">
          <CardContent className="p-5">
            <h3 className="font-semibold text-emerald-950 mb-4">Sensus Santri per Program</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={charts?.by_program || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0" }} />
                  <Bar dataKey="count" fill={EMERALD} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon: Icon, color, tid, isMoney }) {
  const map = {
    emerald: "from-emerald-50 to-white border-emerald-200 text-emerald-700",
    teal: "from-teal-50 to-white border-teal-200 text-teal-700",
    amber: "from-amber-50 to-white border-amber-200 text-amber-700",
    gold: "from-amber-50 to-white border-amber-300 text-amber-800",
    rose: "from-rose-50 to-white border-rose-200 text-rose-700",
    slate: "from-slate-50 to-white border-slate-200 text-slate-700",
  };
  return (
    <Card data-testid={tid} className={`border bg-gradient-to-br ${map[color]} shadow-sm hover:shadow-md transition`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</div>
            <div className={`mt-2 font-bold text-emerald-950 ${isMoney ? "text-lg md:text-xl" : "text-2xl md:text-3xl"} font-display`}>{value ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">{sub}</div>
          </div>
          <div className={`w-10 h-10 rounded-lg bg-white/70 flex items-center justify-center shadow-sm`}>
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
