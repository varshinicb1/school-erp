# Enterprise Frappe & ERPNext Integration Architecture Guide

**Platform:** Vidyuth OS / Indian School OS  
**Target Backend:** Frappe Framework v15 (LTS) + ERPNext v15 + Frappe Education  
**Database:** MariaDB 10.11 InnoDB (Enterprise Barracuda, utf8mb4)  
**Security Standard:** DPDP Act 2023 (Digital Personal Data Protection) Compliant  

---

## 1. System Architecture

```
                                  CAMPUSGRID REACT SPA
                   (Principal, Teacher, Accounts, Parent Portals)
                                         │
                         HTTPS / TLS 1.3 │ Token & Session Auth
                                         ▼
                             FRAPPE REVERSE PROXY / NGINX
                                         │
                                         ▼
                            FRAPPE FRAMEWORK v15 (LTS)
            ┌────────────────────────────┼────────────────────────────┐
            ▼                            ▼                            ▼
      ERPNEXT v15                FRAPPE EDUCATION           INDIA COMPLIANCE
   (Accounts, Billing,         (Student Lifecycle,       (GST E-Invoicing, HSN/SAC,
    Payroll, Assets)           Admissions, Exams)             Statutory Books)
            │                            │                            │
            └────────────────────────────┼────────────────────────────┘
                                         │
                                         ▼
                              CUSTOM APP: school_india
                     • CBSE 9-Point & Telangana SSC Grading Engine
                     • MoE UDISE+ & 11-digit PEN / APAAR Validation
                     • SMS & WhatsApp Cloud Gateway Adapters
                     • Rapid Roll-Call Batch Engine (<20s)
                                         │
                         ┌───────────────┴───────────────┐
                         ▼                               ▼
                 MARIADB 10.11                     REDIS 7 CLUSTER
           (Persistent ACID Storage)            (Cache, Queue & SocketIO)
```

---

## 2. DocType Mapping (Zero Fake Data / Enterprise Standards)

| CampusGrid Feature | Upstream Frappe / ERPNext DocType | Module |
| :--- | :--- | :--- |
| **Student Roster** | `Student` | Education |
| **Parent / Guardian** | `Guardian` | Education |
| **Admissions** | `Student Applicant` | Education |
| **Classes & Sections** | `Student Group` & `Program Enrollment` | Education |
| **Daily Attendance** | `Student Attendance` | Education |
| **Class Timetable** | `Course Schedule` | Education |
| **Periodic Tests / Exams** | `Assessment Plan` & `Assessment Result` | Education |
| **CBSE Report Card** | `Student Report Card` | Education |
| **Fee Structure** | `Fee Category` & `Fee Structure` | Education / Accounts |
| **Fee Invoicing & Receipts** | `Fees` & `Sales Invoice` | Education / ERPNext |
| **Staff & Teachers** | `Instructor` & `Employee` | Education / HRMS |
| **UDISE+ & APAAR Data** | Custom Fields on `Student` (`pen_number`, `apaar_id`) | school_india |

---

## 3. Host Deployment Options

### Option 3A: Local / Staging via Docker Compose

1. **Prerequisite**: Ensure Docker Desktop or Docker Engine is running on your host.
2. In `school-os/infrastructure/`, run:
   ```bash
   docker compose up -d
   ```
3. Initialize the school bench site:
   ```bash
   docker compose exec backend bench new-site vidyuth.local \
     --db-root-password admin \
     --admin-password StrongAdminPassword2026! \
     --install-app erpnext \
     --install-app education
   ```
4. Install the custom Indian School extension:
   ```bash
   docker compose exec backend bench get-app school_india /app/school-os/product/school_india
   docker compose exec backend bench --site vidyuth.local install-app school_india
   ```

---

### Option 3B: Production Cloud VPS (Recommended for Live Pilot)

For a live school with 500+ students and commercial fee processing, deploy to an **Ubuntu 24.04 LTS VPS** (e.g. AWS EC2 `t3.medium` in Mumbai `ap-south-1` or DigitalOcean 4GB Droplet in Bangalore):

1. **System packages**:
   ```bash
   sudo apt update && sudo apt install -y python3-dev python3-pip python3-venv \
     mariadb-server mariadb-client redis-server git curl nginx supervisor
   ```

2. **Configure MariaDB** (`/etc/mysql/mariadb.conf.d/50-server.cnf`):
   ```ini
   [mysqld]
   character-set-server = utf8mb4
   collation-server = utf8mb4_unicode_ci
   innodb-file-format = Barracuda
   innodb-file-per-table = 1
   innodb-large-prefix = 1
   ```
   Restart MariaDB: `sudo systemctl restart mariadb`

3. **Install Frappe Bench**:
   ```bash
   pip3 install frappe-bench
   bench init --frappe-branch version-15 frappe-bench
   cd frappe-bench
   ```

4. **Install Apps**:
   ```bash
   bench get-app --branch version-15 erpnext
   bench get-app --branch version-15 education
   bench get-app --branch version-15 india_compliance https://github.com/resilient-tech/india-compliance.git
   ```

5. **Create Production Site & Enable Production Mode**:
   ```bash
   bench new-site erp.vidyuth.in --install-app erpnext --install-app education --install-app india_compliance
   sudo bench setup production $(whoami)
   ```

---

## 4. Headless API Bridge (Connecting CampusGrid UI)

CampusGrid communicates with Frappe via authenticated REST calls:

- **Login**: `POST /api/method/login` with `usr` and `pwd`. Frappe returns session cookie `sid`.
- **User Profile**: `GET /api/method/frappe.auth.get_logged_user`
- **Students**: `GET /api/resource/Student`
- **Attendance Batch**: `POST /api/method/school_india.api.attendance.process_fast_roll_call`
- **Fee Receipt**: `POST /api/resource/Fees`

