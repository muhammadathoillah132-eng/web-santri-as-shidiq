import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, fmtIDR, fmtDate, API } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Phone, MapPin, User, Home, GraduationCap, FileText, Printer, Receipt } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SantriDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  useEffect(() => { (async () => setData((await api.get(`/santri/${id}`)).data))(); }, [id]);
  if (!data) return <div className="p-8 text-slate-500">Memuat…</div>;
  const s = data.santri;
  const totalBayar = (data.payments || []).reduce((a, b) => a + (b.nominal || 0), 0);
  const totalTagihan = (data.invoices || []).filter((i) => i.status !== "lunas").reduce((a, b) => a + ((b.nominal - (b.terbayar || 0)) || 0), 0);

  return (
    <div className="space-y-5" data-testid="page-santri-detail">
      <Button variant="ghost" onClick={() => nav(-1)} data-testid="back-btn"><ArrowLeft size={16} className="mr-2" />Kembali</Button>

      <Card className="border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 p-5 md:p-8 text-white relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #FBBF24 1px, transparent 2px)", backgroundSize: "40px 40px" }} />
          <div className="relative flex flex-col md:flex-row gap-5 items-start md:items-center">
            <Avatar className="w-24 h-24 border-4 border-amber-400">
              <AvatarFallback className="bg-emerald-900 text-3xl">{(s.nama || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest text-amber-300 font-semibold">{s.program} • {s.kelas}</div>
              <h1 className="text-2xl md:text-3xl font-bold font-display">{s.nama}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className="bg-amber-500 text-emerald-950 hover:bg-amber-500">NIS {s.nomor_induk}</Badge>
                <Badge variant="outline" className="border-emerald-200 text-emerald-50">{s.gender === "L" ? "Putra" : "Putri"}</Badge>
                <Badge className={s.status === "aktif" ? "bg-emerald-500" : "bg-slate-500"}>{s.status}</Badge>
                <Badge variant="outline" className="border-amber-200 text-amber-100">{s.status_mukim}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:min-w-64">
              <StatBox label="Total Terbayar" value={fmtIDR(totalBayar)} color="amber" />
              <StatBox label="Belum Lunas" value={fmtIDR(totalTagihan)} color="rose" />
            </div>
          </div>
        </div>

        <CardContent className="p-4 md:p-6">
          <Tabs defaultValue="profil">
            <TabsList className="grid grid-cols-4 md:grid-cols-7 mb-4">
              <TabsTrigger value="profil" data-testid="tab-profil">Profil</TabsTrigger>
              <TabsTrigger value="pendidikan" data-testid="tab-pendidikan">Pendidikan</TabsTrigger>
              <TabsTrigger value="ortu" data-testid="tab-ortu">Orang Tua</TabsTrigger>
              <TabsTrigger value="asrama" data-testid="tab-asrama">Asrama</TabsTrigger>
              <TabsTrigger value="pembayaran" data-testid="tab-pembayaran">Pembayaran</TabsTrigger>
              <TabsTrigger value="tagihan" data-testid="tab-tagihan">Tagihan</TabsTrigger>
              <TabsTrigger value="dokumen" data-testid="tab-dokumen">Dokumen</TabsTrigger>
            </TabsList>
            <TabsContent value="profil">
              <InfoGrid rows={[
                ["Nama Lengkap", s.nama], ["Nama Panggilan", s.nama_panggilan],
                ["NIK", s.nik], ["NISN", s.nisn],
                ["Tempat, Tanggal Lahir", `${s.tempat_lahir || "-"}, ${fmtDate(s.tanggal_lahir)}`],
                ["WhatsApp", s.whatsapp], ["Email", s.email || "-"],
                ["Alamat", s.alamat], ["Desa", s.desa], ["Kecamatan", s.kecamatan],
                ["Kabupaten", s.kabupaten], ["Provinsi", s.provinsi],
              ]} />
            </TabsContent>
            <TabsContent value="pendidikan">
              <InfoGrid rows={[
                ["Program", s.program], ["Kelas", s.kelas], ["Jurusan", s.jurusan],
                ["Tahun Masuk", s.tahun_masuk], ["Asal Sekolah", s.asal_sekolah],
                ["Status Pendidikan", s.status_pendidikan || "aktif"],
              ]} />
            </TabsContent>
            <TabsContent value="ortu">
              <InfoGrid rows={[
                ["Nama Ayah", s.nama_ayah], ["NIK Ayah", s.nik_ayah], ["Pekerjaan Ayah", s.pekerjaan_ayah], ["WA Ayah", s.wa_ayah],
                ["Nama Ibu", s.nama_ibu], ["NIK Ibu", s.nik_ibu], ["Pekerjaan Ibu", s.pekerjaan_ibu], ["WA Ibu", s.wa_ibu],
                ["Nama Wali", s.nama_wali || "-"], ["Hubungan", s.hubungan_wali || "-"], ["WA Wali", s.wa_wali || "-"],
              ]} />
            </TabsContent>
            <TabsContent value="asrama">
              <InfoGrid rows={[
                ["Asrama", s.asrama], ["Nomor Kamar", s.nomor_kamar],
                ["Status Mukim", s.status_mukim], ["Tanggal Masuk Pondok", fmtDate(s.tanggal_masuk_pondok)],
                ["Asal Daerah", s.asal_daerah],
              ]} />
            </TabsContent>
            <TabsContent value="pembayaran">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-50 text-emerald-900">
                    <tr><th className="text-left p-3">No. Trx</th><th className="text-left p-3">Jenis</th><th className="text-left p-3">Periode</th><th className="text-right p-3">Nominal</th><th className="text-left p-3">Tanggal</th><th className="text-right p-3">Aksi</th></tr>
                  </thead>
                  <tbody>
                    {(data.payments || []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-400">Belum ada pembayaran</td></tr>}
                    {(data.payments || []).map((p, i) => (
                      <tr key={p.payment_id} className="border-t border-slate-100">
                        <td className="p-3 font-mono text-xs">{p.trx_no}</td>
                        <td className="p-3">{p.jenis}</td>
                        <td className="p-3">{p.periode}</td>
                        <td className="p-3 text-right font-semibold text-emerald-800">{fmtIDR(p.nominal)}</td>
                        <td className="p-3">{fmtDate(p.tanggal)}</td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => window.open(`${API}/pembayaran/${p.payment_id}/kwitansi`, "_blank")} data-testid={`print-kwitansi-${i}`}>
                            <Printer size={14} className="mr-1" />Kwitansi
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="tagihan">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-50 text-emerald-900">
                    <tr><th className="text-left p-3">Jenis</th><th className="text-left p-3">Periode</th><th className="text-right p-3">Nominal</th><th className="text-right p-3">Terbayar</th><th className="text-left p-3">Status</th></tr>
                  </thead>
                  <tbody>
                    {(data.invoices || []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">Belum ada tagihan</td></tr>}
                    {(data.invoices || []).map((inv) => (
                      <tr key={inv.invoice_id} className="border-t border-slate-100">
                        <td className="p-3">{inv.jenis}</td>
                        <td className="p-3">{inv.periode}</td>
                        <td className="p-3 text-right">{fmtIDR(inv.nominal)}</td>
                        <td className="p-3 text-right text-emerald-700">{fmtIDR(inv.terbayar || 0)}</td>
                        <td className="p-3"><Badge className={inv.status === "lunas" ? "bg-emerald-100 text-emerald-800" : inv.status === "cicilan" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}>{inv.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            <TabsContent value="dokumen">
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">Fitur unggah dokumen akan ditambahkan di versi berikutnya.</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value, color }) {
  const map = { amber: "bg-amber-500/20 border-amber-400", rose: "bg-rose-500/20 border-rose-400" };
  return (
    <div className={`px-4 py-3 rounded-xl border ${map[color]}`}>
      <div className="text-[10px] uppercase tracking-widest text-white/70 font-semibold">{label}</div>
      <div className="text-base md:text-lg font-bold font-display">{value}</div>
    </div>
  );
}
function InfoGrid({ rows }) {
  return (
    <div className="grid md:grid-cols-2 gap-y-3 gap-x-6">
      {rows.map(([l, v]) => (
        <div key={l} className="flex justify-between border-b border-slate-100 pb-2">
          <div className="text-sm text-slate-500">{l}</div>
          <div className="text-sm font-medium text-emerald-950 text-right">{v || "-"}</div>
        </div>
      ))}
    </div>
  );
}
