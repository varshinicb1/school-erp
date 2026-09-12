import json
import pytest

def test_seed_dataset_integrity():
    with open("tests/vidyuth_seed_data.json", "r") as f:
        data = json.load(f)
    
    assert data["school"]["name"] == "Vidyuth International School"
    assert data["school"]["board"] == "CBSE"
    assert data["school"]["state"] == "Telangana"
    assert len(data["students"]) >= 500
    assert len(data["staff"]) >= 50
    assert len(data["guardians"]) >= 500

def test_student_government_identifiers():
    with open("tests/vidyuth_seed_data.json", "r") as f:
        data = json.load(f)
        
    for student in data["students"][:20]:
        assert "pen_number" in student
        assert student["pen_number"].startswith("PEN-36") # Telangana PEN prefix
        assert "apaar_id" in student
        assert len(student["apaar_id"]) == 14 # XXXX-XXXX-XXXX format

def test_staff_roles_coverage():
    with open("tests/vidyuth_seed_data.json", "r") as f:
        data = json.load(f)
        
    roles = {s["designation"] for s in data["staff"]}
    assert "Teacher" in roles
    assert "Principal" in roles
    assert "Accountant" in roles

if __name__ == "__main__":
    test_seed_dataset_integrity()
    test_student_government_identifiers()
    test_staff_roles_coverage()
    print("All baseline validation assertions PASSED.")
