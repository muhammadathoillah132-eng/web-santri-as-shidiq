import React, { useEffect, useState } from "react";
import { api, fmtIDR } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TYPES = [
  { k: "programs", l: "Program", fields: ["name"] },
  { k: "kelas", l: "Kelas", fields: ["name"] },
  { k: "jurusan", l: "Jurusan", fields: ["name"] },
  { k: "tahun_ajaran", l: "Tahun Ajaran", fields: ["name"] },
  { k: "payment_types", l: "Jenis Pembayaran", fields: ["name", "nominal"] },
  { k: "asramas", l: "Asrama", fields: ["name", "gender"] },
  { k: "kamars", l: "Kamar", fields: ["name"] },
];

export default function MasterData() {
  const [tab, setTab] = useState("programs");
  return (
    <div className="space-y-4" data-testid="page-master">
      <div>
        <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Master Data</div>
        <h1 className="text-2xl md:text-3xl font-bold text-emerald-950 font-display">Kelola Data Referensi</h1>
      </div>
      <Card><CardContent className="p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto">
            {TYPES.map((t) => <TabsTrigger key={t.k} value={t.k} data-testid={`master-tab-${t.k}`}>{t.l}</TabsTrigger>)}
          </TabsList>
          {TYPES.map((t) => (
            <TabsContent key={t.k} value={t.k} className="mt-4">
              <MasterTable type={t} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent></Card>
    </div>
  );
}

function MasterTable({ type }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const load = async () => setList((await api.get(`/master/${type.k}`)).data);
  useEffect(() => { load(); }, [type.k]);

  const save = async () => {
    if (!form.name) return toast.error("Nama wajib");
    try {
      const payload = { ...form };
      if (payload.nominal) payload.nominal = Number(payload.nominal);
      await api.post(`/master/${type.k}`, payload);
      toast.success("Tersimpan"); setOpen(false); setForm({}); load();
    } catch (e) { toast.error("Gagal"); }
  };
  const del = async (id) => {
    if (!window.confirm("Hapus?")) return;
    try { await api.delete(`/master/${type.k}/${id}`); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setOpen(true)} className="bg-emerald-700 hover:bg-emerald-800" data-testid={`master-add-${type.k}`}>
          <Plus size={16} className="mr-2" />Tambah {type.l}
        </Button>
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        {list.map((it) => (
          <div key={it.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
            <div>
              <div className="font-medium text-emerald-950">{it.name}</div>
              {it.nominal !== undefined && <div className="text-xs text-amber-700 font-mono">{fmtIDR(it.nominal)}</div>}
              {it.gender && <div className="text-xs text-slate-500">{it.gender === "L" ? "Putra" : "Putri"}</div>}
            </div>
            <Button size="icon" variant="ghost" onClick={() => del(it.id)} className="text-rose-600"><Trash2 size={14} /></Button>
          </div>
        ))}
        {list.length === 0 && <div className="col-span-3 p-6 text-center text-slate-400 text-sm">Belum ada data</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah {type.l}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Nama</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="master-name-input" /></div>
            {type.fields.includes("nominal") && (
              <div className="space-y-1"><Label className="text-xs">Nominal</Label><Input type="number" value={form.nominal || ""} onChange={(e) => setForm({ ...form, nominal: e.target.value })} data-testid="master-nominal-input" /></div>
            )}
            {type.fields.includes("gender") && (
              <div className="space-y-1"><Label className="text-xs">Gender</Label>
                <select className="w-full border border-slate-200 rounded-md p-2 text-sm" value={form.gender || "L"} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="L">Putra</option><option value="P">Putri</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={save} className="bg-emerald-700 hover:bg-emerald-800" data-testid="master-save-btn">Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
