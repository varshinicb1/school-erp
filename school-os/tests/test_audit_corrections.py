import sys
import os

sys.path.insert(0, os.path.abspath("product/school_india"))

from school_india.government_data.readiness_service import GovernmentDataReadinessService
from school_india.examination.configurable_evaluator import ConfigurableEvaluationEngine

def test_pen_format_validation():
    # Valid 11-digit national PEN
    res = GovernmentDataReadinessService.validate_pen_format("36190500123")
    assert res["valid"] is True
    assert res["clean_pen"] == "36190500123"

    # Normalized legacy PEN
    res2 = GovernmentDataReadinessService.validate_pen_format("PEN-36190500123")
    assert res2["valid"] is True
    assert res2["clean_pen"] == "36190500123"

    # Invalid length (e.g. 10 digits or 13 digits)
    res_inv = GovernmentDataReadinessService.validate_pen_format("1234567890")
    assert res_inv["valid"] is False
    assert res_inv["status"] == "FORMAT_INVALID"

def test_apaar_format_validation():
    # Valid 12 digits
    res = GovernmentDataReadinessService.validate_apaar_format("123456789012")
    assert res["valid"] is True
    assert res["clean_apaar"] == "1234-5678-9012"

    # Hyphenated input
    res2 = GovernmentDataReadinessService.validate_apaar_format("1234-5678-9012")
    assert res2["valid"] is True

    # Invalid
    assert GovernmentDataReadinessService.validate_apaar_format("123")["valid"] is False

def test_multi_board_configurable_grading():
    engine = ConfigurableEvaluationEngine()
    
    # 1. CBSE Secondary (Min pass 33%)
    grade, gp, is_pass, _ = engine.evaluate_percentage(34.0, "CBSE_SECONDARY")
    assert grade == "D"
    assert is_pass is True

    # 2. Telangana SSC (Min pass 35%, Grade D)
    grade_ts, gp_ts, is_pass_ts, _ = engine.evaluate_percentage(34.0, "TELANGANA_SSC")
    assert grade_ts == "E"
    assert is_pass_ts is False # 34% fails in Telangana Board where passing mark is 35%

    grade_ts_pass, _, is_pass_36, _ = engine.evaluate_percentage(36.0, "TELANGANA_SSC")
    assert grade_ts_pass == "D"
    assert is_pass_36 is True

    # 3. Co-Scholastic 3-point
    grade_cs, gp_cs, _, _ = engine.evaluate_percentage(85.0, "CO_SCHOLASTIC_3PT")
    assert grade_cs == "A"
    assert gp_cs == 3.0

if __name__ == "__main__":
    test_pen_format_validation()
    test_apaar_format_validation()
    test_multi_board_configurable_grading()
    print("All authoritative PEN, APAAR, and multi-board grading tests PASSED successfully!")
