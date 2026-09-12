# Government Data Health Engine for Telangana Schools
# Validates UDISE+, Student PEN, and APAAR IDs

import re
from typing import List, Dict

class GovernmentDataHealthService:
    @staticmethod
    def validate_pen(pen: str) -> bool:
        """
        Permanent Education Number (PEN) format:
        Typically PEN-<StateCode: 2 digits><10 digits> e.g. PEN-361234567890
        """
        if not pen:
            return False
        pattern = r"^PEN-\d{12}$"
        return bool(re.match(pattern, pen))

    @staticmethod
    def validate_apaar(apaar: str) -> bool:
        """
        APAAR ID: 12 digit format (XXXX-XXXX-XXXX)
        """
        if not apaar:
            return False
        pattern = r"^\d{4}-\d{4}-\d{4}$"
        return bool(re.match(pattern, apaar))

    @staticmethod
    def audit_student_records(students: List[Dict]) -> Dict:
        """
        Runs comprehensive data health verification across all enrolled students.
        """
        total = len(students)
        missing_pen = 0
        invalid_pen = 0
        missing_apaar = 0
        invalid_apaar = 0
        
        seen_pens = set()
        duplicate_pens = 0
        
        for s in students:
            pen = s.get("pen_number")
            apaar = s.get("apaar_id")
            
            if not pen:
                missing_pen += 1
            elif not GovernmentDataHealthService.validate_pen(pen):
                invalid_pen += 1
            else:
                if pen in seen_pens:
                    duplicate_pens += 1
                seen_pens.add(pen)
                
            if not apaar:
                missing_apaar += 1
            elif not GovernmentDataHealthService.validate_apaar(apaar):
                invalid_apaar += 1
                
        readiness_score = ((total - (missing_pen + missing_apaar + invalid_pen + invalid_apaar + duplicate_pens)) / max(total, 1)) * 100.0
        
        return {
            "total_students_audited": total,
            "missing_pen": missing_pen,
            "invalid_pen": invalid_pen,
            "duplicate_pens": duplicate_pens,
            "missing_apaar": missing_apaar,
            "invalid_apaar": invalid_apaar,
            "government_data_readiness_score": max(0.0, round(readiness_score, 2)),
            "is_udise_export_ready": (missing_pen == 0 and duplicate_pens == 0)
        }
