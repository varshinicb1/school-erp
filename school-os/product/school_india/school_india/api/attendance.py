# Fast Mobile Attendance API (<20s per class)
from typing import List, Dict
import datetime

class AttendanceBatchEngine:
    @staticmethod
    def process_fast_roll_call(academic_class: str, section: str, attendance_records: List[Dict], marked_by: str) -> Dict:
        """
        Takes roll call submission:
        attendance_records: [{"student_id": "VIS-...", "status": "Present"|"Absent"|"Late"}]
        Returns summary and notifications to fire.
        """
        now = datetime.datetime.now().isoformat()
        total = len(attendance_records)
        present = sum(1 for r in attendance_records if r.get("status") == "Present")
        absent = sum(1 for r in attendance_records if r.get("status") == "Absent")
        late = sum(1 for r in attendance_records if r.get("status") == "Late")
        
        absentee_alerts = [
            {
                "student_id": r["student_id"],
                "alert_channel": "SMS_WHATSAPP",
                "message": f"Dear Parent, your ward {r['student_id']} was marked Absent today ({now[:10]})."
            }
            for r in attendance_records if r.get("status") == "Absent"
        ]
        
        return {
            "batch_id": f"ATT-{academic_class}-{section}-{now[:10]}",
            "class": academic_class,
            "section": section,
            "timestamp": now,
            "marked_by": marked_by,
            "total_students": total,
            "present_count": present,
            "absent_count": absent,
            "late_count": late,
            "attendance_rate_pct": round((present / total) * 100.0, 1) if total > 0 else 0,
            "notifications_queued": len(absentee_alerts),
            "alerts": absentee_alerts
        }
