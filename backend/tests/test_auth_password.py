"""Auth (username/password) tests for AS SHIDIQ.

Covers: login (username/email), remember_me expiry, bcrypt hash,
lockout after 5 wrong attempts, inactive account, protected route,
legacy Google endpoint gone, reset password (super_admin), create admin
with/without password, duplicate username, RBAC on /api/admins.

Cleanup: restores admintest password to Test@123, removes login_attempts
we created, deletes admins we created.
"""
import os
import time
import pytest
import requests
from pymongo import MongoClient

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE:
    # fallback read from frontend/.env
    with open("/app/frontend/.env") as f:
        for ln in f:
            if ln.startswith("REACT_APP_BACKEND_URL="):
                BASE = ln.split("=", 1)[1].strip()

API = f"{BASE}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")

SUPER_USER = "superadmin"
SUPER_EMAIL = "akayfikanita@gmail.com"
SUPER_PW = "Admin@123"
ADMIN_USER = "admintest"
ADMIN_EMAIL = "admin.test@as-shidiq.sch.id"
ADMIN_PW = "Test@123"


@pytest.fixture(scope="module")
def mongo():
    with open("/app/backend/.env") as f:
        for ln in f:
            if ln.startswith("MONGO_URL="):
                url = ln.split("=", 1)[1].strip().strip('"')
            if ln.startswith("DB_NAME="):
                dbn = ln.split("=", 1)[1].strip().strip('"')
    c = MongoClient(url)
    yield c[dbn]
    c.close()


@pytest.fixture(scope="module")
def super_token():
    r = requests.post(f"{API}/auth/login", json={"identifier": SUPER_USER, "password": SUPER_PW, "remember_me": False})
    assert r.status_code == 200, r.text
    return r.json()["session_token"]


@pytest.fixture(scope="module")
def super_headers(super_token):
    return {"Authorization": f"Bearer {super_token}"}


# ============ LOGIN ============
class TestLogin:
    def test_login_by_username(self, mongo):
        r = requests.post(f"{API}/auth/login", json={"identifier": SUPER_USER, "password": SUPER_PW})
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["role"] == "super_admin"
        assert d["session_token"].startswith("sess_")
        # cookie set
        assert "session_token" in r.cookies
        # bcrypt hash
        u = mongo.users.find_one({"username": SUPER_USER})
        assert u["password_hash"].startswith("$2b$"), f"hash={u['password_hash'][:10]}"

    def test_login_by_email(self):
        r = requests.post(f"{API}/auth/login", json={"identifier": SUPER_EMAIL, "password": SUPER_PW})
        assert r.status_code == 200
        assert r.json()["user"]["email"] == SUPER_EMAIL

    def test_login_admin_rbac(self):
        r = requests.post(f"{API}/auth/login", json={"identifier": ADMIN_USER, "password": ADMIN_PW})
        assert r.status_code == 200, r.text
        tok = r.json()["session_token"]
        assert r.json()["user"]["role"] == "admin"
        h = {"Authorization": f"Bearer {tok}"}
        # admin blocked from /api/admins
        assert requests.get(f"{API}/admins", headers=h).status_code == 403
        # admin can access santri
        assert requests.get(f"{API}/santri", headers=h).status_code == 200

    def test_remember_me_expiry(self, mongo):
        # remember_me true → ~30d
        r = requests.post(f"{API}/auth/login", json={"identifier": SUPER_USER, "password": SUPER_PW, "remember_me": True})
        tok = r.json()["session_token"]
        sess = mongo.user_sessions.find_one({"session_token": tok})
        from datetime import datetime, timezone, timedelta
        exp = datetime.fromisoformat(sess["expires_at"])
        delta = (exp - datetime.now(timezone.utc)).total_seconds() / 86400
        assert 28 < delta < 31, f"expected ~30d, got {delta}"
        mongo.user_sessions.delete_one({"session_token": tok})

        r = requests.post(f"{API}/auth/login", json={"identifier": SUPER_USER, "password": SUPER_PW, "remember_me": False})
        tok = r.json()["session_token"]
        sess = mongo.user_sessions.find_one({"session_token": tok})
        exp = datetime.fromisoformat(sess["expires_at"])
        delta = (exp - datetime.now(timezone.utc)).total_seconds() / 86400
        assert 0.5 < delta < 1.5, f"expected ~1d, got {delta}"
        mongo.user_sessions.delete_one({"session_token": tok})

    def test_wrong_password(self, mongo):
        r = requests.post(f"{API}/auth/login", json={"identifier": SUPER_USER, "password": "wrong-XYZ"})
        assert r.status_code == 401
        assert "salah" in r.json()["detail"].lower()
        mongo.login_attempts.delete_one({"identifier": SUPER_USER})

    def test_unknown_identifier(self):
        r = requests.post(f"{API}/auth/login", json={"identifier": "nobody-xyz-999", "password": "x"})
        assert r.status_code == 401

    def test_protected_route_without_auth(self):
        r = requests.get(f"{API}/santri")
        assert r.status_code == 401

    def test_old_google_endpoint_removed(self):
        r = requests.post(f"{API}/auth/session", headers={"X-Session-ID": "x"})
        assert r.status_code in (404, 405), f"got {r.status_code}"


class TestLockout:
    def test_lockout_after_5_failed(self, mongo):
        # Use dedicated disposable user so we don't disrupt admintest
        from bcrypt import hashpw, gensalt
        uid = "user_locktest_zzz"
        mongo.users.delete_one({"user_id": uid})
        mongo.users.insert_one({
            "user_id": uid, "email": "locktest@as-shidiq.sch.id",
            "username": "locktest", "name": "Lock Test", "role": "admin",
            "status": "active",
            "password_hash": hashpw(b"Correct@123", gensalt()).decode(),
        })
        mongo.login_attempts.delete_one({"identifier": "locktest"})
        try:
            for i in range(5):
                r = requests.post(f"{API}/auth/login", json={"identifier": "locktest", "password": "wrong"})
                assert r.status_code == 401, f"attempt {i}: {r.status_code}"
            # 6th attempt with CORRECT password → 429
            r = requests.post(f"{API}/auth/login", json={"identifier": "locktest", "password": "Correct@123"})
            assert r.status_code == 429, f"expected 429 lockout, got {r.status_code}: {r.text}"
        finally:
            mongo.users.delete_one({"user_id": uid})
            mongo.login_attempts.delete_one({"identifier": "locktest"})
            mongo.user_sessions.delete_many({"user_id": uid})


class TestInactive:
    def test_inactive_login_blocked(self, mongo):
        from bcrypt import hashpw, gensalt
        uid = "user_inactive_zzz"
        mongo.users.delete_one({"user_id": uid})
        mongo.users.insert_one({
            "user_id": uid, "email": "inactive@as-shidiq.sch.id",
            "username": "inactivetest", "name": "Inactive", "role": "admin",
            "status": "inactive",
            "password_hash": hashpw(b"Test@123", gensalt()).decode(),
        })
        try:
            r = requests.post(f"{API}/auth/login", json={"identifier": "inactivetest", "password": "Test@123"})
            assert r.status_code == 403, f"got {r.status_code}: {r.text}"
        finally:
            mongo.users.delete_one({"user_id": uid})


class TestResetPassword:
    def test_super_admin_resets_admintest(self, super_headers, mongo):
        target = mongo.users.find_one({"username": ADMIN_USER})
        uid = target["user_id"]
        # Login admintest first to have an existing session
        r_pre = requests.post(f"{API}/auth/login", json={"identifier": ADMIN_USER, "password": ADMIN_PW})
        assert r_pre.status_code == 200
        old_tok = r_pre.json()["session_token"]

        # Reset password
        r = requests.post(f"{API}/admins/{uid}/reset-password", headers=super_headers, json={"password": "Baru@456"})
        assert r.status_code == 200, r.text

        # Old session invalidated
        r_old = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {old_tok}"})
        assert r_old.status_code == 401

        # Old password fails
        r_bad = requests.post(f"{API}/auth/login", json={"identifier": ADMIN_USER, "password": ADMIN_PW})
        assert r_bad.status_code == 401
        mongo.login_attempts.delete_one({"identifier": ADMIN_USER})

        # New password works
        r_new = requests.post(f"{API}/auth/login", json={"identifier": ADMIN_USER, "password": "Baru@456"})
        assert r_new.status_code == 200

        # Restore
        r_restore = requests.post(f"{API}/admins/{uid}/reset-password", headers=super_headers, json={"password": ADMIN_PW})
        assert r_restore.status_code == 200

        r_verify = requests.post(f"{API}/auth/login", json={"identifier": ADMIN_USER, "password": ADMIN_PW})
        assert r_verify.status_code == 200

    def test_reset_password_too_short(self, super_headers, mongo):
        target = mongo.users.find_one({"username": ADMIN_USER})
        r = requests.post(f"{API}/admins/{target['user_id']}/reset-password",
                          headers=super_headers, json={"password": "abc"})
        assert r.status_code == 400


class TestCreateAdmin:
    created_id = None

    def test_create_admin_with_password(self, super_headers, mongo):
        payload = {"name": "Temp Admin", "email": "temp.new@as-shidiq.sch.id",
                   "username": "tempnew1", "password": "Temp@123", "role": "admin"}
        r = requests.post(f"{API}/admins", headers=super_headers, json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "password_hash" not in d
        TestCreateAdmin.created_id = d["user_id"]
        # login works
        rl = requests.post(f"{API}/auth/login", json={"identifier": "tempnew1", "password": "Temp@123"})
        assert rl.status_code == 200

    def test_create_admin_without_password(self, super_headers):
        r = requests.post(f"{API}/admins", headers=super_headers,
                          json={"name": "X", "email": "x.nopwd@as-shidiq.sch.id"})
        assert r.status_code == 400

    def test_duplicate_username(self, super_headers):
        r = requests.post(f"{API}/admins", headers=super_headers,
                          json={"name": "Y", "email": "y.dup@as-shidiq.sch.id",
                                "username": "tempnew1", "password": "Zzz@123"})
        assert r.status_code == 400

    def test_cleanup_created_admin(self, super_headers, mongo):
        if TestCreateAdmin.created_id:
            r = requests.delete(f"{API}/admins/{TestCreateAdmin.created_id}", headers=super_headers)
            assert r.status_code == 200
            assert mongo.users.find_one({"user_id": TestCreateAdmin.created_id}) is None


class TestAuthMe:
    def test_me_via_cookie(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"identifier": SUPER_USER, "password": SUPER_PW})
        assert r.status_code == 200
        r2 = s.get(f"{API}/auth/me")
        assert r2.status_code == 200
        assert r2.json()["username"] == SUPER_USER

    def test_me_via_bearer(self, super_headers):
        r = requests.get(f"{API}/auth/me", headers=super_headers)
        assert r.status_code == 200
