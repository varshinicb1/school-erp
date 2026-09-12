"""
Integration tests: hit the REAL HTTP server (in-process, isolated temp DB)
and assert the auth/authorization contract on EVERY API endpoint.

Contract under test:
  C1  Every /api/v1/* endpoint except /health, /auth/login, /auth/logout
      returns 401 to unauthenticated (anonymous) requests.
  C2  A valid Bearer session grants access to every role-general endpoint.
  C3  demo_role backdoor is dead when demo mode is off (403).
  C4  /backup/download additionally requires the Admin role (403 for others).
  C5  Logout invalidates the token; reuse returns 401.
  C6  Static file serving jails requests to the dist directory (no traversal).

These are regression tests for the P0 remediation: before the fix, every
"anon" assertion here returned 200 with the full data payload.
"""

import json
import urllib.error
import urllib.request

import pytest

from endpoint_inventory import build_inventory

# ---------------------------------------------------------------------------
# Minimal HTTP helpers (urllib, no external deps)
# ---------------------------------------------------------------------------

def http_request(base_url, method, path, body=None, token=None):
    """Perform a real HTTP request. Returns (status, parsed_json_or_None)."""
    url = base_url + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            raw = resp.read()
    except urllib.error.HTTPError as e:
        status = e.code
        raw = e.read()

    parsed = None
    if raw:
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            parsed = None
    return status, parsed


# ---------------------------------------------------------------------------
# Session fixtures (real logins against the real login endpoint)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def admin_session(base_url):
    status, resp = http_request(
        base_url, "POST", "/api/v1/auth/login",
        body={"username": "admin", "password": "admin123"},
    )
    assert status == 200, f"admin login failed: {status} {resp}"
    assert resp["status"] == "SUCCESS" and resp["token"].startswith("sess_")
    return {"token": resp["token"], "user": resp["user"]}


@pytest.fixture(scope="module")
def parent_session(base_url):
    status, resp = http_request(
        base_url, "POST", "/api/v1/auth/login",
        body={"username": "parent", "password": "parent123"},
    )
    assert status == 200, f"parent login failed: {status} {resp}"
    return {"token": resp["token"], "user": resp["user"]}


@pytest.fixture(scope="module")
def invalid_token():
    return "sess_" + "0" * 64


# ---------------------------------------------------------------------------
# C1: unauthenticated requests are rejected on EVERY endpoint
# ---------------------------------------------------------------------------

def test_inventory_covers_expected_endpoint_count():
    inv = build_inventory("ADM_DUES", "ADM_CLEAR")
    assert len(inv) == 22, (
        "endpoint inventory drifted — update the auth contract (13 GET, 7 POST, 2 PUT)"
    )


def test_every_endpoint_requires_auth(base_url, invalid_token):
    """The core C1 contract: every endpoint in the inventory rejects anonymous
    requests with 401. Public routes are listed explicitly as exceptions."""
    PUBLIC = {"/api/v1/health", "/api/v1/auth/login", "/api/v1/auth/logout"}

    for ep in build_inventory(adm_with_dues="VIS-2026-0001", adm_clear="VIS-2026-0002"):
        status, body = http_request(base_url, ep["method"], ep["path"], body=ep["body"])

        if ep["path"] in PUBLIC:
            assert status in (200, 401, 429), (
                f"public endpoint {ep['method']} {ep['path']} -> unexpected {status}"
            )
        else:
            assert status == 401, (
                f"AUTH GAP: {ep['method']} {ep['path']} returned {status} "
                f"(expected 401); note: {ep['note']}"
            )

        # An invalid-but-well-formed token must ALSO be rejected everywhere.
        if ep["path"] not in PUBLIC:
            status2, _ = http_request(
                base_url, ep["method"], ep["path"], body=ep["body"], token=invalid_token
            )
            assert status2 == 401, (
                f"AUTH GAP: {ep['method']} {ep['path']} accepted a garbage token "
                f"(returned {status2})"
            )


# ---------------------------------------------------------------------------
# C2: a valid session grants access to role-general endpoints
# ---------------------------------------------------------------------------

def test_valid_token_grants_access(base_url, admin_session):
    token = admin_session["token"]
    inv = build_inventory(adm_with_dues="VIS-2026-0001", adm_clear="VIS-2026-0002")
    PUBLIC = {"/api/v1/health", "/api/v1/auth/login", "/api/v1/auth/logout"}

    ok = fail = 0
    for ep in inv:
        if ep["path"] in PUBLIC or ep["role"] == "Admin":
            continue
        status, body = http_request(base_url, ep["method"], ep["path"], body=ep["body"], token=token)
        # Endpoints that legitimately 404/409 on fixture data are still "authorized"
        if status in (200, 201, 404, 409):
            ok += 1
        else:
            fail += 1
            print(f"  [contract] {ep['method']} {ep['path']} -> {status}: {body}")

    assert fail == 0, f"{fail} endpoints rejected a VALID admin session"
    assert ok >= 18, "expected at least 18 role-general endpoints to authorize"


# ---------------------------------------------------------------------------
# C4: /backup/download is Admin-only
# ---------------------------------------------------------------------------

def test_backup_download_admin_only(base_url, admin_session, parent_session):
    # Anonymous -> 401 (also asserted by the inventory loop)
    status, _ = http_request(base_url, "GET", "/api/v1/backup/download")
    assert status == 401

    # Non-admin authenticated -> 403
    status, _ = http_request(
        base_url, "GET", "/api/v1/backup/download", token=parent_session["token"]
    )
    assert status == 403, "non-admin session must not download the database"

    # Admin -> 200 with SQLite bytes
    status, raw = None, None
    req = urllib.request.Request(
        base_url + "/api/v1/backup/download",
        headers={"Authorization": f"Bearer {admin_session['token']}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            raw = resp.read(16)
    except urllib.error.HTTPError as e:
        status = e.code
    assert status == 200
    assert raw.startswith(b"SQLite format 3"), "admin download should be the SQLite file"


# ---------------------------------------------------------------------------
# C3: demo backdoor is dead in production mode
# ---------------------------------------------------------------------------

def test_demo_role_backdoor_disabled(base_url):
    status, body = http_request(
        base_url, "POST", "/api/v1/auth/login",
        body={"demo_role": "Admin"},
    )
    assert status == 403, f"demo_role login must be refused when demo mode is off (got {status})"
    assert "demo" in (body or {}).get("error", "").lower()

    # The old hardcoded tokens must NOT authenticate anything.
    for legacy in ("admin-token", "teacher-token", "parent-token", "accountant-token"):
        status, _ = http_request(base_url, "GET", "/api/v1/students", token=legacy)
        assert status == 401, f"legacy demo token '{legacy}' still works!"


# ---------------------------------------------------------------------------
# C5: logout invalidates the session
# ---------------------------------------------------------------------------

def test_logout_invalidates_token(base_url):
    _, login = http_request(
        base_url, "POST", "/api/v1/auth/login",
        body={"username": "teacher", "password": "teacher123"},
    )
    token = login["token"]

    status, _ = http_request(base_url, "GET", "/api/v1/students", token=token)
    assert status == 200, "fresh teacher session should access students"

    status, _ = http_request(base_url, "POST", "/api/v1/auth/logout", token=token)
    assert status == 200

    status, _ = http_request(base_url, "GET", "/api/v1/students", token=token)
    assert status == 401, "token must be dead after logout"


# ---------------------------------------------------------------------------
# C6: static file path traversal is blocked
# ---------------------------------------------------------------------------

def test_path_traversal_blocked(base_url):
    # The temp DB lives two directories below the dist dir in production
    # layout; in tests it lives in TMP_DIR. Either way, traversal must not
    # return database bytes.
    for evil in (
        "/../data/school_erp.db",
        "/../../etc/passwd",
        "/..%2fdata%2fschool_erp.db",
        "/%2e%2e/%2e%2e/data/school_erp.db",
    ):
        req = urllib.request.Request(base_url + evil)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                raw = resp.read(16)
                status = resp.status
        except urllib.error.HTTPError as e:
            raw = e.read(16)
            status = e.code
        assert not raw.startswith(b"SQLite format 3"), (
            f"path traversal succeeded for {evil}: served the database!"
        )
        assert status in (200, 403, 404), f"unexpected status {status} for {evil}"


# ---------------------------------------------------------------------------
# Positive functional sanity (auth'd happy paths still work end-to-end)
# ---------------------------------------------------------------------------

def test_health_is_public(base_url):
    status, body = http_request(base_url, "GET", "/api/v1/health")
    assert status == 200
    assert body["status"] == "ONLINE"


def test_login_wrong_password_401(base_url):
    status, _ = http_request(
        base_url, "POST", "/api/v1/auth/login",
        body={"username": "admin", "password": "wrong-password"},
    )
    assert status == 401


def test_fee_collection_flow_with_auth(base_url, admin_session):
    """Money-moving endpoint works when authorized, and records a receipt."""
    adm = "VIS-2026-0001"  # seeded with outstanding dues
    status, body = http_request(
        base_url, "POST", "/api/v1/fees/collect",
        body={"admission_number": adm, "amount": 10.0, "payment_mode": "Cash"},
        token=admin_session["token"],
    )
    assert status == 200, f"authorized fee collection failed: {body}"
    assert body["status"] == "SUCCESS"
    assert body["receipt_number"]

    status, receipts = http_request(base_url, "GET", "/api/v1/fees/receipts", token=admin_session["token"])
    assert status == 200
    assert any(r["receipt_number"] == body["receipt_number"] for r in receipts)


def test_marks_submit_flow_with_auth(base_url, admin_session):
    status, body = http_request(
        base_url, "POST", "/api/v1/marks/submit",
        body={
            "class": "Grade 10", "section": "A", "subject": "Mathematics",
            "examination": "PT1",
            "marks": [{
                "admission_number": "VIS-2026-0002", "student_id": 2,
                "student_name": "Pooja Patel", "marks_obtained": 55, "max_marks": 100,
            }],
        },
        token=admin_session["token"],
    )
    assert status == 200
    assert body["status"] == "SUCCESS"
