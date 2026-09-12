import sys
import os
import json

# Add school_india to python path
sys.path.insert(0, os.path.abspath("product/school_india"))

from school_india.examination.evaluator import calculate_cbse_grade, compute_term_aggregate
from school_india.government_data.health_service import GovernmentDataHealthService
from school_india.api.attendance import AttendanceBatchEngine

def test_cbse_grade_scaling():
    grade, gp = calculate_cbse_grade(95.5)
    assert grade == "A1"
    assert gp == 10.0
    
    grade, gp = calculate_cbse_grade(74.0)
    assert grade == "B1"
    assert gp == 8.0
    
    grade, gp = calculate_cbse_grade(28.0)
    assert grade == "E1"
    assert gp == 0.0

def test_cbse_aggregate_evaluator():
    marks = {
        "English": (88.0, 100.0),
        "Mathematics": (95.0, 100.0),
        "Science": (91.0, 100.0),
        "Social Science": (82.0, 100.0),
        "Telugu": (84.0, 100.0)
    }
    result = compute_term_aggregate(marks)
    assert result["total_obtained"] == 440.0
    assert result["total_max"] == 500.0
    assert result["percentage"] == 88.0
    assert result["overall_grade"] == "A2"
    assert result["is_passed"] is True

def test_government_data_health_audit():
    with open("tests/vidyuth_seed_data.json", "r") as f:
        data = json.load(f)
    
    students = data["students"]
    audit = GovernmentDataHealthService.audit_student_records(students)
    assert audit["total_students_audited"] == len(students)
    assert audit["missing_pen"] == 0
    assert audit["missing_apaar"] == 0
    assert audit["government_data_readiness_score"] >= 95.0

def test_fast_attendance_engine():
    records = [
        {"student_id": "VIS-2026-0001", "status": "Present"},
        {"student_id": "VIS-2026-0002", "status": "Absent"},
        {"student_id": "VIS-2026-0003", "status": "Late"},
        {"student_id": "VIS-2026-0004", "status": "Present"}
    ]
    summary = AttendanceBatchEngine.process_fast_roll_call("Grade 10", "A", records, "EMP-1002")
    assert summary["total_students"] == 4
    assert summary["present_count"] == 2
    assert summary["absent_count"] == 1
    assert summary["late_count"] == 1
    assert summary["notifications_queued"] == 1

if __name__ == "__main__":
    test_cbse_grade_scaling()
    test_cbse_aggregate_evaluator()
    test_government_data_health_audit()
    test_fast_attendance_engine()
    print("All school_india unit and service tests PASSED successfully!")
