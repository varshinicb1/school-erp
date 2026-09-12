# Baseline Stack Versions & Release Manifest

> Generated: 2026-09-12  
> Target Site: `school.localhost`

## 1. Operating System & Core Runtimes
- **Host OS:** Windows (with Docker / WSL2 Linux container engine)
- **Container Base OS:** Debian GNU/Linux 12 (Bookworm)
- **Python Version:** Python 3.12+ (upstream Frappe v16 core target)
- **Node.js Version:** Node.js v22.19.0 LTS (with Yarn / npm)
- **Database:** MariaDB 10.11 / 11.4 LTS (utf8mb4, Barracuda)
- **In-Memory Store:** Redis 7.2 (Cache: 6379, Queue: 6380)

## 2. Pinned Upstream Repositories
| Application | Upstream URL | Branch | Tag | Commit Hash |
| :--- | :--- | :--- | :--- | :--- |
| **frappe** | github.com/frappe/frappe | version-16 | v16.33.1 | `988e54f` |
| **erpnext** | github.com/frappe/erpnext | version-16 | v16.34.2 | `4048fb7` |
| **education** | github.com/frappe/education | version-16 | *(latest)* | `22e0910` |
| **hrms** | github.com/frappe/hrms | version-16 | v16.18.1 | `a4768b4` |
| **payments** | github.com/frappe/payments | version-16 | *(latest)* | `cca07d9` |
| **india-compliance** | github.com/resilient-tech/india-compliance | version-16 | *(latest)* | `b185f40` |
| **gibbon** | github.com/GibbonEdu/core | master | v30.0.00 | `2e0868f` |
| **opensis-classic** | github.com/OS4ED/openSIS-Classic | master | v10.3 | `d763a8e` |
