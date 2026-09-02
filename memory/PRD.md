# PRD — AS SHIDIQ SANTRI MANAGEMENT

## Original Problem Statement
Aplikasi web untuk Manajemen Data & Administrasi Santri Pondok Pesantren As Shidiq. Mendata seluruh santri, sensus santri, mencatat pembayaran administrasi, dan membantu admin mengelola data santri secara terpusat. Login admin (Super Admin + Admin), Dashboard statistik & grafik, Data Santri (CRUD, sensus, foto, data lengkap), Detail Santri bertab, Pembayaran (SPP/Uang Makan/Gedung/dsb, Cash/Transfer/QRIS, Lunas/Belum Lunas/Cicilan), Tagihan massal, Kwitansi PDF, Laporan Keuangan, Master Data, Manajemen Admin, Riwayat Aktivitas, Pencarian global, Import/Export Excel & PDF. MVP harus benar-benar berfungsi, data tersimpan permanen di database.

## User Personas
- **Super Admin** (owner: akayfikanita@gmail.com) — akses penuh, kelola admin, hapus data, master data, aktivitas.
- **Admin** — kelola data santri, catat pembayaran; tidak bisa hapus akun super admin / akses manajemen admin.

## Tech Stack / Architecture
- Frontend: React 19 (CRA + craco), Tailwind, shadcn/ui, recharts, axios. Entry `/app/frontend/src/`.
- Backend: FastAPI (server.py), routes under `/api`. Session-cookie + Bearer auth via Emergent Google OAuth.
- Database: MongoDB (`test_database`) via Motor. Collections: users, user_sessions, santri, invoices, payments, activity_logs, m_programs, m_kelas, m_jurusan, m_tahun_ajaran, m_payment_types, m_asramas, m_kamars.
- PDF: reportlab. Excel: openpyxl.

## Core Requirements (static)
1. Google OAuth login, role-based auth, session persist + logout.
2. Dashboard: 8 stat cards + 3 charts.
3. Data Santri CRUD + filter + search + foto + detail 7 tab.
4. Pembayaran + auto trx_no + kwitansi PDF.
5. Tagihan massal (semua/kelas/program/individu), auto-lunas on payment.
6. Laporan keuangan + filter tanggal + export.
7. Master Data (program/kelas/jurusan/tahun ajaran/jenis pembayaran/asrama/kamar) — not hardcoded.
8. Manajemen Admin (super_admin only).
9. Riwayat Aktivitas (audit log).
10. Global search (nama/NIS/NIK/WA).
11. Import Excel + template; Export Excel.
12. Data demo seeded.

## Implemented (2026-09-01)
- Logo resmi Ponpes As Shidiq terpasang di: sidebar, halaman login, kwitansi PDF, favicon (file: /app/frontend/public/assets/logo.png, /app/backend/assets/logo.png, /app/frontend/public/favicon.png).
- Emergent-managed Google OAuth (AuthCallback + session cookie, 7-day). Owner email auto super_admin; first user fallback.
- Backend: all `/api` routes — auth, admins (super_admin-gated), master data CRUD, santri CRUD + detail, tagihan batch create (all/kelas/program/santri) + auto-lunas on payment, pembayaran + kwitansi PDF (reportlab), dashboard stats/charts, laporan, global search, aktivitas log, export xlsx + template, import xlsx (dedupe by nomor_induk).
- Seed/bootstrap: 24 santri (12 putra/12 putri), invoices + payments, master data (5 programs, 9 kelas, 3 jurusan, 3 tahun ajaran, 8 jenis pembayaran, 4 asrama, 8 kamar), owner super_admin + test admin.
- Frontend: Login, Layout (emerald sidebar + gold accent + Islamic motif), Dashboard (8 cards + 3 charts), Santri (table+filter+CRUD modal+import/export), SantriDetail (7 tabs), Pembayaran (with invoice-link picker), Tagihan (massal), Laporan (charts+filters), MasterData (7 tabs), ManajemenAdmin, Aktivitas, Pengaturan, Global search (Cmd+K).
- Testing: 28/28 backend pytest PASSED; all frontend routes verified with session cookie. RBAC gates verified (admin 403 on super_admin routes). Kwitansi PDF & xlsx exports return 200.

## Deployment — GitHub Pages (2026-09-01)
- Workflow: `.github/workflows/deploy-pages.yml` — build `frontend/` (craco/CRA → output `build/`, bukan dist), PUBLIC_URL=/web-santri-as-shidiq, SPA fallback 404.html, deploy via actions/deploy-pages.
- Router/Auth subpath support: `BrowserRouter basename={process.env.PUBLIC_URL}` (App.js), redirect OAuth + replaceState pakai PUBLIC_URL (Login.jsx, AuthCallback.jsx). Preview Emergent tetap di root (PUBLIC_URL kosong).
- Syarat user: repo Settings → Pages → Source = GitHub Actions; tambahkan Actions Variable `REACT_APP_BACKEND_URL=https://shidiq-admin-panel.preview.emergentagent.com`; push branch main.
- Verifikasi lokal: build sukses (37s), semua asset di-serve benar di bawah /web-santri-as-shidiq/ (index, js, css, favicon, 404.html → 200). Backend tetap di Emergent (API dipanggil lintas origin, CORS sudah `*`).
- Fix (2026-09-01): CI gagal karena `frontend/yarn.lock` untracked → di-commit (`git ls-files` verified). Testing agent iteration_2: semua 9 checks PASS (git tracking, workflow YAML, frozen-lockfile install, CI-parity build, asset prefix, preview regression).
- Fix login GitHub Pages (2026-09-02): CORS `*` + credentials ditolak browser & cookie jadi third-party dari github.io. Solusi: backend CORS explicit origins + `allow_origin_regex` github.io; frontend Bearer token via localStorage (interceptor di lib/api.js, withCredentials:false; AuthCallback menyimpan token; logout menerima Bearer). Testing agent iteration_3: 11/11 PASS (cross-origin Bearer flow, CORS preflight echo, origin rejection, logout Bearer, regresi preview). Trade-off tercatat: token di localStorage (XSS-exfiltrable) — diterima untuk deployment GH Pages.

## Backlog / Next Tasks
- **P1**: Upload foto santri (object storage); per-filter export (CSV/PDF) on Santri page; Dokumen tab upload; idempotency guard on seed bootstrap.
- **P1**: Reset-password / admin credential flows if non-OAuth admins added later.
- **P2**: Absensi santri, kartu santri digital, RFID, pembayaran online (Midtrans/Xendit), WhatsApp notifikasi tagihan, rapor, ujian online, perizinan santri, data alumni, inventaris, PPDB online.
- **P2**: Migrate FastAPI on_event → lifespan; Pydantic strict allow-list on PATCH endpoints; dark-mode toggle UI.

## Test Credentials
See `/app/memory/test_credentials.md`. Auth = Google OAuth (no password). Owner super_admin: akayfikanita@gmail.com. Test admin: admin.test@as-shidiq.sch.id. Playbook for seeded sessions: `/app/auth_testing.md`.
