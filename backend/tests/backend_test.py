"""Backend API tests for AS SHIDIQ SANTRI MANAGEMENT."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://shidiq-admin-panel.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

OWNER_TOKEN = "test_session_1788299858110"
ADMIN_TOKEN = "test_session_admin_001"


@pytest.fixture(scope="module")
def owner():
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {OWNER_TOKEN}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {ADMIN_TOKEN}", "Content-Type": "application/json"})
    return s


# -------- Auth --------
class TestAuth:
    def test_unauth_returns_401(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_auth_me_owner(self, owner):
        r = owner.get(f"{API}/auth/me")
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == "akayfikanita@gmail.com"
        assert d["role"] == "super_admin"

    def test_auth_me_admin(self, admin):
        r = admin.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# -------- Dashboard --------
class TestDashboard:
    def test_stats(self, owner):
        r = owner.get(f"{API}/dashboard/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ["total_santri", "santri_putra", "santri_putri", "santri_aktif",
                  "santri_nonaktif", "pembayaran_bulan_ini", "tagihan_belum_lunas", "santri_baru"]:
            assert k in d, f"missing {k}"
        assert d["total_santri"] >= 24

    def test_charts(self, owner):
        r = owner.get(f"{API}/dashboard/charts")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d["by_program"], list)
        assert isinstance(d["by_gender"], list)
        assert isinstance(d["payments_monthly"], list)
        assert len(d["payments_monthly"]) == 6


# -------- Santri --------
class TestSantri:
    santri_id = None

    def test_list(self, owner):
        r = owner.get(f"{API}/santri")
        assert r.status_code == 200
        assert len(r.json()) >= 24

    def test_filter_gender(self, owner):
        r = owner.get(f"{API}/santri", params={"gender": "L"})
        assert r.status_code == 200
        assert all(s["gender"] == "L" for s in r.json())

    def test_filter_q(self, owner):
        r = owner.get(f"{API}/santri", params={"q": "Zainab"})
        assert r.status_code == 200

    def test_create_update_get_delete(self, owner):
        payload = {"nomor_induk": "TEST99999", "nama": "TEST_Santri", "gender": "L",
                   "program": "SMPI", "kelas": "7A", "status": "aktif"}
        r = owner.post(f"{API}/santri", json=payload)
        assert r.status_code == 200
        sid = r.json()["santri_id"]
        # Update
        r2 = owner.patch(f"{API}/santri/{sid}", json={"nama": "TEST_Santri_Updated"})
        assert r2.status_code == 200
        assert r2.json()["nama"] == "TEST_Santri_Updated"
        # Get
        r3 = owner.get(f"{API}/santri/{sid}")
        assert r3.status_code == 200
        d = r3.json()
        assert "santri" in d and "payments" in d and "invoices" in d
        # Delete (super_admin)
        r4 = owner.delete(f"{API}/santri/{sid}")
        assert r4.status_code == 200
        # verify
        r5 = owner.get(f"{API}/santri/{sid}")
        assert r5.status_code == 404

    def test_admin_cannot_delete_santri(self, owner, admin):
        payload = {"nomor_induk": "TEST88888", "nama": "TEST_ToDel", "gender": "P",
                   "program": "SMPI", "kelas": "7B", "status": "aktif"}
        r = owner.post(f"{API}/santri", json=payload)
        sid = r.json()["santri_id"]
        r2 = admin.delete(f"{API}/santri/{sid}")
        assert r2.status_code == 403
        owner.delete(f"{API}/santri/{sid}")


# -------- Tagihan --------
class TestTagihan:
    def test_list(self, owner):
        r = owner.get(f"{API}/tagihan")
        assert r.status_code == 200

    def test_create_batch(self, owner):
        payload = {"jenis": "SPP", "periode": "TESTPeriode", "nominal": 100000,
                   "target_type": "kelas", "target_ids": ["7A"], "keterangan": "test"}
        r = owner.post(f"{API}/tagihan", json=payload)
        assert r.status_code == 200
        assert r.json()["created"] >= 0


# -------- Pembayaran --------
class TestPembayaran:
    def test_list(self, owner):
        r = owner.get(f"{API}/pembayaran")
        assert r.status_code == 200

    def test_create_and_kwitansi_and_invoice_link(self, owner):
        # get an invoice
        r = owner.get(f"{API}/tagihan", params={"status": "belum_lunas"})
        invoices = r.json()
        assert len(invoices) > 0
        inv = invoices[0]
        payload = {"santri_id": inv["santri_id"], "invoice_id": inv["invoice_id"],
                   "jenis": inv["jenis"], "periode": inv["periode"],
                   "nominal": inv["nominal"], "metode": "cash"}
        r2 = owner.post(f"{API}/pembayaran", json=payload)
        assert r2.status_code == 200
        pay = r2.json()
        assert pay["trx_no"].startswith("TRX-")
        assert pay["status"] == "lunas"
        # verify invoice updated
        r3 = owner.get(f"{API}/tagihan", params={"santri_id": inv["santri_id"]})
        inv2 = next((i for i in r3.json() if i["invoice_id"] == inv["invoice_id"]), None)
        assert inv2 and inv2["status"] == "lunas"
        # kwitansi
        r4 = owner.get(f"{API}/pembayaran/{pay['payment_id']}/kwitansi")
        assert r4.status_code == 200
        assert r4.headers["content-type"].startswith("application/pdf")
        # cleanup
        owner.delete(f"{API}/pembayaran/{pay['payment_id']}")


# -------- Export --------
class TestExport:
    def test_export_xlsx(self, owner):
        r = owner.get(f"{API}/santri/export/xlsx")
        assert r.status_code == 200
        assert "spreadsheetml" in r.headers["content-type"]

    def test_template_xlsx(self, owner):
        r = owner.get(f"{API}/santri/template/xlsx")
        assert r.status_code == 200


# -------- Search --------
class TestSearch:
    def test_search(self, owner):
        r = owner.get(f"{API}/search", params={"q": "Zainab"})
        assert r.status_code == 200
        assert "santri" in r.json()


# -------- Master data --------
class TestMaster:
    def test_get_programs(self, owner):
        r = owner.get(f"{API}/master/programs")
        assert r.status_code == 200

    def test_get_kelas(self, owner):
        r = owner.get(f"{API}/master/kelas")
        assert r.status_code == 200

    def test_get_payment_types(self, owner):
        r = owner.get(f"{API}/master/payment_types")
        assert r.status_code == 200

    def test_post_master(self, owner):
        r = owner.post(f"{API}/master/programs", json={"name": "TEST_Prog"})
        assert r.status_code == 200
        item_id = r.json()["id"]
        owner.delete(f"{API}/master/programs/{item_id}")

    def test_unknown_master(self, owner):
        r = owner.get(f"{API}/master/unknown")
        assert r.status_code == 404


# -------- Admins (super_admin only) --------
class TestAdmins:
    def test_list_admins_owner(self, owner):
        r = owner.get(f"{API}/admins")
        assert r.status_code == 200

    def test_admin_forbidden(self, admin):
        r = admin.get(f"{API}/admins")
        assert r.status_code == 403

    def test_create_admin_forbidden(self, admin):
        r = admin.post(f"{API}/admins", json={"name": "X", "email": "x@x.com"})
        assert r.status_code == 403


# -------- Aktivitas --------
class TestAktivitas:
    def test_list_owner(self, owner):
        r = owner.get(f"{API}/aktivitas")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_forbidden(self, admin):
        r = admin.get(f"{API}/aktivitas")
        assert r.status_code == 403


# -------- Laporan --------
class TestLaporan:
    def test_laporan(self, owner):
        r = owner.get(f"{API}/laporan")
        assert r.status_code == 200
        d = r.json()
        for k in ["total", "count", "by_jenis", "items"]:
            assert k in d
