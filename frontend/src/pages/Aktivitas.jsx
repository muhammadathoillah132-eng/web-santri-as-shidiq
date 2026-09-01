import React, { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Aktivitas() {
  const [list, setList] = useState([]);
  useEffect(() => { (async () => setList((await api.get("/aktivitas")).data))(); }, []);
  return (
    <div className="space-y-4" data-testid="page-aktivitas">
      <div>
        <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Aktivitas</div>
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-950 font-display">Log Aktivitas Admin</h1>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-900"><tr><th className="text-left p-3">Waktu</th><th className="text-left p-3">Admin</th><th className="text-left p-3">Aktivitas</th><th className="text-left p-3">Entitas</th><th className="text-left p-3">Detail</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400">Belum ada aktivitas</td></tr>}
            {list.map((l, i) => (
              <tr key={l.log_id} className="border-t border-slate-100" data-testid={`log-row-${i}`}>
                <td className="p-3 text-xs">{new Date(l.created_at).toLocaleString("id-ID")}</td>
                <td className="p-3">{l.user_name || l.user_email}</td>
                <td className="p-3"><Badge variant="outline">{l.action}</Badge></td>
                <td className="p-3 text-slate-500">{l.entity}</td>
                <td className="p-3 text-slate-700">{l.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
