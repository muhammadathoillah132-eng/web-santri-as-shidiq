"""Seed / bootstrap data for AS SHIDIQ SANTRI MANAGEMENT."""
import uuid, random, os
import bcrypt
from datetime import datetime, timezone, timedelta


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def iso(dt): 
    if dt.tzinfo is None: dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()
def now(): return datetime.now(timezone.utc)
def nid(p): return f"{p}_{uuid.uuid4().hex[:12]}"


PROGRAMS = ["SMPI", "SMK", "Madin", "Tahfidz", "Kitab Kuning"]
KELAS = ["7A", "7B", "8A", "8B", "9A", "9B", "10 TKJ", "11 TKJ", "12 TKJ"]
JURUSAN = ["Umum", "TKJ", "MM"]
TAHUN_AJARAN = ["2024/2025", "2025/2026", "2026/2027"]
PAYMENT_TYPES = [
    {"name": "SPP", "nominal": 150000},
    {"name": "Uang Makan", "nominal": 300000},
    {"name": "Uang Gedung", "nominal": 2000000},
    {"name": "Seragam", "nominal": 450000},
    {"name": "Buku", "nominal": 350000},
    {"name": "Kegiatan", "nominal": 100000},
    {"name": "Daftar Ulang", "nominal": 500000},
    {"name": "Ujian", "nominal": 200000},
]
ASRAMAS = [
    {"name": "Al-Falah", "gender": "L"},
    {"name": "Al-Hikmah", "gender": "L"},
    {"name": "An-Nur", "gender": "P"},
    {"name": "Ar-Rahmah", "gender": "P"},
]
KAMARS = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2"]

NAMA_PUTRA = ["Ahmad Faruq", "Muhammad Rifqi", "Abdullah Zaki", "Umar Hakim", "Yusuf Hidayat",
               "Ibrahim Fauzan", "Ali Mubarok", "Hasan Nur", "Husain Malik", "Zaid Alfath",
               "Rizki Ramadhan", "Fadhil Akbar"]
NAMA_PUTRI = ["Aisyah Nur", "Fatimah Zahra", "Khadijah Salma", "Maryam Aulia", "Zainab Hafsa",
               "Halima Nabila", "Ruqayyah Aini", "Ummu Kulsum", "Safiyya Rahma", "Nailah Aqila",
               "Hana Kamila", "Alifa Zahira"]
KOTA = ["Bandung", "Bogor", "Bekasi", "Depok", "Sukabumi", "Cianjur", "Garut", "Tasikmalaya"]
PROV = "Jawa Barat"


async def bootstrap(db, owner_email):
    """Ensure master data + demo data exist."""
    if await db.m_programs.count_documents({}) == 0:
        for p in PROGRAMS:
            await db.m_programs.insert_one({"id": nid("m"), "name": p, "created_at": iso(now())})
    if await db.m_kelas.count_documents({}) == 0:
        for k in KELAS:
            await db.m_kelas.insert_one({"id": nid("m"), "name": k, "created_at": iso(now())})
    if await db.m_jurusan.count_documents({}) == 0:
        for j in JURUSAN:
            await db.m_jurusan.insert_one({"id": nid("m"), "name": j, "created_at": iso(now())})
    if await db.m_tahun_ajaran.count_documents({}) == 0:
        for t in TAHUN_AJARAN:
            await db.m_tahun_ajaran.insert_one({"id": nid("m"), "name": t, "created_at": iso(now())})
    if await db.m_payment_types.count_documents({}) == 0:
        for pt in PAYMENT_TYPES:
            await db.m_payment_types.insert_one({"id": nid("m"), **pt, "created_at": iso(now())})
    if await db.m_asramas.count_documents({}) == 0:
        for a in ASRAMAS:
            await db.m_asramas.insert_one({"id": nid("m"), **a, "created_at": iso(now())})
    if await db.m_kamars.count_documents({}) == 0:
        for k in KAMARS:
            await db.m_kamars.insert_one({"id": nid("m"), "name": k, "created_at": iso(now())})

    # Ensure owner exists as super_admin with username/password credentials
    admin_pw = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    owner = await db.users.find_one({"email": owner_email})
    if not owner:
        await db.users.insert_one({
            "user_id": nid("user"), "email": owner_email, "name": "Super Admin",
            "role": "super_admin", "status": "active", "picture": "",
            "whatsapp": "", "username": "superadmin",
            "password_hash": hash_password(admin_pw),
            "created_at": iso(now()), "last_login": None,
        })
    else:
        updates = {}
        if owner.get("username") != "superadmin":
            updates["username"] = "superadmin"
        if not owner.get("password_hash"):
            updates["password_hash"] = hash_password(admin_pw)
        if updates:
            await db.users.update_one({"email": owner_email}, {"$set": updates})
    # Test admin
    tadm = await db.users.find_one({"email": "admin.test@as-shidiq.sch.id"})
    if not tadm:
        await db.users.insert_one({
            "user_id": nid("user"), "email": "admin.test@as-shidiq.sch.id",
            "name": "Admin Uji", "role": "admin", "status": "active", "picture": "",
            "whatsapp": "081234567890", "username": "admintest",
            "password_hash": hash_password("Test@123"),
            "created_at": iso(now()), "last_login": None,
        })
    elif not tadm.get("password_hash"):
        await db.users.update_one({"email": "admin.test@as-shidiq.sch.id"},
                                  {"$set": {"username": "admintest", "password_hash": hash_password("Test@123")}})

    # Demo santri if empty
    if await db.santri.count_documents({}) == 0:
        await run_seed(db)


async def run_seed(db):
    """Insert 20 santri + several invoices + payments."""
    santris = []
    year_base = 2024
    idx = 0
    for i, nm in enumerate(NAMA_PUTRA):
        idx += 1
        santris.append(_santri(idx, nm, "L", year_base))
    for i, nm in enumerate(NAMA_PUTRI):
        idx += 1
        santris.append(_santri(idx, nm, "P", year_base))
    inserted_ids = []
    for s in santris:
        if await db.santri.find_one({"nomor_induk": s["nomor_induk"]}): continue
        await db.santri.insert_one(s)
        inserted_ids.append(s["santri_id"])

    # Invoices SPP Sep 2026
    inv_count = 0
    for sid in inserted_ids:
        s = await db.santri.find_one({"santri_id": sid}, {"_id": 0})
        for jenis, nom in [("SPP", 150000), ("Uang Makan", 300000)]:
            inv = {
                "invoice_id": nid("inv"), "santri_id": sid,
                "santri_nama": s["nama"], "santri_nomor_induk": s["nomor_induk"],
                "jenis": jenis, "periode": "September 2026", "nominal": nom,
                "terbayar": 0, "status": "belum_lunas", "keterangan": "",
                "created_at": iso(now()), "created_by": "system",
            }
            await db.invoices.insert_one(inv)
            inv_count += 1
            # Randomly mark some as paid
            if random.random() > 0.55:
                trx = f"TRX-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
                pay = {
                    "payment_id": nid("pay"), "trx_no": trx, "santri_id": sid,
                    "santri_nama": s["nama"], "santri_nomor_induk": s["nomor_induk"],
                    "invoice_id": inv["invoice_id"], "jenis": jenis,
                    "periode": "September 2026", "periode_bulan": "September 2026",
                    "nominal": nom, "metode": random.choice(["cash", "transfer", "qris"]),
                    "keterangan": "Lunas awal bulan",
                    "tanggal": iso(now() - timedelta(days=random.randint(1, 25))),
                    "status": "lunas", "admin_email": "system",
                    "admin_name": "System Seeder", "created_at": iso(now()),
                }
                await db.payments.insert_one(pay)
                await db.invoices.update_one({"invoice_id": inv["invoice_id"]},
                                              {"$set": {"terbayar": nom, "status": "lunas"}})
    return {"santri": len(inserted_ids), "invoices": inv_count}


def _santri(i, nama, gender, year_base):
    kelas = random.choice(KELAS)
    prog = "SMK" if "TKJ" in kelas or "MM" in kelas else random.choice(["SMPI", "Tahfidz", "Madin"])
    jur = "TKJ" if "TKJ" in kelas else ("MM" if "MM" in kelas else "Umum")
    asrama = random.choice([a for a in ASRAMAS if a["gender"] == gender])["name"]
    tahun_masuk = str(year_base + random.randint(0, 2))
    tgl_lahir = datetime(2008 + random.randint(0, 5), random.randint(1, 12), random.randint(1, 28))
    kota = random.choice(KOTA)
    return {
        "santri_id": nid("s"),
        "nomor_induk": f"24{i:04d}",
        "nik": f"3201{random.randint(10000000000, 99999999999)}",
        "nisn": f"00{random.randint(10000000, 99999999)}",
        "nama": nama,
        "nama_panggilan": nama.split(" ")[0],
        "gender": gender,
        "tempat_lahir": kota,
        "tanggal_lahir": tgl_lahir.strftime("%Y-%m-%d"),
        "alamat": f"Jl. {random.choice(['Merdeka', 'Sudirman', 'Diponegoro', 'Ahmad Yani'])} No. {random.randint(1, 200)}",
        "desa": f"Desa {random.choice(['Sukamaju', 'Mekarsari', 'Cibinong', 'Jatinangor'])}",
        "kecamatan": f"Kec. {random.choice(['Cileunyi', 'Cibiru', 'Ujungberung', 'Antapani'])}",
        "kabupaten": kota,
        "provinsi": PROV,
        "whatsapp": f"08{random.randint(1000000000, 9999999999)}",
        "email": "",
        "foto": "",
        "status": random.choices(["aktif", "nonaktif"], weights=[0.9, 0.1])[0],
        "program": prog,
        "kelas": kelas,
        "jurusan": jur,
        "tahun_masuk": tahun_masuk,
        "status_pendidikan": "aktif",
        "nama_ayah": f"Bapak {random.choice(['Suparman', 'Hasan', 'Bakri', 'Ridwan', 'Iman'])}",
        "nik_ayah": f"3201{random.randint(10000000000, 99999999999)}",
        "pekerjaan_ayah": random.choice(["Petani", "Pedagang", "PNS", "Wiraswasta", "Guru"]),
        "wa_ayah": f"08{random.randint(1000000000, 9999999999)}",
        "nama_ibu": f"Ibu {random.choice(['Siti', 'Aminah', 'Nur', 'Halimah', 'Zubaidah'])}",
        "nik_ibu": f"3201{random.randint(10000000000, 99999999999)}",
        "pekerjaan_ibu": random.choice(["IRT", "Pedagang", "Guru", "Bidan"]),
        "wa_ibu": f"08{random.randint(1000000000, 9999999999)}",
        "nama_wali": "",
        "hubungan_wali": "",
        "wa_wali": "",
        "nomor_kamar": random.choice(KAMARS),
        "asrama": asrama,
        "status_mukim": random.choice(["Mukim", "Non Mukim"]),
        "tanggal_masuk_pondok": tgl_lahir.replace(year=int(tahun_masuk)).strftime("%Y-%m-%d"),
        "asal_sekolah": random.choice(["SDN 01 Sukamaju", "MI Al-Ikhlas", "SDIT Al-Falah"]),
        "asal_daerah": kota,
        "created_at": iso(now() - timedelta(days=random.randint(1, 400))),
        "updated_at": iso(now()),
    }
