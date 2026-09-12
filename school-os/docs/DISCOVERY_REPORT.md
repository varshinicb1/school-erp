# Discovery Report — Indian School ERP (Phase 0)

> **Date:** 2026-09-12  
> **Status:** Completed  
> **Target Production Base:** Frappe / ERPNext Version-16 Stack  

---

## 1. Executive Summary

Phase 0 Discovery evaluated all primary, secondary, and reference repositories required by the **Master Build Prompt**. All 9 primary and reference codebases have been cloned into `school-os/upstream-reference/`.

We verified:
1. Core Frappe stack compatibility on `version-16`.
2. Python, Node, MariaDB, and Redis version prerequisites.
3. Secondary application suitability (`india-compliance`, `frappe-lms`, `insights`, `raven`).
4. Architecture and workflow patterns in reference school ERPs (`Gibbon`, `openSIS-Classic`).

---

## 2. Cloned Repositories Inventory & Git Commit Pins

| Category | Repository | Cloned Branch | Tag / Version | Commit Hash | Upstream URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Stack** | `frappe` | `version-16` | `v16.33.1` | `988e54f` | https://github.com/frappe/frappe |
| **Primary Stack** | `erpnext` | `version-16` | `v16.34.2` | `4048fb7` | https://github.com/frappe/erpnext |
| **Primary Stack** | `education` | `version-16` | *(un-tagged)* | `22e0910` | https://github.com/frappe/education |
| **Primary Stack** | `hrms` | `version-16` | `v16.18.1` | `a4768b4` | https://github.com/frappe/hrms |
| **Primary Stack** | `payments` | `version-16` | *(un-tagged)* | `cca07d9` | https://github.com/frappe/payments |
| **Secondary Stack** | `india-compliance`| `version-16` | *(un-tagged)* | `b185f40` | https://github.com/resilient-tech/india-compliance |
| **Secondary Stack** | `frappe-lms` | `main` | *(un-tagged)* | `87168fc` | https://github.com/frappe/lms |
| **Secondary Stack** | `insights` | `main` | *(un-tagged)* | `06f1577` | https://github.com/frappe/insights |
| **Secondary Stack** | `raven` | `main` | *(un-tagged)* | `577227d` | https://github.com/The-Commit-Company/raven |
| **Reference SIS** | `gibbon` (core) | `v30.0.00` | `v30.0.00` | `2e0868f` | https://github.com/GibbonEdu/core |
| **Reference SIS** | `opensis-classic`| `master` | `v10.3` | `d763a8e` | https://github.com/OS4ED/openSIS-Classic |

---

## 3. Dependency & Compatibility Matrix

### 3.1 Python & Framework Compatibility

| App | `requires-python` | Frappe Dependency Pin | ERPNext Dependency Pin | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **frappe** | `>=3.14,<3.15` (tool.frappix uses 3.12) | Core | - | Python 3.12/3.14 compatibility tested upstream |
| **erpnext** | `>=3.14` | `>=16.21.0,<17.0.0` | Core | Matches frappe v16.33.1 |
| **education**| `>=3.10` | `>=16.0.0,<17.0.0` | Compatible | Clean integration |
| **hrms** | `>=3.10` | `>=16.0.0,<17.0.0` | `>=16.0.0,<17.0.0` | Matches both |
| **payments** | `>=3.14` | `>=16.0.0,<17.0.0` | Compatible | Razorpay, Stripe, Paytm included |
| **india-compliance** | Compatible | `>=16.0.0,<17.0.0` | Compatible | Tested for v16 GST / TDS flows |

---

## 4. Reference SIS Structural Analysis

### 4.1 Gibbon (PHP/MySQL)
- **Strengths:** Excellent timetable conflict checking, teacher substitution logging, parent-student-guardian relationships, tracking attendance by period/session.
- **Takeaway for `school_india`:** Model student attendance with period-wise roll call and teacher workload allocation matching Gibbon's TT engine.

### 4.2 openSIS-Classic (PHP/PostgreSQL/MySQL)
- **Strengths:** Standardized American/International SIS gradebook calculation (weighted marks, custom grading scales, GPA/marks cards, transcripts, student medical and demographics records).
- **Takeaway for `school_india`:** Implement dynamic assessment schemes supporting FA (Formative Assessment), SA (Summative Assessment), and CBSE CCE tables.

---

## 5. Next Phase Approval

Phase 0 discovery is complete. The stack is clean, mutually compatible on `version-16`, and ready for infrastructure orchestration (Phase 1).
