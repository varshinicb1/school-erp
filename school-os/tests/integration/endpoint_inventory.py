"""
Single source of truth for the API endpoint inventory used by the
auth/authorization contract tests.

Each entry is a dict:
  path      : URL path (may contain {adm} placeholder replaced with a real admission number)
  method    : HTTP method
  role      : minimum role required once authenticated (None = any authenticated user)
  body      : JSON body to send (None = no body)
  note      : what the endpoint touches, for failure triage
"""

def build_inventory(adm_with_dues: str, adm_clear: str) -> list:
    return [
        # ---------- GET ----------
        {"path": "/api/v1/health", "method": "GET", "role": None, "body": None, "note": "health probe (public)"},
        {"path": "/api/v1/auth/me", "method": "GET", "role": None, "body": None, "note": "session introspection"},
        {"path": "/api/v1/school/profile", "method": "GET", "role": None, "body": None, "note": "school profile"},
        {"path": "/api/v1/school/settings", "method": "GET", "role": None, "body": None, "note": "gateway settings (secrets masked)"},
        {"path": "/api/v1/summary", "method": "GET", "role": None, "body": None, "note": "dashboard summary"},
        {"path": "/api/v1/students", "method": "GET", "role": None, "body": None, "note": "student roster PII"},
        {"path": "/api/v1/attendance", "method": "GET", "role": None, "body": None, "note": "attendance stats"},
        {"path": f"/api/v1/tc/validate/{adm_with_dues}", "method": "GET", "role": None, "body": None, "note": "TC clearance check"},
        {"path": f"/api/v1/report-card/{adm_clear}", "method": "GET", "role": None, "body": None, "note": "official report card"},
        {"path": "/api/v1/fees/receipts", "method": "GET", "role": None, "body": None, "note": "fee ledger"},
        {"path": "/api/v1/marks/class", "method": "GET", "role": None, "body": None, "note": "marks roster"},
        {"path": "/api/v1/backup/list", "method": "GET", "role": None, "body": None, "note": "backup listing"},
        {"path": "/api/v1/backup/download", "method": "GET", "role": "Admin", "body": None, "note": "FULL DATABASE DOWNLOAD"},

        # ---------- POST ----------
        {"path": "/api/v1/auth/login", "method": "POST", "role": None,
         "body": {"username": "admin", "password": "admin123"}, "note": "credential login (public)"},
        {"path": "/api/v1/auth/logout", "method": "POST", "role": None, "body": None, "note": "logout (public)"},
        {"path": "/api/v1/attendance/submit", "method": "POST", "role": None,
         "body": {"class": "Grade 10", "section": "A", "records": []}, "note": "attendance write"},
        {"path": "/api/v1/import/students", "method": "POST", "role": None,
         "body": {"rows": [], "commit": False}, "note": "bulk import write"},
        {"path": "/api/v1/backup/create", "method": "POST", "role": None, "body": None, "note": "backup write"},
        {"path": "/api/v1/fees/collect", "method": "POST", "role": None,
         "body": {"admission_number": adm_clear, "amount": 1.0, "payment_mode": "Cash"}, "note": "money-moving write"},
        {"path": "/api/v1/marks/submit", "method": "POST", "role": None,
         "body": {"class": "Grade 10", "section": "A", "subject": "Mathematics", "examination": "PT1", "marks": []},
         "note": "grades write"},

        # ---------- PUT ----------
        {"path": "/api/v1/school/profile", "method": "PUT", "role": None,
         "body": {"principal_name": "Integration Test"}, "note": "profile write"},
        {"path": "/api/v1/school/settings", "method": "PUT", "role": None,
         "body": {"sms_sender_id": "INTEG"}, "note": "gateway credential write"},
    ]
