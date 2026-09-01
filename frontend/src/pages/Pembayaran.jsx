import React, { useEffect, useState } from "react";
import { api, fmtIDR, fmtDate, API } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function Pembayaran() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [jenis, setJenis] = useState("all");
  const [open, setOpen] = useState(false);
  const [ptypes, setPtypes] = useState([]);

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (jenis && jenis !== "all") params.set("jenis", jenis);
    const { data } = await api.get(`/pembayaran?${params}`);
    setList(data);
  };
  useEffect(() => { load(); }, [jenis]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => { (async () => setPtypes((await api.get("/master/payment_types")).data))(); }, []);

  const remove = async (p) => {
    if (!window.confirm(`Hapus transaksi ${p.trx_no}?`)) return;
    try { await api.delete(`/pembayaran/${p.payment_id}`); toast.success("Terhapus"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };

  return (
    <div className="space-y-4" data-testid="page-pembayaran">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Pembayaran</div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-950 font-display">Catat Pembayaran Santri</h1>
          <p className="text-slate-500 text-sm mt-1">SPP, uang makan, gedung, dan pembayaran lainnya.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-emerald-700 hover:bg-emerald-800" data-testid="add-payment-btn">
          <Plus size={16} className="mr-2" />Catat Pembayaran
        </Button>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Cari nama, nomor induk, no transaksi…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" data-testid="pay-search" />
            </div>
            <Select value={jenis} onValueChange={setJenis}>
              <SelectTrigger data-testid="pay-filter-jenis"><SelectValue placeholder="Semua Jenis" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                {ptypes.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-emerald-50 text-emerald-900">
              <tr>
                <th className="text-left p-3">No. Trx</th><th className="text-left p-3">Santri</th>
                <th className="text-left p-3">Jenis</th><th className="text-left p-3">Periode</th>
                <th className="text-right p-3">Nominal</th><th className="text-left p-3">Metode</th>
                <th className="text-left p-3">Tanggal</th><th className="text-right p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-slate-400">Belum ada pembayaran</td></tr>}
              {list.map((p, i) => (
                <tr key={p.payment_id} className="border-t border-slate-100" data-testid={`pay-row-${i}`}>
                  <td className="p-3 font-mono text-xs text-emerald-800">{p.trx_no}</td>
                  <td className="p-3"><div className="font-medium">{p.santri_nama}</div><div className="text-xs text-slate-500">{p.santri_nomor_induk}</div></td>
                  <td className="p-3">{p.jenis}</td>
                  <td className="p-3">{p.periode}</td>
                  <td className="p-3 text-right font-semibold text-emerald-800">{fmtIDR(p.nominal)}</td>
                  <td className="p-3"><Badge variant="outline">{p.metode?.toUpperCase()}</Badge></td>
                  <td className="p-3">{fmtDate(p.tanggal)}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => window.open(`${API}/pembayaran/${p.payment_id}/kwitansi`, "_blank")} data-testid={`kwitansi-${i}`}>
                      <Printer size={14} className="mr-1" />Kwitansi
                    </Button>
                    {user?.role === "super_admin" && (
                      <Button size="icon" variant="ghost" onClick={() => remove(p)} className="ml-1 text-rose-600" data-testid={`del-pay-${i}`}><Trash2 size={14} /></Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <PaymentForm open={open} setOpen={setOpen} ptypes={ptypes} onSaved={load} />
    </div>
  );
}

function PaymentForm({ open, setOpen, ptypes, onSaved }) {
  const [form, setForm] = useState({ metode: "cash" });
  const [santriQ, setSantriQ] = useState("");
  const [santriOpts, setSantriOpts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [invOpts, setInvOpts] = useState([]);

  useEffect(() => {
    if (!open) { setForm({ metode: "cash" }); setSelected(null); setSantriQ(""); setInvOpts([]); }
  }, [open]);

  useEffect(() => {
    if (santriQ.length < 2) { setSantriOpts([]); return; }
    const t = setTimeout(async () => {
      const { data } = await api.get(`/search?q=${encodeURIComponent(santriQ)}`);
      setSantriOpts(data.santri || []);
    }, 250);
    return () => clearTimeout(t);
  }, [santriQ]);

  const pickSantri = async (s) => {
    setSelected(s); setSantriOpts([]);
    setForm((f) => ({ ...f, santri_id: s.santri_id }));
    const { data } = await api.get(`/tagihan?santri_id=${s.santri_id}`);
    setInvOpts(data.filter((i) => i.status !== "lunas"));
  };

  const pickInv = (invId) => {
    const inv = invOpts.find((i) => i.invoice_id === invId);
    if (!inv) return;
    setForm((f) => ({ ...f, invoice_id: inv.invoice_id, jenis: inv.jenis, periode: inv.periode, nominal: inv.nominal - (inv.terbayar || 0) }));
  };

  const save = async () => {
    if (!form.santri_id || !form.jenis || !form.nominal) return toast.error("Pilih santri, jenis, dan nominal");
    try {
      await api.post("/pembayaran", { ...form, nominal: Number(form.nominal) });
      toast.success("Pembayaran tercatat"); setOpen(false); onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Catat Pembayaran</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Cari Santri *</Label>
            <Input placeholder="Ketik nama atau nomor induk…" value={selected ? `${selected.nama} — ${selected.nomor_induk}` : santriQ}
              onChange={(e) => { setSelected(null); setSantriQ(e.target.value); }} data-testid="pay-santri-search" />
            {santriOpts.length > 0 && (
              <div className="border border-slate-200 rounded-lg mt-1 max-h-40 overflow-y-auto">
                {santriOpts.map((s) => (
                  <button key={s.santri_id} className="w-full text-left p-2 hover:bg-emerald-50 text-sm" onClick={() => pickSantri(s)} data-testid={`pay-santri-opt-${s.santri_id}`}>
                    <span className="font-medium">{s.nama}</span> <span className="text-xs text-slate-500">— {s.nomor_induk} • {s.kelas}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {invOpts.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">Kaitkan dengan Tagihan (opsional)</Label>
              <Select onValueChange={pickInv}>
                <SelectTrigger data-testid="pay-invoice-select"><SelectValue placeholder="Pilih tagihan belum lunas…" /></SelectTrigger>
                <SelectContent>
                  {invOpts.map((i) => <SelectItem key={i.invoice_id} value={i.invoice_id}>{i.jenis} — {i.periode} — {fmtIDR(i.nominal - (i.terbayar || 0))}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Jenis *</Label>
              <Select value={form.jenis || ""} onValueChange={(v) => setForm({ ...form, jenis: v })}>
                <SelectTrigger data-testid="pay-jenis"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>{ptypes.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Periode</Label>
              <Input value={form.periode || ""} onChange={(e) => setForm({ ...form, periode: e.target.value })} placeholder="Contoh: September 2026" data-testid="pay-periode" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nominal *</Label>
              <Input type="number" value={form.nominal || ""} onChange={(e) => setForm({ ...form, nominal: e.target.value })} data-testid="pay-nominal" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Metode</Label>
              <Select value={form.metode} onValueChange={(v) => setForm({ ...form, metode: v })}>
                <SelectTrigger data-testid="pay-metode"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="transfer">Transfer</SelectItem><SelectItem value="qris">QRIS</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Keterangan</Label>
            <Input value={form.keterangan || ""} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} data-testid="pay-keterangan" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={save} className="bg-emerald-700 hover:bg-emerald-800" data-testid="pay-save-btn">Simpan & Cetak Kwitansi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
