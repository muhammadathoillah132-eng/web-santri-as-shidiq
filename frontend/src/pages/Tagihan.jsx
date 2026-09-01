import React, { useEffect, useState } from "react";
import { api, fmtIDR, fmtDate } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users2 } from "lucide-react";
import { toast } from "sonner";

export default function Tagihan() {
  const [list, setList] = useState([]);
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [ptypes, setPtypes] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [programs, setPrograms] = useState([]);

  const load = async () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    const { data } = await api.get(`/tagihan?${params}`); setList(data);
  };
  useEffect(() => { load(); }, [status]);
  useEffect(() => {
    (async () => {
      const [pt, k, p] = await Promise.all([api.get("/master/payment_types"), api.get("/master/kelas"), api.get("/master/programs")]);
      setPtypes(pt.data); setKelas(k.data); setPrograms(p.data);
    })();
  }, []);

  return (
    <div className="space-y-4" data-testid="page-tagihan">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Tagihan</div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-950 font-display">Manajemen Tagihan Santri</h1>
          <p className="text-slate-500 text-sm mt-1">Buat tagihan massal per kelas, program, atau santri tertentu.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-emerald-700 hover:bg-emerald-800" data-testid="add-tagihan-btn">
          <Plus size={16} className="mr-2" />Buat Tagihan Massal
        </Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex gap-3 items-center">
          <Label className="text-xs">Filter Status:</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-56" data-testid="tagihan-filter-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="belum_lunas">Belum Lunas</SelectItem>
              <SelectItem value="cicilan">Cicilan</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-900">
            <tr><th className="text-left p-3">Santri</th><th className="text-left p-3">Jenis</th><th className="text-left p-3">Periode</th><th className="text-right p-3">Nominal</th><th className="text-right p-3">Terbayar</th><th className="text-left p-3">Status</th></tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-400">Belum ada tagihan</td></tr>}
            {list.map((i, idx) => (
              <tr key={i.invoice_id} className="border-t border-slate-100" data-testid={`tagihan-row-${idx}`}>
                <td className="p-3"><div className="font-medium">{i.santri_nama}</div><div className="text-xs text-slate-500 font-mono">{i.santri_nomor_induk}</div></td>
                <td className="p-3">{i.jenis}</td><td className="p-3">{i.periode}</td>
                <td className="p-3 text-right">{fmtIDR(i.nominal)}</td>
                <td className="p-3 text-right text-emerald-700">{fmtIDR(i.terbayar || 0)}</td>
                <td className="p-3"><Badge className={i.status === "lunas" ? "bg-emerald-100 text-emerald-800" : i.status === "cicilan" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}>{i.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <TagihanForm open={open} setOpen={setOpen} ptypes={ptypes} kelas={kelas} programs={programs} onSaved={load} />
    </div>
  );
}

function TagihanForm({ open, setOpen, ptypes, kelas, programs, onSaved }) {
  const [form, setForm] = useState({ target_type: "all", target_ids: [] });
  useEffect(() => { if (!open) setForm({ target_type: "all", target_ids: [] }); }, [open]);

  const setPT = (name) => {
    const pt = ptypes.find((p) => p.name === name);
    setForm((f) => ({ ...f, jenis: name, nominal: pt?.nominal || f.nominal }));
  };

  const save = async () => {
    if (!form.jenis || !form.periode || !form.nominal) return toast.error("Lengkapi jenis, periode, dan nominal");
    try {
      const { data } = await api.post("/tagihan", { ...form, nominal: Number(form.nominal) });
      toast.success(`${data.created} tagihan dibuat`);
      setOpen(false); onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };

  const toggleId = (v) => {
    setForm((f) => {
      const ids = f.target_ids.includes(v) ? f.target_ids.filter((x) => x !== v) : [...f.target_ids, v];
      return { ...f, target_ids: ids };
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Buat Tagihan Massal</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Jenis Pembayaran *</Label>
              <Select value={form.jenis || ""} onValueChange={setPT}>
                <SelectTrigger data-testid="tagihan-jenis"><SelectValue placeholder="Pilih…" /></SelectTrigger>
                <SelectContent>{ptypes.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Periode *</Label>
              <Input value={form.periode || ""} onChange={(e) => setForm({ ...form, periode: e.target.value })} placeholder="Contoh: September 2026" data-testid="tagihan-periode" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Nominal *</Label>
              <Input type="number" value={form.nominal || ""} onChange={(e) => setForm({ ...form, nominal: e.target.value })} data-testid="tagihan-nominal" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Target</Label>
            <Select value={form.target_type} onValueChange={(v) => setForm({ ...form, target_type: v, target_ids: [] })}>
              <SelectTrigger data-testid="tagihan-target"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Santri Aktif</SelectItem>
                <SelectItem value="kelas">Berdasarkan Kelas</SelectItem>
                <SelectItem value="program">Berdasarkan Program</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.target_type === "kelas" && (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded">
              {kelas.map((k) => (
                <Badge key={k.id} onClick={() => toggleId(k.name)}
                  className={`cursor-pointer ${form.target_ids.includes(k.name) ? "bg-emerald-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}>{k.name}</Badge>
              ))}
            </div>
          )}
          {form.target_type === "program" && (
            <div className="flex flex-wrap gap-2 p-2 border rounded">
              {programs.map((p) => (
                <Badge key={p.id} onClick={() => toggleId(p.name)}
                  className={`cursor-pointer ${form.target_ids.includes(p.name) ? "bg-emerald-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}>{p.name}</Badge>
              ))}
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Keterangan</Label>
            <Input value={form.keterangan || ""} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} data-testid="tagihan-keterangan" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={save} className="bg-emerald-700 hover:bg-emerald-800" data-testid="tagihan-submit-btn"><Users2 size={16} className="mr-2" />Buat Tagihan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
