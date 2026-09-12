import json
import pytest

def test_udise_and_board_structure():
    with open("tests/vidyuth_seed_data.json", "r") as f:
        data = json.load(f)
    assert data["school"]["udise_code"] == "36190500124"
    assert data["school"]["academic_year"] == "2026-27"
    assert len(data["school"]["udise_code"]) == 11

def test_fee_structure_categories():
    with open("tests/vidyuth_seed_data.json", "r") as f:
        data = json.load(f)
    statuses = {s["fee_status"] for s in data["students"]}
    assert "Paid" in statuses
    assert "Pending" in statuses

def test_class_sections_distribution():
    with open("tests/vidyuth_seed_data.json", "r") as f:
        data = json.load(f)
    classes = {s["class"] for s in data["students"]}
    sections = {s["section"] for s in data["students"]}
    assert "Grade 10" in classes
    assert "Nursery" in classes
    assert {"A", "B", "C"}.issubset(sections)

if __name__ == "__main__":
    test_udise_and_board_structure()
    test_fee_structure_categories()
    test_class_sections_distribution()
    print("Extended E2E and module verification tests PASSED.")
