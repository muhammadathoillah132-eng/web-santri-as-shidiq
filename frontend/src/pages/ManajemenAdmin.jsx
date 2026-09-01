import React, { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function ManajemenAdmin() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ role: "admin", status: "active" });

  const load = async () => setList((await api.get("/admins")).data);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ role: "admin", status: "active" }); setOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ name: a.name, email: a.email, whatsapp: a.whatsapp, role: a.role, status: a.status }); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.email) return toast.error("Nama & email wajib");
    try {
      if (editing) await api.patch(`/admins/${editing.user_id}`, form);
      else await api.post("/admins", form);
      toast.success("Tersimpan"); setOpen(false); load();
    } catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };

  const del = async (a) => {
    if (!window.confirm(`Hapus ${a.email}?`)) return;
    try { await api.delete(`/admins/${a.user_id}`); toast.success("Terhapus"); load(); }
    catch (e) { toast.error(e?.response?.data?.detail || "Gagal"); }
  };

  return (
    <div className="space-y-4" data-testid="page-admin">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Manajemen Admin</div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-950 font-display">Kelola Akses Pengguna</h1>
        </div>
        <Button onClick={openAdd} className="bg-emerald-700 hover:bg-emerald-800" data-testid="admin-add-btn"><Plus size={16} className="mr-2" />Tambah Admin</Button>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-900"><tr><th className="text-left p-3">Nama</th><th className="text-left p-3">Email</th><th className="text-left p-3">WhatsApp</th><th className="text-left p-3">Role</th><th className="text-left p-3">Status</th><th className="text-left p-3">Last Login</th><th className="text-right p-3">Aksi</th></tr></thead>
          <tbody>
            {list.map((a, i) => (
              <tr key={a.user_id} className="border-t border-slate-100" data-testid={`admin-row-${i}`}>
                <td className="p-3 font-medium">{a.name}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3">{a.whatsapp || "-"}</td>
                <td className="p-3"><Badge className={a.role === "super_admin" ? "bg-amber-500 text-emerald-950 hover:bg-amber-500" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"}>{a.role === "super_admin" && <ShieldCheck size={12} className="mr-1" />}{a.role}</Badge></td>
                <td className="p-3"><Badge className={a.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}>{a.status}</Badge></td>
                <td className="p-3 text-xs">{a.last_login ? fmtDate(a.last_login) : "-"}</td>
                <td className="p-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(a)} data-testid={`admin-edit-${i}`}><Edit3 size={14} /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(a)} className="text-rose-600" data-testid={`admin-del-${i}`}><Trash2 size={14} /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Admin" : "Tambah Admin"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Nama</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="admin-name" /></div>
            <div className="space-y-1"><Label className="text-xs">Email (harus akun Google)</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editing} data-testid="admin-email" /></div>
            <div className="space-y-1"><Label className="text-xs">WhatsApp</Label><Input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} data-testid="admin-wa" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger data-testid="admin-role"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="super_admin">Super Admin</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger data-testid="admin-status"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Nonaktif</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={save} className="bg-emerald-700 hover:bg-emerald-800" data-testid="admin-save">Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
