# Codebase Audit — Indian School OS / CampusGrid

**Date:** 2026-09-12 · **Scope:** school-os/ (turnkey server, school_india package, tests, docs, deployment) + campusgrid/ frontend · **Method:** Static review + live exploitation tests against a local instance (port 5099/5098). All dynamic findings were reproduced, then test artifacts were cleaned from the dev DB.

> **REMEDIATION LOG (2026-09-13):** P0 items fixed and regression-tested: C1 (auth middleware on every /api/v1 route), C2 (Admin-only download), C3 (`import secrets`), C5 (path traversal → realpath jail, 403), C6 (demo tokens/demo_role gated behind `SCHOOL_OS_DEMO_MODE=1`, off by default), C7 (PBKDF2-SHA256 200k iterations with transparent legacy rehash on login), plus login rate limiting and session TTL. Frontend now stores the Bearer token and sends `Authorization` on all calls; lock modal performs real login/logout. Databases, backups and build artifacts untracked via root `.gitignore` (history purge for the already-pushed DB still pending). New integration suite `tests/integration/` boots the real server in-process against an isolated temp DB and asserts the auth contract on all 22 endpoints (11 tests). Verified: 33/33 pytest, frontend `tsc` + build clean, 12-point live smoke test green.

---

## Executive Summary

This is a school ERP built as a single-file Python HTTP server (`scripts/turnkey_server.py`) over embedded SQLite, serving a React (Vite) frontend from a committed build. A parallel "Frappe/ERPNext" app skeleton exists under `product/school_india` but is largely decorative.

**Verdict: NOT production-ready and NOT safe for real student data.** Every API endpoint except `/auth/me` is unauthenticated — including fee collection, settings writes, and full database download. Password hashing uses a single unsalted-then-salted SHA-256 round. The real database with 546 students' PII is committed to git. The `REALITY_AUDIT.md` claim of "server-side RBAC secured" is contradicted by the code: the RBAC test tests a pure function, not the server.

Tests pass (23/23), but they validate business-logic helpers, not the HTTP server.

| Severity | Count | Highlights |
|---|---|---|
| Critical | 7 | No auth on any data endpoint; DB download; path traversal; PII in git; broken login; hardcoded admin creds; weak hashing |
| High | 6 | Mock sessions override real users; secrets written client-side; no rate limiting; fee receipt # collision; demo/fake data conflated with real |
| Medium | 7 | No CSRF protection; hardcoded token naming; attendance/marks double-counting; CSV replace semantics; stray debug artifacts; module drift; test port coupling |
| Low | 5 | Doc/code drift; repo hygiene; root-relative test paths; no lint config for server; duplicate DB copies |

---

## CRITICAL Findings (verified, in order of severity)

### C1. Zero authentication on the API — every data endpoint is public
`_get_auth_user()` exists and the frontend has an auth "lock" modal, but **no route except `/api/v1/auth/me` ever calls it**. Verified live:

```
GET  /api/v1/students                     → 200 full PII roster, no Authorization header
GET  /api/v1/report-card/VIS-2026-0001    → 200 official CBSE report card, no auth
POST /api/v1/fees/collect {amount}        → 200 "SUCCESS", receipt issued, DB mutated, no auth
PUT  /api/v1/school/settings              → 200 gateway credentials overwritten, no auth
POST /api/v1/marks/submit                 → grades can be forged, no auth
POST /api/v1/attendance/submit            → attendance forged, no auth
POST /api/v1/import/students              → bulk data overwrite, no auth
POST /api/v1/backup/create                → arbitrary snapshot creation, no auth
```
The frontend never sends an `Authorization` header at all (grep confirmed: 0 occurrences in `App.tsx`). The `docs/PERMISSION_MATRIX.md` defines 14 roles with fine-grained permissions; **none of it is enforced in the server.**

### C2. Full database download without authentication
`GET /api/v1/backup/download` streams the live SQLite file to anyone. Combined with C1 this is total disclosure. Also `GET /../../data/school_erp.db` (path traversal, see C5) returns the same file.

### C3. Login endpoint crashes — `NameError: secrets` (real users can never log in)
`turnkey_server.py:370` uses `secrets.token_hex(16)` but the module never imports `secrets`. Verified live:
```
NameError: name 'secrets' is not defined. Did you forget to import 'secrets'
```
Consequence: password-based login is dead code in practice. The demo works only because of hardcoded token sessions (see C6). Because `set -e`/`try` blocks don't cover this, every legitimate login 500s.

### C4. Real PII committed to git
- `data/school_erp.db` (163 KB, 546 students + guardian names/phones, 20 marks records, audit logs, payment receipts) — **tracked and modified in the working tree right now**
- `product/data/school_erp.db` (second copy)
- `school_india.db` (empty file, still tracked)
- `backups/communication_outbox/*` and `product/backups/communication_outbox/*` — runtime artifacts tracked
- `tests/vidyuth_seed_data.json` — 11,373 lines of synthetic-but-realistic student PII (names, guardian phones, PEN/APAAR IDs, fee balances). Synthetic data is fine for tests, but it is indistinguishable from real data once in the same repo as a live DB, and the app *seeds production tables from this file*.
- Build artifacts committed: `campusgrid_dist/` (used directly by the server, hence shipping the committed JS in the Docker image's fallback path).
There is no `.gitignore` at repo root; `data/`, `backups/`, and `*.db` should never be tracked. Anything already committed must be purged from history (the DB has been pushed to the public GitHub repo linked in `render.yaml`).

### C5. Path traversal in static file server
`_handle_static_file()` joins `path.lstrip("/")` onto `DIST_DIR` with no canonicalization. Verified live:
```
curl --path-as-is http://127.0.0.1:5099/../data/school_erp.db   → 200, SQLite bytes
```
Anything under the deployment filesystem reachable via `../` from `campusgrid_dist/` is downloadable — including `.env`, source, and the database.

### C6. Hardcoded admin credentials + permanent backdoor tokens
- Launcher banners print `admin / admin123` (start_school_os.sh/bat); seeds in `sqlite_db.py` create `admin/admin123`, `teacher/teacher123`, `parent/parent123`, `accountant/account123` in every fresh install. No forced password change on first run.
- `seed_default_sessions()` installs 4 eternal bearer tokens (`admin-token`, `teacher-token`, `parent-token`, `accountant-token`) in every process, and `/auth/login` accepts `{"demo_role": "Admin"}` to hand out the admin token with no credential check. Anyone who guesses the token string gets admin. There is no expiry, no revocation, no flag to disable demo mode.

### C7. Password hashing: single unsalted-then-salted SHA-256 round
`hash_password()` = `sha256(salt + password)` once. Fast hash, no stretching, GPU-crackable at millions of guesses/sec. Use `hashlib.pbkdf2_hmac('sha256', pw, salt, ≥200_000)` (stdlib, no new dependency) or bcrypt/argon2. Also `verify_password` uses non-constant-time `==` (timing side channel; moot today given C1 but should be fixed alongside).

---

## HIGH Findings

### H1. In-memory sessions: restart = logout everyone; no TTL; no logout-all
`ACTIVE_SESSIONS` dict is lost on every deploy (Render redeploys constantly on the free plan). No session expiry, no size bound, no persistence. On Render's single free instance this also means sessions vanish mid-day for all staff.

### H2. Fee collection: forged/mismatched receipts, silent fallback to first student
In `/fees/collect`, if the admission number is unknown the code **falls back to "first student in table"** and applies the payment to the wrong child (`st = cursor.fetchone()` on `SELECT * FROM students LIMIT 1`). Payment is recorded against `adm_no` (the *requested* number) in the receipt while mutating a *different* student's balance. Receipt numbers can also collide: `REC/YYYYMMDD/{student_id:04d}` means one receipt per student per day per collection — a second same-day payment hits `UNIQUE` constraint and 500s the request (unhandled exception → stack trace to client).

### H3. Marks entry writes grade bands that contradict the configurable engine
`/marks/submit` hardcodes its own 9-point bands inline instead of using `ConfigurableEvaluationEngine`, ignoring the `grading_scale` setting (CBSE_9_POINT vs Telangana SSC). A school that configured the TS SSC scheme still gets CBSE bands from the API. Also no validation that `marks_obtained ≤ max_marks` — negative or >100% marks are accepted and graded.

### H4. Attendance fallback assigns marks/attendance to arbitrary students
`/attendance/submit`: when `student_id` can't be resolved it inserts the record against `SELECT id FROM students LIMIT 1` — silently corrupting another child's attendance record.

### H5. Frontend can exfiltrate or brick gateway credentials
The Settings UI loads all secrets into React state and PUTs them back verbatim; masking is display-only and trivially bypassed (`value[:4] + "****" + value[-4:]` preserves real prefix/suffix — for Razorpay keys that leaks 8 chars). Any visitor (no auth, C1) can overwrite `razorpay_key_secret`, `sms_api_key`, `whatsapp_cloud_token` and route all fee-payment and parent-notification traffic to attacker-controlled accounts. Also, on Render the settings PUT would target the *last-written* settings row set with no audit of who changed what beyond a generic message.

### H6. Demo data and fake metrics are served as if real
- `/summary` returns hardcoded `roll_call_pct: "94.2%"` and `open_staff_cover: 4` regardless of DB state.
- `/attendance` (grade stats) and the entire official-looking `/report-card/` payload (marks, grades, attendance %, co-scholastic) are **hardcoded constants** — the endpoint fabricates an official CBSE document for any admission number found in students.
- Frontend hardcodes metrics (`'1,284'` students etc.) in `App.tsx` as fallback values that silently display when the API fails — dashboards will show plausible-but-wrong numbers on any backend hiccup.
- `/marks/class` returns "first 8 students for smooth UI demonstration" from other classes when the roster is empty.

For a product whose docs claim "non-fabricated government data readiness," fabricating report cards is a credibility and compliance landmine.

### H7. No rate limiting / lockout on auth; no HTTPS enforcement
`ThreadingHTTPServer` on `0.0.0.0` with no TLS termination assumption documented, no rate limiting anywhere, no account lockout. Combined with C6's printable credentials, brute force is trivial. Render terminates TLS in front, but local/LAN deployments (the launcher's explicit use case) are plaintext.

### H8. Test suite provides false confidence
23 tests pass, but `test_persona_security.py` tests a **local pure function** with a hand-built dict — it never touches the server. Same for the rest: they validate seed data invariants, evaluators, importer, and the gateway adapter. Nothing asserts authentication, authorization, or the HTTP layer. `reports/REALITY_AUDIT.md` then cites these tests as evidence that "Persona Privilege Escalation: SECURED_SERVER_SIDE" — which is false. `tests/e2e/*` require Playwright and a server on port 5050; they weren't part of the pytest run.

---

## MEDIUM Findings

### M1. Outbox write is path-injection-prone and unbounded
`/attendance/submit` writes `outbox/attendance_{class}_{section}_{date}.json` using raw client input. Verified: `{"class":"../../pwned"}` created `backups/communication_outbox/pwned_X_evil.json` — arbitrary file write (cleaned up after test). One file per class/section/day also grows unbounded, and each write rewrites the whole notifications log via read-modify-write with no locking (concurrent requests can lose entries).

### M2. No CSRF protection + permissive CORS
`Access-Control-Allow-Origin: *` on all responses including API. Not exploitable for reads with credentials in this design (tokens are in-memory, not cookies), but any script on any origin can call the fully-open API regardless. If auth is fixed with cookies later, this becomes CSRF by default.

### M3. Attendance and marks have no uniqueness constraint
`attendance_records` allows duplicate rows for the same student/class/date — resubmission double-counts. The outbox JSON is overwritten per class/day with the *whole request body* (including student IDs), another PII copy on disk outside the DB. Marks have a UNIQUE constraint but attendance doesn't.

### M4. `INSERT OR REPLACE` in bulk importer silently deletes child rows
`/import/students` commit path uses `INSERT OR REPLACE INTO students`, which deletes-then-inserts on conflict — with `foreign_keys=ON` + `ON DELETE CASCADE`, re-importing an existing admission number **deletes all their attendance and marks history** and re-creates the student with a new id. Should be `INSERT ... ON CONFLICT(admission_number) DO UPDATE`.

### M5. DB path resolution is CWD-fragile
`DB_DIR` is derived from `__file__` (good), but `turnkey_server.py` computes `BASE_DIR` from `__file__` too while `render.yaml`/Docker run from `/app/school-os`. `start_school_os.sh` sets `PYTHONPATH` before invoking, and the bat fallback does `pip install -e`, which changes import resolution. Multiple launch paths make it easy to accidentally create a *second* database (evidence: `school_india.db`, `product/data/school_erp.db` both exist). Also `initialize_database()` runs on *import* if the file is missing — surprising side effect for any tooling that imports the module.

### M6. Threading + SQLite: concurrent writes can throw
WAL is enabled, but there is no `busy_timeout` retry wrapper and every request opens/closes a connection (fine) while `/marks/submit` loops individual INSERTs inside one transaction — good — but `/fees/collect` does SELECT-then-UPDATE without `BEGIN IMMEDIATE`, so two concurrent payments can both read the same balance (lost update). For a fee ledger this matters.

### M7. Secrets masked but logged
`_handle_static_file` serves `Cache-Control: no-cache` (good), but outbox JSON files and `audit_logs` rows contain PII; `system_settings` masks secrets only in the GET response — the actual values sit in a DB that (per C4) is committed to git and downloadable (C2/C5).

---

## LOW Findings

### L1. Module drift: two contradictory PEN validators
`government_data/health_service.py` requires `PEN-` + **12** digits; `readiness_service.py` requires **11** digits and explicitly says the `PEN-` prefix is nonstandard; the seed data uses the prefixed format, which `readiness_service` marks invalid (verified programmatically). `REALITY_AUDIT.md` claims this was "corrected" — but the old validator still ships and the data contradicts the new one. Pick one authority, migrate the data, delete the other.

### L2. Docs claim features the code doesn't have
`PERMISSION_MATRIX.md` (14 roles), `docs/SCHOOL_HANDOVER_AND_USER_GUIDE.md`, and the commercial release manifest describe RBAC, approval workflows, timetable, payroll, transport, HR — none present in the turnkey server. The Frappe doctype JSON/Py files are scaffolding (some import `frappe` in a try/except with a stub `Document`), untested against Frappe 16.

### L3. Repo hygiene
`frappe-bench/` is an empty dir; `product/backups/` duplicates runtime dirs; `screenshots/`, `.serena/`, `reports/*.md` mix generated artifacts with source; `start_school_os.bat` banner hardcodes "Admin Default Credentials: admin/admin123" — printing credentials in launcher output trains users to share passwords.

### L4. Frontend: 2,500-line single component
`App.tsx` holds all state, all modals, all fetches with `any` types everywhere, no error boundaries, no loading/failed states beyond silent `.catch(() => {})` — the same fallback-to-fake-data problem as H6. `vite.config.ts` has no proxy config; the port-sniffing `API_BASE` heuristic (`window.location.port === '5173' ? 'http://127.0.0.1:5050' : ''`) breaks on any other dev port and on preview deployments.

### L5. Tests write to the repo and require exact paths
`test_button_states_and_ui.py` hardcodes `REPO_DIR = r"C:\Users\varsh\school-erp\school-os"` and a personal artifact dir under `.gemini/` — fails on any other machine. `master_test_loop.py` requires CWD = school-os root and does `sys.path.insert(0, ".")`.

### L6. `docker-compose.yml` mismatch
Infrastructure compose launches Frappe/ERPNext/MariaDB/Redis, but the actual product is the SQLite turnkey server — two architectures, one repo, only one of which works. The Dockerfile (root) builds the working stack; `infrastructure/` describes a stack that was never finished (no `site_config`, no bench setup steps).

---

## What works well (credit where due)

- Parameterized SQL everywhere — no SQL injection found in any endpoint.
- Seed data pipeline, WAL mode, and schema are reasonable for a local-first demo.
- `ConfigurableEvaluationEngine` (Pydantic-validated, multi-board, versioned) is genuinely well-designed — it's just not wired into the API.
- PEN/APAAR validators in `readiness_service.py` match published national formats, and the code is honest that official verification isn't integrated.
- `StudentMigrationImporter` validates CSV headers and rejects bad rows explicitly.
- Tests that exist are real assertions (not smoke tests) for the units they cover, and they pass.

---

## Priority Remediation Plan

**P0 — do before anyone else touches the deployed instance**
1. Fix `import secrets` (C3) — one line.
2. Add auth middleware: every `/api/v1/*` route except `/health` and `/auth/login` requires a valid session (C1/C2). Reject when `demo_role` in production (env flag `DEMO_MODE=0`).
3. Remove hardcoded demo tokens (C6) and force password change on first login.
4. Purge `data/*.db`, `product/data/*.db`, `school_india.db`, `backups/**`, `campusgrid_dist/` from git **and history**; add root `.gitignore` (`data/`, `backups/`, `*.db`, `dist/`, `product/data/`, `product/backups/`). Rotate the GitHub repo if the DB was pushed (it's linked in render.yaml — treat it as leaked).
5. Fix static file handler: `os.path.realpath` + prefix check against `DIST_DIR` (C5); restrict `/backup/download` to authenticated Admins.

**P1 — before any real school pilot**
6. PBKDF2 (≥200k iterations) password hashing + migration of stored hashes (C7).
7. Server-side role checks per endpoint using the role already stored in the session; delete or wire the permission matrix (H1/H8).
8. Fix fee collection: no first-student fallback (H2), receipt numbering via sequence, `BEGIN IMMEDIATE` around balance updates (M6).
9. Replace hardcoded `/attendance`, `/summary` metrics and `/report-card` payload with real queries; return 404/empty when data is missing (H6).
10. Rate-limit `/auth/login` (simple in-memory counter is fine at this scale) (H7).
11. Replace `INSERT OR REPLACE` importer with upsert (M4); add UNIQUE(student_id, class, section, date) to attendance (M3).
12. Sanitize outbox filename inputs (M1).

**P2 — quality**
13. Wire `ConfigurableEvaluationEngine` into `/marks/submit` (H3); validate marks bounds.
14. Persistent sessions (SQLite table with expiry) instead of the dict (H1).
15. Vite proxy config; split App.tsx; typed API client; stop rendering fake fallback metrics (L4).
16. Reconcile the two PEN validators and the seed data format (L1); align docs to reality or mark features as roadmap (L2).

---

## Verification Notes

- Live exploitation commands and outputs are quoted inline above; server was run locally on ports 5099/5098 and shut down after testing.
- Test writes to the dev DB (one settings key, one receipt, one audit row) were reverted; the traversal-write test artifact `pwned_X_evil.json` was deleted.
- `pytest tests/` → 23 passed in 26.17s.
- The `data/school_erp.db` in the working tree shows as modified — audit confirms it contains runtime data beyond seed state; do not commit it.
