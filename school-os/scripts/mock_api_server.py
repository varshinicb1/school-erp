"""
Local HTTP API Server for School OS & CampusGrid
Bridges the synthetic database (tests/vidyuth_seed_data.json) to CampusGrid frontend over real HTTP REST endpoints.
Supports:
- GET /api/v1/summary
- GET /api/v1/students?query=...
- GET /api/v1/attendance
- POST /api/v1/attendance/submit
- GET /api/v1/health
"""

import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tests", "vidyuth_seed_data.json"))

def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

class SchoolApiHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        parsed = urlparse(self.path)
        data = load_data()

        if parsed.path == "/api/v1/health":
            self._set_headers(200)
            self.wfile.write(json.dumps({"status": "ONLINE", "school": data["school"]["name"]}).encode("utf-8"))
            return

        elif parsed.path == "/api/v1/summary":
            students = data["students"]
            paid_count = sum(1 for s in students if s["fee_status"] == "Paid")
            pending_total = sum(s["outstanding_amount"] for s in students)
            
            res = {
                "school_name": data["school"]["name"],
                "academic_year": data["school"]["academic_year"],
                "total_students": len(students),
                "total_staff": len(data["staff"]),
                "fee_receivables": f"₹{pending_total:,}",
                "roll_call_pct": "94.2%",
                "open_staff_cover": 4
            }
            self._set_headers(200)
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        elif parsed.path == "/api/v1/students":
            params = parse_qs(parsed.query)
            q = params.get("query", [""])[0].lower()
            students = data["students"]
            if q:
                students = [s for s in students if q in s["student_name"].lower() or q in s["admission_number"].lower() or q in s["class"].lower() or q in s["fee_status"].lower()]
            
            # Return up to 50 records
            self._set_headers(200)
            self.wfile.write(json.dumps(students[:50]).encode("utf-8"))
            return

        elif parsed.path == "/api/v1/attendance":
            # Grade-wise summary
            rows = [
                {"grade": "Grade 6", "sections": 3, "submitted": 3, "absent": 12, "late": 4, "rate": 96},
                {"grade": "Grade 7", "sections": 3, "submitted": 3, "absent": 18, "late": 6, "rate": 92},
                {"grade": "Grade 8", "sections": 3, "submitted": 2, "absent": 24, "late": 9, "rate": 88},
                {"grade": "Grade 9", "sections": 3, "submitted": 3, "absent": 14, "late": 5, "rate": 94},
                {"grade": "Grade 10", "sections": 3, "submitted": 3, "absent": 16, "late": 7, "rate": 93}
            ]
            self._set_headers(200)
            self.wfile.write(json.dumps(rows).encode("utf-8"))
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/v1/attendance/submit":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            payload = json.loads(body.decode("utf-8"))
            
            # Record submission in outbox / log
            outbox_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backups", "communication_outbox"))
            os.makedirs(outbox_dir, exist_ok=True)
            with open(os.path.join(outbox_dir, f"attendance_{payload.get('class')}_{payload.get('section')}.json"), "w") as f:
                json.dump(payload, f, indent=2)

            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "SUCCESS", 
                "message": f"Roll-call saved for {payload.get('class')} {payload.get('section')}",
                "notifications_queued": len(payload.get("absentees", []))
            }).encode("utf-8"))
            return

        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

def run_server(port=5050):
    server = HTTPServer(("127.0.0.1", port), SchoolApiHandler)
    print(f"School OS Live API Server running on http://127.0.0.1:{port}")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
