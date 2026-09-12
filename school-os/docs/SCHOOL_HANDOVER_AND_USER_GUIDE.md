# 🏫 School OS + CampusGrid: Turnkey Indian School ERP
## Commercial Handover & Self-Service Operations Manual

> **Product Version:** 1.0.0 Commercial Turnkey Release  
> **Target Audience:** School Principals, Academic Administrators, Accounts Department, Teachers, and IT Staff  
> **Deployment Model:** 100% Self-Hosted, Turnkey, Single-Port Deployment (`http://localhost:5050`)  
> **Zero-Vendor Lock-in Guarantee:** Embedded ACID SQLite Database with Instant Local Snapshots & Zero Developer Touch  

---

## 1. Executive Summary & System Capabilities

**School OS + CampusGrid** is a production-grade School Operating System engineered specifically for Indian K-12 educational institutions (CBSE, CISCE, and State Boards).

The system has been packaged so that **the software author can hand over the package and walk away ("tie your hands and school handles the rest")**. School leadership retains 100% data sovereignty, self-configures their own payment gateways and communication services, imports student rosters with Government UDISE+/APAAR validation, conducts daily attendance in under 20 seconds, records marks via rapid spreadsheet grids with automatic CBSE 9-point grade calculations, manages a cashier day-book with 1-click receipt re-printing, collects fees with official stamped receipts, locks staff sessions, and generates official CBSE report cards.

### Core Architecture
- **Single Port Simplicity (`5050`):** Both the REST API service and compiled React web frontend are served simultaneously on a single port (`http://localhost:5050`).
- **Zero Cloud Runtime Dependency:** The SQLite ACID database operates locally in Write-Ahead-Logging (WAL) mode. The system functions smoothly in offline or bandwidth-constrained school environments.
- **Government Compliance Ready:** Native format validators for 11-digit National Student PEN (Permanent Education Number) and 12-digit APAAR (Automated Permanent Academic Account Registry) / Edu ID.
- **CBSE 75% Attendance Guard:** Automatically enforces Board attendance compliance rules across academic terms.
- **Financial Clearance TC Guard:** Transfer Certificates cannot be generated until fee dues are settled in full.
- **Integrated Audit Ledger:** Every fee receipt, mark change, and configuration modification is recorded in a tamper-evident audit ledger.
- **Demo Data Preserved:** Comes pre-seeded with 546 Vidyuth Vidyalaya student records, initial fee receipts, and marks for Grade 10A Mathematics PT1, allowing immediate staff onboarding and simulation without erasing prior records.

---

## 2. Visual Proof & End-to-End Test Evidence

The system has been comprehensively verified through a master test suite of **21 unit assertions** and **16 browser end-to-end scenarios** (Screenshots located in `screenshots/baseline/`):

- **Scenario 1:** Desktop Principal & Admin Executive Dashboard (`01_desktop_dashboard.png`)
- **Scenario 2:** Rapid Class Attendance Modal with Instant Parent Notification (`02_rapid_attendance_modal.png`)
- **Scenario 3:** Spotlight Keyboard Command Palette (`Ctrl+K` / `Cmd+K`) (`03_command_palette_ctrl_k.png`)
- **Scenario 4:** Transfer Certificate (TC) Generator with Financial Clearance Guard (`04_transfer_certificate_modal.png`)
- **Scenario 5:** Mobile Responsive Viewport (390 x 844 iPhone profile) (`05_mobile_viewport_390x844.png`)
- **Scenario 6:** Tablet Responsive Viewport (768 x 1024 iPad profile) (`06_tablet_viewport_768x1024.png`)
- **Scenario 7:** Teacher Dedicated Workspace & Class Routine (`07_teacher_persona_view.png`)
- **Scenario 8:** Parent & Student Transparent Academic & Fee Portal (`08_parent_persona_view.png`)
- **Scenario 9:** Cashier & Accounts Fee Collection Center (`09_accountant_persona_view.png`)
- **Scenario 10:** School Identity, Board Affiliation & Onboarding Settings (`10_school_onboarding_settings.png`)
- **Scenario 11:** Self-Service Direct Razorpay, UPI & DLT SMS Gateways (`11_gateways_self_configuration.png`)
- **Scenario 12:** Bulk Student CSV Importer with UDISE+ PEN / APAAR Validation (`12_bulk_csv_importer.png`)
- **Scenario 13:** Stamped Fee Payment Receipt with Cashier Seal & Signature (`13_fee_collection_receipt.png`)
- **Scenario 14:** Official Bilingual CBSE Continuous & Comprehensive Evaluation Report Card (`14_cbse_official_report_card.png`)
- **Scenario 15:** Teacher Rapid Marks Entry Spreadsheet Grid with Real-Time CBSE 9-Point Grades (`15_teacher_marks_entry_grid.png`)
- **Scenario 16:** Fee Cashier Day-Book Ledger with 1-Click Stamped Receipt Re-printing (`16_accountant_daybook_ledger.png`)

---

## 3. 1-Click Launch Instructions

### For Windows Desktops / School Server:
Double-click:
```cmd
start_school_os.bat
```
The batch script:
1. Automatically adds required Python module paths to `PYTHONPATH`.
2. Creates data and backup folders (`data/`, `backups/daily_snapshots/`, `backups/communication_outbox/`).
3. Starts the unified turnkey server on port `5050`.
4. Automatically opens Google Chrome or Microsoft Edge directly to `http://localhost:5050`.

### For Linux / macOS / Cloud Servers:
```bash
chmod +x start_school_os.sh
./start_school_os.sh
```

---

## 4. Operator Workflows by Role

### 👑 1. School Administrator & Principal
1. **Initial School Onboarding:** Open `⚙️ School Settings` in the sidebar to configure School Name, CBSE Affiliation Number, UDISE+ Code, and Address.
2. **Direct Fee Gateways:** In the `Payment & SMS Gateways` tab, enter the school's own **Razorpay Key ID and Secret** or school **UPI ID** (`schoolname@icici`). Payments flow directly into the school's bank account with zero vendor intermediary.
3. **SMS Communication:** Enter your DLT registered Sender ID (`VIDYUT`) and Fast2SMS / Gupshup API Key.
4. **Examination & Grading Scheme:** Select standard CBSE 9-point scale or State Board GPA scale, passing criteria (33% or 35%), and grace mark limits.
5. **Bulk CSV Student Importer:** Paste student rosters to validate 11-digit PEN and 12-digit APAAR before committing to the SQLite database.
6. **Disaster Recovery & Snapshots:** Click **Download Full Database (.db)** or **Create Snapshot Now** for instantaneous offline backups.
7. **Session Lock:** Use the topbar **🔒 Lock Session** button whenever leaving the terminal unattended.

### 👩‍🏫 2. Class Teachers
1. **Daily Timetable:** View real-time assigned periods and classroom schedule.
2. **⚡ Fast Attendance (<20s):**
   - Click `⚡ Fast Attendance (<20s)`.
   - Toggle student status cards (Present, Absent, Late) in single clicks.
   - Click `Submit Attendance & Notify Parents`. Absentee SMS payloads are automatically logged and routed to the communication outbox.
3. **📝 Rapid Marks Entry Spreadsheet Grid:**
   - Click `📝 Enter Marks` in the Teacher actions bar.
   - Select the target Examination (`Periodic Test 1`, `Term 1 Exam`, etc.), Class, and Subject.
   - Enter numeric scores into the rapid input cells.
   - The system automatically calculates and renders the official CBSE 9-point grade badge (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`, `D`, `E`) in real time.
   - Click `💾 Save All Marks to SQLite Database` to commit the entire class roster in a single atomic transaction.

### 💳 3. Accounts Desk & Fee Cashier
1. **Receivables Aging:** Monitor real-time fee buckets (0-7 days, 8-30 days, 31+ days overdue).
2. **Record Payment & Stamped Receipt:**
   - Click `Record Payment`.
   - Select student admission number, enter payment amount, and select method (UPI, Razorpay, Cash, Cheque, NEFT).
   - Enter bank reference / UTR number.
   - Click `Confirm Payment & Generate Stamped Receipt` to instantly produce the official branded receipt with official seal and Cashier signature block.
3. **📖 Cashier Day-Book Ledger:**
   - Review recent payment transactions in the Day-Book table showing Receipt #, Student Name, Admission Number, Amount, Payment Mode, and Reference #.
   - Click `🖨️ Re-Print Receipt` beside any past transaction to immediately re-generate and print the official stamped receipt.
4. **Transfer Certificate (TC) Guard:** Issuance of Leaving Certificates is strictly blocked if the student has pending fee dues.

### 👨‍👩‍👧 4. Parents & Guardians
1. **Attendance Tracking:** Real-time percentage verification against the mandatory CBSE 75% requirement.
2. **Fee Portal:** Check pending dues, balance clearance, and recent payment receipts.
3. **Official CBSE Report Card:** 1-click view and print of official term report cards with Part 1 Scholastic, Part 2 Co-Scholastic, and Class Teacher remarks.

---

## 5. Zero-Touch Maintenance & Self-Service Operations

Once handed over to the school, **no developer touch or ongoing vendor assistance is required**:

1. **Backups:** The school administrator can click `Create Snapshot Now` or copy the single file `data/school_india.db` to an external USB drive or cloud drive at any time.
2. **Reset/Archive:** To start a brand-new academic year without affecting old student archives, simply create a snapshot copy and archive it.
3. **Demo Data Retention:** The pre-loaded demo dataset (546 students, Grade 10A records, Day-Book collections) is preserved so staff can train new operators immediately without breaking production schemas.
4. **Network Access across School LAN:** To allow teachers and accounts staff to access the ERP from other computers on the school's local Wi-Fi / LAN, simply open `http://<SERVER_IP>:5050` from any browser on the network.

---

## 6. Verification Checklist

To re-run automated verification at any time:
```cmd
scripts\verify_unified_system.bat
```
To run the automated 16-scenario browser test suite with fresh screenshots:
```cmd
python tests\e2e\test_playwright_e2e.py
```
Both test suites should return **0 failures** and **ONLINE** status.
