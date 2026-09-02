"""CORS + Bearer auth verification for GitHub Pages fix (iteration_3)."""
import os
import time
import requests
import pytest

PUBLIC_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://shidiq-admin-panel.preview.emergentagent.com").rstrip("/")
DIRECT_URL = "http://localhost:8001"
OWNER_TOKEN = "test_session_1788299858110"
GITHUB_ORIGIN = "https://example-user.github.io"
EVIL_ORIGIN = "https://evil.example.com"


# --- Cross-origin Bearer flow through PUBLIC_URL ---
class TestPublicBearerCrossOrigin:
    def _headers(self):
        return {
            "Authorization": f"Bearer {OWNER_TOKEN}",
            "Origin": GITHUB_ORIGIN,
        }

    def test_auth_me_owner(self):
        r = requests.get(f"{PUBLIC_URL}/api/auth/me", headers=self._headers(), timeout=15)
        assert r.status_code == 200, r.text
        j = r.json()
        assert j["email"] == "akayfikanita@gmail.com"
        assert j["role"] == "super_admin"

    def test_dashboard_stats(self):
        r = requests.get(f"{PUBLIC_URL}/api/dashboard/stats", headers=self._headers(), timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "total_santri" in j
        assert isinstance(j["total_santri"], int)

    def test_santri_list(self):
        r = requests.get(f"{PUBLIC_URL}/api/santri", headers=self._headers(), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_pembayaran_list(self):
        r = requests.get(f"{PUBLIC_URL}/api/pembayaran", headers=self._headers(), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --- Logout via Bearer (uses a disposable session, NOT owner) ---
class TestLogoutBearer:
    @pytest.fixture(scope="class")
    def disposable_token(self):
        from pymongo import MongoClient
        mc = MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
        db = mc[os.environ.get("DB_NAME", "test_database")]
        token = f"TEST_disp_{int(time.time()*1000)}"
        db.user_sessions.insert_one({
            "user_id": "user_694e64d1f6e0",
            "session_token": token,
            "expires_at": "2099-01-01T00:00:00+00:00",
            "created_at": "2026-01-01T00:00:00+00:00",
        })
        yield token
        db.user_sessions.delete_one({"session_token": token})
        mc.close()

    def test_me_works_before_logout(self, disposable_token):
        r = requests.get(f"{PUBLIC_URL}/api/auth/me",
                         headers={"Authorization": f"Bearer {disposable_token}"}, timeout=15)
        assert r.status_code == 200

    def test_logout_bearer_and_verify_deleted(self, disposable_token):
        r = requests.post(f"{PUBLIC_URL}/api/auth/logout",
                          headers={"Authorization": f"Bearer {disposable_token}",
                                   "Origin": GITHUB_ORIGIN}, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # Verify session is gone: /me should now 401
        r2 = requests.get(f"{PUBLIC_URL}/api/auth/me",
                          headers={"Authorization": f"Bearer {disposable_token}"}, timeout=15)
        assert r2.status_code == 401


# --- Direct backend CORS preflight (proves middleware config) ---
class TestDirectBackendCORS:
    def test_preflight_github_origin_reflected(self):
        r = requests.options(
            f"{DIRECT_URL}/api/auth/me",
            headers={
                "Origin": GITHUB_ORIGIN,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            }, timeout=10,
        )
        assert r.status_code in (200, 204), r.text
        acao = r.headers.get("access-control-allow-origin", "")
        assert acao == GITHUB_ORIGIN, f"expected reflected origin, got {acao!r}"
        assert r.headers.get("access-control-allow-credentials", "").lower() == "true"

    def test_preflight_preview_origin_reflected(self):
        preview = "https://shidiq-admin-panel.preview.emergentagent.com"
        r = requests.options(
            f"{DIRECT_URL}/api/auth/me",
            headers={
                "Origin": preview,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            }, timeout=10,
        )
        assert r.status_code in (200, 204)
        assert r.headers.get("access-control-allow-origin", "") == preview

    def test_preflight_evil_origin_not_reflected(self):
        r = requests.options(
            f"{DIRECT_URL}/api/auth/me",
            headers={
                "Origin": EVIL_ORIGIN,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization",
            }, timeout=10,
        )
        # Starlette CORSMiddleware returns 400 for disallowed origins on preflight
        acao = r.headers.get("access-control-allow-origin", "")
        assert acao != EVIL_ORIGIN, f"evil origin should not be reflected, got {acao!r}"
        assert acao != "*"


# --- Invalid/missing token ---
class TestAuthNegatives:
    def test_me_no_token(self):
        r = requests.get(f"{PUBLIC_URL}/api/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_invalid_token(self):
        r = requests.get(f"{PUBLIC_URL}/api/auth/me",
                         headers={"Authorization": "Bearer not_a_real_token"}, timeout=15)
        assert r.status_code == 401
