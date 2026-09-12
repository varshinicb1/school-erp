"""
Authoritative PEN (Permanent Education Number) & Government Data Readiness Service

Documentation & References:
1. Ministry of Education (MoE), Government of India: UDISE+ National Portal
2. Department of School Education & Literacy (DoSEL): Student Database Management System (SDMS)
3. National Academic Depository (NAD) & APAAR guidelines:
   - PEN is a National Unique Identifier assigned to each student in India via UDISE+ portal.
   - Authoritative format: Exactly 11 numeric digits across all Indian states, issued nationally.
   - Note: There is NO official 'PEN-36...' prefix in UDISE+ database schemas. Prefixes like 'PEN-' or state prefixes are informal or proprietary artifacts.
   - Real-world school ERP verification:
     * Format validation: 11 numeric digits (National standard)
     * Checksum / Verification: No public client-side checksum algorithm is officially published by MoE. Official validation requires authorized UDISE+ API access.
"""

import re
from typing import List, Dict, Optional

class GovernmentDataReadinessService:
    @staticmethod
    def validate_pen_format(pen: Optional[str]) -> Dict[str, any]:
        """
        Validates National UDISE+ Permanent Education Number (PEN).
        Standard: 11 numeric digits.
        """
        if not pen:
            return {"valid": False, "reason": "Missing PEN", "status": "MISSING"}
        
        pen_clean = str(pen).strip()
        # Accept pure 11 digits
        if re.match(r"^\d{11}$", pen_clean):
            return {"valid": True, "clean_pen": pen_clean, "status": "FORMAT_VALID"}
        
        # If input has 'PEN' or hyphens (legacy format), detect and report
        if re.match(r"^(PEN[-_]?)?\d{11}$", pen_clean, re.IGNORECASE):
            digits = re.sub(r"\D", "", pen_clean)
            return {"valid": True, "clean_pen": digits, "status": "FORMAT_VALID_NORMALIZED"}
            
        return {
            "valid": False, 
            "reason": f"Invalid format: Expected 11 numeric digits, got '{pen}'", 
            "status": "FORMAT_INVALID"
        }

    @staticmethod
    def validate_apaar_format(apaar: Optional[str]) -> Dict[str, any]:
        """
        Validates Automated Permanent Academic Account Registry (APAAR / One Nation One Student ID).
        Standard: 12 numeric digits, conventionally formatted as XXXX-XXXX-XXXX.
        """
        if not apaar:
            return {"valid": False, "reason": "Missing APAAR ID", "status": "MISSING"}
            
        apaar_clean = str(apaar).strip()
        digits = re.sub(r"\D", "", apaar_clean)
        
        if len(digits) == 12:
            formatted = f"{digits[0:4]}-{digits[4:8]}-{digits[8:12]}"
            return {"valid": True, "clean_apaar": formatted, "status": "FORMAT_VALID"}
            
        return {
            "valid": False,
            "reason": f"Invalid format: Expected 12 numeric digits, got '{apaar}'",
            "status": "FORMAT_INVALID"
        }

    @staticmethod
    def validate_udise_school_code(udise: Optional[str]) -> Dict[str, any]:
        """
        Validates 11-digit UDISE+ School Code.
        Format: 2 digits State + 2 digits District + 2 digits Block + 3 digits Village/Town + 2 digits School
        """
        if not udise:
            return {"valid": False, "reason": "Missing UDISE+ Code", "status": "MISSING"}
        code_clean = str(udise).strip()
        if re.match(r"^\d{11}$", code_clean):
            return {"valid": True, "code": code_clean, "status": "FORMAT_VALID"}
        return {"valid": False, "reason": "UDISE+ School Code must be exactly 11 digits", "status": "FORMAT_INVALID"}

    @staticmethod
    def audit_school_readiness(students: List[Dict]) -> Dict:
        """
        Performs non-fabricated Government Data Readiness evaluation.
        Clearly distinguishes format validation from official government verification.
        """
        total = len(students)
        format_valid_pen = 0
        missing_pen = 0
        invalid_pen = 0
        duplicate_pen = 0
        
        format_valid_apaar = 0
        missing_apaar = 0
        invalid_apaar = 0
        
        seen_pens = set()
        
        for s in students:
            # Check PEN
            p_res = GovernmentDataReadinessService.validate_pen_format(s.get("pen_number"))
            if p_res["status"] == "MISSING":
                missing_pen += 1
            elif p_res["valid"]:
                clean = p_res["clean_pen"]
                if clean in seen_pens:
                    duplicate_pen += 1
                else:
                    seen_pens.add(clean)
                    format_valid_pen += 1
            else:
                invalid_pen += 1
                
            # Check APAAR
            a_res = GovernmentDataReadinessService.validate_apaar_format(s.get("apaar_id"))
            if a_res["status"] == "MISSING":
                missing_apaar += 1
            elif a_res["valid"]:
                format_valid_apaar += 1
            else:
                invalid_apaar += 1

        return {
            "total_students": total,
            "pen_metrics": {
                "format_valid": format_valid_pen,
                "missing": missing_pen,
                "invalid_format": invalid_pen,
                "duplicates": duplicate_pen,
                "official_verification_status": "OFFICIAL_API_NOT_INTEGRATED"
            },
            "apaar_metrics": {
                "format_valid": format_valid_apaar,
                "missing": missing_apaar,
                "invalid_format": invalid_apaar,
                "official_verification_status": "OFFICIAL_API_NOT_INTEGRATED"
            },
            "export_readiness": {
                "udise_plus_exportable": (missing_pen == 0 and duplicate_pen == 0 and invalid_pen == 0),
                "notes": "Format validity checked locally. Live API verification with MoE/SDMS requires official school gateway credentials."
            }
        }
