# EXECUTION BLUEPRINT & REMEDIATION PLAN: REALITY AUDIT RESOLUTION

You are acting as the Principal DevOps, Frappe Core Engineer, and Full-Stack Architect.
Your objective is to systematically eliminate every finding in `school-os/reports/REALITY_AUDIT.md` and transition the project from "Pre-Pilot Architecture / Mockup" to a genuinely functioning, live-backed Indian School ERP.

Do not fake results, do not use in-memory stubs without explicit labeling, and do not mark tasks complete without verifying running processes.

---

## WORKSTREAM 1: HOST ENVIRONMENT & LIVE FRAPPE BENCH BOOTSTRAP
1. Start the container engine / WSL environment:
   - Verify Docker Desktop or install / run lightweight native services (MariaDB 10.11 + Redis 7).
   - Alternatively, execute the official Frappe Docker Compose stack defined in `school-os/infrastructure/docker-compose.yml`.
2. Provision the live bench:
   - Initialize an active Frappe Bench inside `school-os/frappe-bench/`.
   - Install the primary v16 apps: `frappe`, `erpnext`, `education`, `hrms`, `payments`.
   - Install the custom app: `school_india` (`bench install-app school_india`).
3. Create the pilot development site:
   - `bench new-site school.localhost --mariadb-root-password admin --admin-password admin`
   - Install all apps onto `school.localhost`.
   - Run `bench --site school.localhost migrate`.
   - Capture live evidence: `bench version`, `bench --site school.localhost list-apps`.

---

## WORKSTREAM 2: CUSTOM DOCTYPE DATABASE VERIFICATION
1. Verify the live database tables in MariaDB:
   - `tabAcademic Class`
   - `tabClass Section`
   - `tabCBSE Exam Cycle`
   - `tabStudent Mark Sheet`
   - `tabSchool Fee Policy`
   - `tabTransfer Certificate`
   - `tabBus Route`
2. Test server-side CRUD & validation for every DocType via Frappe Python CLI / REST API:
   - Attempt creation with valid payloads.
   - Attempt invalid payloads (e.g. TC creation with unpaid fees, invalid mark values) and assert that Frappe server-side validation throws `frappe.ValidationError`.

---

## WORKSTREAM 3: LIVE BACKEND API INTEGRATION IN CAMPUSGRID
1. Eliminate hardcoded arrays in `campusgrid/src/App.tsx`:
   - Replace static `students`, `metrics`, `attendanceRows`, and `feeAging` arrays with live API calls.
   - Connect to Frappe REST API (`/api/method/...` or `/api/resource/Student`, `/api/resource/Class Section`).
2. Add a robust mock/fallback API switch:
   - If running in offline dev mode without Docker, fetch from a local backend server (`python scripts/mock_api_server.py`) serving `tests/vidyuth_seed_data.json` over real HTTP endpoints (`GET /api/v1/students`, `POST /api/v1/attendance`).
   - Prove live data mutation: Changing data on the server and refreshing the UI must update the rendered values.

---

## WORKSTREAM 4: LIVE BROWSER AUTOMATION (PLAYWRIGHT)
1. Write real Playwright E2E scenarios in `tests/e2e/`:
   - Scenario 1: Teacher roll-call modal opening, toggling absent cards, and submitting.
   - Scenario 2: Student search and fee status filtering.
   - Scenario 3: Persona switcher changing authorization context.
2. Run tests against the active frontend port (3000) and capture real screenshots into `school-os/screenshots/baseline/`.
3. Inspect and verify responsive breakpoints (390px, 768px, 1440px).

---

## WORKSTREAM 5: REAL NOTIFICATION GATEWAY ARCHITECTURE
1. Move WhatsApp / SMS from `STUB` to `QUEUE_READY_BUT_PROVIDER_NOT_CONFIGURED`:
   - Implement a pluggable Provider Adapter (`school_india/communication/adapters.py`) supporting:
     * Twilio / Fast2SMS / Gupshup WhatsApp API.
   - Persist communication events to a `tabCommunication Log` DocType with audit fields:
     * `recipient`, `channel`, `message_payload`, `dispatch_status`, `error_trace`.
   - In test/dev mode, write queued messages to a persistent SQLite/JSON outbox rather than pure memory.

---

## WORKSTREAM 6: UPDATED AUDIT & CERTIFICATION
1. Re-run the hostile audit.
2. Update `school-os/reports/REALITY_AUDIT.md` with live process IDs, table proofs, and HTTP response codes.
3. Update `reports/BASELINE_CERTIFICATION.md` to truthfully reflect the new operational status.
