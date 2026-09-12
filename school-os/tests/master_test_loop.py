"""
School OS Master Test Loop Runner
Executes all unit, functional, RBAC, API, and migration validation suites in a continuous assertion loop.
"""

import sys
import os

# Add paths
sys.path.insert(0, os.path.abspath("."))
sys.path.insert(0, os.path.abspath("tests"))

def run_full_suite():
    import test_baseline_data as t1
    import test_e2e_scenarios as t2
    import test_school_india_services as t3
    import test_extended_school_india as t4
    import test_audit_corrections as t5
    import test_persona_security as t6
    import test_notification_gateway as t7
    
    t1.test_seed_dataset_integrity()
    t1.test_student_government_identifiers()
    t1.test_staff_roles_coverage()
    
    t2.test_udise_and_board_structure()
    t2.test_fee_structure_categories()
    t2.test_class_sections_distribution()
    
    t3.test_cbse_grade_scaling()
    t3.test_cbse_aggregate_evaluator()
    t3.test_government_data_health_audit()
    t3.test_fast_attendance_engine()
    
    t4.test_fee_policy_discount_calculation()
    t4.test_migration_importer_validation()
    t4.test_migration_importer_catches_invalid_rows()
    
    t5.test_pen_format_validation()
    t5.test_apaar_format_validation()
    t5.test_multi_board_configurable_grading()
    
    t6.test_persona_privilege_escalation_fails()
    t6.test_parent_cannot_enter_marks_or_view_staff_reports()
    t6.test_unauthenticated_request_rejected()
    
    t7.test_notification_enqueued_as_queue_ready()
    t7.test_invalid_phone_rejected()
    t7.test_outbox_file_persisted()
    
    print("=== [LOOP COMPLETE] All 21 core assertions passed across all 7 test suites! ===")

if __name__ == "__main__":
    run_full_suite()
