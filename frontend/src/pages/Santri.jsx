import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, fmtDate } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Download, Upload, Trash2, Edit3, Eye, FileSpreadsheet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { API } from "@/lib/api";

export default function Santri() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ gender: "all", status: "all", program: "all", kelas: "all" });
  const [master, setMaster] = useState({ programs: [], kelas: [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== "all") params.set(k, v); });
    const { data } = await api.get(`/santri?${params}`);
    setList(data);
  };
  useEffect(() => { load(); }, [filters]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    (async () => {
      const [p, k] = await Promise.all([api.get("/master/programs"), api.get("/master/kelas")]);
      setMaster({ programs: p.data, kelas: k.data });
    })();
  }, []);

  const remove = async (s) => {
    if (!window.confirm(`Hapus santri "${s.nama}"?`)) return;
    try { await api.delete(`/santri/${s.santri_id}`); toast.success("Santri dihapus"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal menghapus"); }
  };

  const doExport = () => { window.open(`${API}/santri/export/xlsx`, "_blank"); };
  const dlTemplate = () => { window.open(`${API}/santri/template/xlsx`, "_blank"); };

  const doImport = async () => {
    if (!importFile) return toast.error("Pilih file terlebih dahulu");
    const fd = new FormData(); fd.append("file", importFile);
    try {
      const { data } = await api.post("/santri/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Import selesai: ${data.imported} data, ${data.skipped} dilewati`);
      setImportOpen(false); setImportFile(null); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Import gagal"); }
  };

  return (
    <div className="space-y-4" data-testid="page-santri">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Data Santri</div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-950 font-display">Sensus Santri</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola seluruh data santri pondok pesantren.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={dlTemplate} data-testid="download-template-btn"><FileSpreadsheet size={16} className="mr-2" />Template</Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} data-testid="import-btn"><Upload size={16} className="mr-2" />Import Excel</Button>
          <Button variant="outline" onClick={doExport} data-testid="export-btn"><Download size={16} className="mr-2" />Export</Button>
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-emerald-700 hover:bg-emerald-800" data-testid="add-santri-button">
            <Plus size={16} className="mr-2" />Tambah Santri
          </Button>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input data-testid="santri-search" placeholder="Cari nama, nomor induk, NIK…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
            <FilterSelect tid="filter-gender" value={filters.gender} onChange={(v) => setFilters({ ...filters, gender: v })} placeholder="Semua Gender"
              options={[{ v: "L", l: "Putra" }, { v: "P", l: "Putri" }]} />
            <FilterSelect tid="filter-status" value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} placeholder="Semua Status"
              options={[{ v: "aktif", l: "Aktif" }, { v: "nonaktif", l: "Nonaktif" }]} />
            <FilterSelect tid="filter-program" value={filters.program} onChange={(v) => setFilters({ ...filters, program: v })} placeholder="Semua Program"
              options={master.programs.map((p) => ({ v: p.name, l: p.name }))} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-emerald-50 text-emerald-900">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Nomor Induk</th>
                <th className="text-left px-4 py-3 font-semibold">Nama</th>
                <th className="text-left px-4 py-3 font-semibold">Gender</th>
                <th className="text-left px-4 py-3 font-semibold">Program</th>
                <th className="text-left px-4 py-3 font-semibold">Kelas</th>
                <th className="text-left px-4 py-3 font-semibold">Asrama</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-slate-400">Belum ada data santri</td></tr>
              )}
              {list.map((s, idx) => (
                <tr key={s.santri_id} className="border-t border-slate-100 hover:bg-emerald-50/30" data-testid={`santri-row-${idx}`}>
                  <td className="px-4 py-3 font-mono text-xs text-emerald-800">{s.nomor_induk}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{s.nama}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{s.gender === "L" ? "Putra" : "Putri"}</Badge></td>
                  <td className="px-4 py-3 text-slate-600">{s.program}</td>
                  <td className="px-4 py-3 text-slate-600">{s.kelas}</td>
                  <td className="px-4 py-3 text-slate-600">{s.asrama || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge className={s.status === "aktif" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-slate-200 text-slate-700 hover:bg-slate-200"}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/santri/${s.santri_id}`)} data-testid={`view-santri-${idx}`}><Eye size={16} /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }} data-testid={`edit-santri-${idx}`}><Edit3 size={16} /></Button>
                      {user?.role === "super_admin" && (
                        <Button size="icon" variant="ghost" onClick={() => remove(s)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" data-testid={`delete-santri-${idx}`}><Trash2 size={16} /></Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <SantriForm open={open} setOpen={setOpen} initial={editing} master={master} onSaved={load} />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import Data Santri dari Excel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Unduh template terlebih dahulu untuk format yang benar. Duplikat berdasarkan Nomor Induk akan dilewati.</p>
            <Input type="file" accept=".xlsx" onChange={(e) => setImportFile(e.target.files?.[0])} data-testid="import-file-input" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Batal</Button>
            <Button onClick={doImport} className="bg-emerald-700 hover:bg-emerald-800" data-testid="import-submit">Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterSelect({ value, onChange, placeholder, options, tid }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={tid}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function SantriForm({ open, setOpen, initial, master, onSaved }) {
  const [form, setForm] = useState({});
  useEffect(() => { setForm(initial || { gender: "L", status: "aktif", status_mukim: "Mukim" }); }, [initial, open]);
  const setF = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const save = async () => {
    try {
      if (!form.nama || !form.nomor_induk) return toast.error("Nama dan Nomor Induk wajib diisi");
      if (initial) await api.patch(`/santri/${initial.santri_id}`, form);
      else await api.post("/santri", form);
      toast.success("Data santri tersimpan"); setOpen(false); onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal menyimpan"); }
  };
  const F = ({ k, l, type = "text", ...rest }) => (
    <div className="space-y-1">
      <Label className="text-xs">{l}</Label>
      <Input type={type} value={form[k] || ""} onChange={(e) => setF(k, e.target.value)} data-testid={`santri-input-${k}`} {...rest} />
    </div>
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit Santri" : "Tambah Santri"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <SectionTitle>Data Pribadi</SectionTitle>
          <div className="grid md:grid-cols-3 gap-3">
            <F k="nomor_induk" l="Nomor Induk *" />
            <F k="nik" l="NIK" />
            <F k="nisn" l="NISN" />
            <F k="nama" l="Nama Lengkap *" />
            <F k="nama_panggilan" l="Nama Panggilan" />
            <div className="space-y-1">
              <Label className="text-xs">Jenis Kelamin</Label>
              <Select value={form.gender || "L"} onValueChange={(v) => setF("gender", v)}>
                <SelectTrigger data-testid="santri-input-gender"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent>
              </Select>
            </div>
            <F k="tempat_lahir" l="Tempat Lahir" />
            <F k="tanggal_lahir" l="Tanggal Lahir" type="date" />
            <F k="whatsapp" l="WhatsApp" />
            <F k="email" l="Email" />
            <F k="alamat" l="Alamat" />
            <F k="desa" l="Desa/Kelurahan" />
            <F k="kecamatan" l="Kecamatan" />
            <F k="kabupaten" l="Kabupaten" />
            <F k="provinsi" l="Provinsi" />
          </div>

          <SectionTitle>Pendidikan</SectionTitle>
          <div className="grid md:grid-cols-3 gap-3">
            <SelectField label="Program" value={form.program} onChange={(v) => setF("program", v)} options={master.programs.map((p) => p.name)} tid="santri-input-program" />
            <SelectField label="Kelas" value={form.kelas} onChange={(v) => setF("kelas", v)} options={master.kelas.map((p) => p.name)} tid="santri-input-kelas" />
            <F k="jurusan" l="Jurusan" />
            <F k="tahun_masuk" l="Tahun Masuk" />
            <F k="asal_sekolah" l="Asal Sekolah" />
            <SelectField label="Status" value={form.status} onChange={(v) => setF("status", v)} options={["aktif", "nonaktif"]} tid="santri-input-status" />
          </div>

          <SectionTitle>Orang Tua / Wali</SectionTitle>
          <div className="grid md:grid-cols-3 gap-3">
            <F k="nama_ayah" l="Nama Ayah" />
            <F k="pekerjaan_ayah" l="Pekerjaan Ayah" />
            <F k="wa_ayah" l="WA Ayah" />
            <F k="nama_ibu" l="Nama Ibu" />
            <F k="pekerjaan_ibu" l="Pekerjaan Ibu" />
            <F k="wa_ibu" l="WA Ibu" />
            <F k="nama_wali" l="Nama Wali" />
            <F k="hubungan_wali" l="Hubungan" />
            <F k="wa_wali" l="WA Wali" />
          </div>

          <SectionTitle>Data Pondok</SectionTitle>
          <div className="grid md:grid-cols-3 gap-3">
            <F k="asrama" l="Asrama" />
            <F k="nomor_kamar" l="Nomor Kamar" />
            <SelectField label="Status Mukim" value={form.status_mukim} onChange={(v) => setF("status_mukim", v)} options={["Mukim", "Non Mukim"]} tid="santri-input-mukim" />
            <F k="tanggal_masuk_pondok" l="Tanggal Masuk Pondok" type="date" />
            <F k="asal_daerah" l="Asal Daerah" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={save} className="bg-emerald-700 hover:bg-emerald-800" data-testid="santri-save-btn">Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ children }) {
  return <div className="text-xs uppercase tracking-widest text-amber-600 font-bold pt-2 border-b border-amber-100 pb-1">{children}</div>;
}
function SelectField({ label, value, onChange, options, tid }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger data-testid={tid}><SelectValue placeholder="Pilih..." /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
