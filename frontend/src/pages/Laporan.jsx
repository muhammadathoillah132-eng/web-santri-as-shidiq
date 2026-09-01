import React, { useEffect, useState } from "react";
import { api, fmtIDR, fmtDate } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Laporan() {
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(today.slice(0, 7) + "-01");
  const [end, setEnd] = useState(today);
  const [data, setData] = useState({ total: 0, count: 0, by_jenis: [], items: [] });

  const load = async () => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const { data } = await api.get(`/laporan?${params}`);
    setData(data);
  };
  useEffect(() => { load(); }, []);

  const setRange = (range) => {
    const now = new Date();
    if (range === "today") { const d = now.toISOString().slice(0, 10); setStart(d); setEnd(d); }
    if (range === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); setStart(d.toISOString().slice(0, 10)); setEnd(today); }
    if (range === "month") { setStart(today.slice(0, 7) + "-01"); setEnd(today); }
    if (range === "year") { setStart(today.slice(0, 4) + "-01-01"); setEnd(today); }
  };

  return (
    <div className="space-y-4" data-testid="page-laporan">
      <div>
        <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Laporan</div>
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-950 font-display">Laporan Keuangan</h1>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Dari</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} data-testid="lap-start" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Sampai</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} data-testid="lap-end" />
          </div>
          <Button onClick={load} className="bg-emerald-700 hover:bg-emerald-800" data-testid="lap-apply">Terapkan</Button>
          <div className="flex gap-1 ml-auto">
            <Button size="sm" variant="outline" onClick={() => setRange("today")} data-testid="lap-today">Hari Ini</Button>
            <Button size="sm" variant="outline" onClick={() => setRange("week")} data-testid="lap-week">Minggu</Button>
            <Button size="sm" variant="outline" onClick={() => setRange("month")} data-testid="lap-month">Bulan</Button>
            <Button size="sm" variant="outline" onClick={() => setRange("year")} data-testid="lap-year">Tahun</Button>
          </div>
        </div>
      </CardContent></Card>

      <div className="grid md:grid-cols-3 gap-3">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"><CardContent className="p-5">
          <div className="text-xs uppercase text-slate-500 font-semibold">Total Pemasukan</div>
          <div className="text-2xl font-bold text-emerald-800 font-display mt-1" data-testid="lap-total">{fmtIDR(data.total)}</div>
        </CardContent></Card>
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white"><CardContent className="p-5">
          <div className="text-xs uppercase text-slate-500 font-semibold">Jumlah Transaksi</div>
          <div className="text-2xl font-bold text-amber-800 font-display mt-1" data-testid="lap-count">{data.count}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-xs uppercase text-slate-500 font-semibold">Rata-rata / Transaksi</div>
          <div className="text-2xl font-bold text-slate-800 font-display mt-1">{fmtIDR(data.count ? data.total / data.count : 0)}</div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-5">
        <h3 className="font-semibold text-emerald-950 mb-3">Pembayaran per Jenis</h3>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={data.by_jenis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip formatter={(v) => fmtIDR(v)} />
              <Bar dataKey="total" fill="#047857" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-900">
            <tr><th className="text-left p-3">No. Trx</th><th className="text-left p-3">Santri</th><th className="text-left p-3">Jenis</th><th className="text-right p-3">Nominal</th><th className="text-left p-3">Tanggal</th></tr>
          </thead>
          <tbody>
            {data.items.slice(0, 50).map((p) => (
              <tr key={p.payment_id} className="border-t border-slate-100">
                <td className="p-3 font-mono text-xs">{p.trx_no}</td>
                <td className="p-3">{p.santri_nama}</td><td className="p-3">{p.jenis}</td>
                <td className="p-3 text-right font-semibold text-emerald-800">{fmtIDR(p.nominal)}</td>
                <td className="p-3">{fmtDate(p.tanggal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
