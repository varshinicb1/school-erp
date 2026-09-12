"""
Integration test fixtures: boot the REAL turnkey HTTP server in-process.

Isolation strategy (order matters):
1. Import school_india.database.sqlite_db and repoint DB_DIR/DB_PATH at a
   temp dir BEFORE importing turnkey_server (which binds DB_PATH by name
   at import time).
2. Load scripts/turnkey_server.py via importlib with demo mode explicitly
   OFF (production default) so the security contract is tested honestly.
3. Redirect BACKUP_DIR / OUTBOX_DIR into the temp dir.
4. Start ThreadingHTTPServer on 127.0.0.1:0 (random free port).

The developer's data/school_erp.db is never touched by these tests.
"""

import importlib.util
import os
import sys
import tempfile
import threading

import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PRODUCT_DIR = os.path.join(REPO_ROOT, "product", "school_india")
SERVER_PATH = os.path.join(REPO_ROOT, "scripts", "turnkey_server.py")

if PRODUCT_DIR not in sys.path:
    sys.path.insert(0, PRODUCT_DIR)

# The auth contract must be tested with demo mode OFF (production default).
os.environ.pop("SCHOOL_OS_DEMO_MODE", None)
os.environ.pop("SCHOOL_OS_SESSION_TTL_HOURS", None)

import school_india.database.sqlite_db as sqlite_db  # noqa: E402

# ---------------------------------------------------------------------------
# Isolated temp database. Patch BEFORE importing turnkey_server.
# ---------------------------------------------------------------------------
TMP_DIR = tempfile.mkdtemp(prefix="school_os_integration_")
sqlite_db.DB_DIR = TMP_DIR
sqlite_db.DB_PATH = os.path.join(TMP_DIR, "integration_test.db")

_spec = importlib.util.spec_from_file_location("turnkey_server", SERVER_PATH)
turnkey_server = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(turnkey_server)
sys.modules["turnkey_server"] = turnkey_server

# Redirect runtime write-targets into the temp dir as well.
turnkey_server.BACKUP_DIR = os.path.join(TMP_DIR, "backups", "daily_snapshots")
turnkey_server.OUTBOX_DIR = os.path.join(TMP_DIR, "backups", "communication_outbox")
turnkey_server.DB_PATH = sqlite_db.DB_PATH

# Silence per-request access logs.
turnkey_server.TurnkeyHandler.log_message = lambda *args, **kwargs: None


@pytest.fixture(scope="session")
def base_url():
    """Boot the real HTTP server once for the whole test session."""
    sqlite_db.initialize_database()          # creates + seeds the temp DB
    turnkey_server.seed_default_sessions()   # no-op: demo mode is off

    httpd = turnkey_server.ThreadingHTTPServer(
        ("127.0.0.1", 0), turnkey_server.TurnkeyHandler
    )
    httpd.daemon_threads = True
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()

    yield f"http://127.0.0.1:{httpd.server_address[1]}"

    httpd.shutdown()
    httpd.server_close()
