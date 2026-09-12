import sys
import os

sys.path.insert(0, os.path.abspath("product/school_india"))

from school_india.fees.doctype.school_fee_policy.school_fee_policy import SchoolFeePolicy
from school_india.migration.importer import StudentMigrationImporter

def test_fee_policy_discount_calculation():
    policy = SchoolFeePolicy()
    policy.concession_type = "Percentage Discount"
    policy.discount_percentage = 25.0
    effective = policy.calculate_effective_fee(50000.0)
    assert effective == 37500.0

def test_migration_importer_validation():
    csv_valid = """admission_number,student_name,class,section,guardian_name,guardian_phone
VIS-001,Aarav Reddy,Grade 10,A,Suresh Reddy,9849012345
VIS-002,Diya Sharma,Grade 9,B,Ramesh Sharma,+91 9701012345
"""
    valid, errors = StudentMigrationImporter.validate_and_parse(csv_valid)
    assert len(valid) == 2
    assert len(errors) == 0

def test_migration_importer_catches_invalid_rows():
    csv_invalid = """admission_number,student_name,class,section,guardian_name,guardian_phone
,Aarav Reddy,Grade 10,A,Suresh Reddy,12345
"""
    valid, errors = StudentMigrationImporter.validate_and_parse(csv_invalid)
    assert len(valid) == 0
    assert len(errors) == 1
    assert "Admission Number is missing" in errors[0]["errors"]

if __name__ == "__main__":
    test_fee_policy_discount_calculation()
    test_migration_importer_validation()
    test_migration_importer_catches_invalid_rows()
    print("Extended School India (Fees & Migration) assertions PASSED successfully!")
