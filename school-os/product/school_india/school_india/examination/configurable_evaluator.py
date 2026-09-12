"""
Configurable Multi-Board Grading Engine

Supports:
1. CBSE Secondary (Class IX-X): 9-point absolute marks band or relative positional grading
2. CBSE Primary/Middle (Class I-VIII): 8-point / 5-point grading or descriptive indicators
3. Telangana State Board (SSC): 7-point GPA grading scale (Grade A1 to E)
4. Co-Scholastic: 3-point scale (A=Outstanding, B=Very Good, C=Fair) or 5-point scale
5. Higher Secondary: Marks + Pass/Fail + Grace Marks policy
6. Versioned schemes: Board, Year, Class, Subject Category
"""

from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field

class GradeBand(BaseModel):
    grade: str
    min_percentage: float
    max_percentage: float
    grade_point: float
    description: str
    is_pass: bool = True

class GradingScheme(BaseModel):
    scheme_id: str
    board: str
    version: str
    applicable_classes: List[str]
    assessment_type: str # 'SCHOLASTIC', 'CO_SCHOLASTIC', 'PRACTICAL'
    bands: List[GradeBand]
    grace_marks_policy: Optional[Dict[str, Any]] = None

# Default Authoritative Schemes
CBSE_SECONDARY_SCHEME = GradingScheme(
    scheme_id="CBSE_SEC_2026_V1",
    board="CBSE",
    version="2026.1",
    applicable_classes=["Class 9", "Class 10", "Grade 9", "Grade 10"],
    assessment_type="SCHOLASTIC",
    bands=[
        GradeBand(grade="A1", min_percentage=91.0, max_percentage=100.0, grade_point=10.0, description="Top 1/8th of passed candidates / 91-100%"),
        GradeBand(grade="A2", min_percentage=81.0, max_percentage=90.99, grade_point=9.0, description="Next 1/8th / 81-90%"),
        GradeBand(grade="B1", min_percentage=71.0, max_percentage=80.99, grade_point=8.0, description="Next 1/8th / 71-80%"),
        GradeBand(grade="B2", min_percentage=61.0, max_percentage=70.99, grade_point=7.0, description="Next 1/8th / 61-70%"),
        GradeBand(grade="C1", min_percentage=51.0, max_percentage=60.99, grade_point=6.0, description="Next 1/8th / 51-60%"),
        GradeBand(grade="C2", min_percentage=41.0, max_percentage=50.99, grade_point=5.0, description="Next 1/8th / 41-50%"),
        GradeBand(grade="D", min_percentage=33.0, max_percentage=40.99, grade_point=4.0, description="Next 1/8th / 33-40%"),
        GradeBand(grade="E1", min_percentage=21.0, max_percentage=32.99, grade_point=0.0, description="Essential Repeat / Compartment", is_pass=False),
        GradeBand(grade="E2", min_percentage=0.0, max_percentage=20.99, grade_point=0.0, description="Failed", is_pass=False),
    ]
)

TELANGANA_SSC_SCHEME = GradingScheme(
    scheme_id="TS_SSC_2026_V1",
    board="Telangana State Board",
    version="2026.1",
    applicable_classes=["Class 10", "Grade 10"],
    assessment_type="SCHOLASTIC",
    bands=[
        GradeBand(grade="A1", min_percentage=90.0, max_percentage=100.0, grade_point=10.0, description="Outstanding"),
        GradeBand(grade="A2", min_percentage=80.0, max_percentage=89.99, grade_point=9.0, description="Excellent"),
        GradeBand(grade="B1", min_percentage=70.0, max_percentage=79.99, grade_point=8.0, description="Good"),
        GradeBand(grade="B2", min_percentage=60.0, max_percentage=69.99, grade_point=7.0, description="Above Average"),
        GradeBand(grade="C1", min_percentage=50.0, max_percentage=59.99, grade_point=6.0, description="Average"),
        GradeBand(grade="C2", min_percentage=40.0, max_percentage=49.99, grade_point=5.0, description="Below Average"),
        GradeBand(grade="D", min_percentage=35.0, max_percentage=39.99, grade_point=4.0, description="Pass (TS State min 35%)"),
        GradeBand(grade="E", min_percentage=0.0, max_percentage=34.99, grade_point=0.0, description="Fail", is_pass=False),
    ]
)

CO_SCHOLASTIC_3POINT_SCHEME = GradingScheme(
    scheme_id="CO_SCHOLASTIC_3PT_V1",
    board="Universal",
    version="1.0",
    applicable_classes=["All"],
    assessment_type="CO_SCHOLASTIC",
    bands=[
        GradeBand(grade="A", min_percentage=70.0, max_percentage=100.0, grade_point=3.0, description="Outstanding"),
        GradeBand(grade="B", min_percentage=40.0, max_percentage=69.99, grade_point=2.0, description="Very Good"),
        GradeBand(grade="C", min_percentage=0.0, max_percentage=39.99, grade_point=1.0, description="Fair"),
    ]
)

class ConfigurableEvaluationEngine:
    def __init__(self, custom_schemes: Optional[Dict[str, GradingScheme]] = None):
        self.schemes: Dict[str, GradingScheme] = {
            "CBSE_SECONDARY": CBSE_SECONDARY_SCHEME,
            "TELANGANA_SSC": TELANGANA_SSC_SCHEME,
            "CO_SCHOLASTIC_3PT": CO_SCHOLASTIC_3POINT_SCHEME
        }
        if custom_schemes:
            self.schemes.update(custom_schemes)

    def evaluate_percentage(self, percentage: float, scheme_key: str = "CBSE_SECONDARY") -> Tuple[str, float, bool, str]:
        scheme = self.schemes.get(scheme_key, CBSE_SECONDARY_SCHEME)
        pct = max(0.0, min(100.0, percentage))
        for band in scheme.bands:
            if band.min_percentage <= pct <= band.max_percentage:
                return band.grade, band.grade_point, band.is_pass, band.description
        last_band = scheme.bands[-1]
        return last_band.grade, last_band.grade_point, last_band.is_pass, last_band.description

    def evaluate_student_results(
        self, 
        subjects_marks: Dict[str, Tuple[float, float]], 
        scheme_key: str = "CBSE_SECONDARY",
        grace_marks_available: float = 0.0
    ) -> Dict[str, Any]:
        """
        subjects_marks: {"Subject": (obtained, max_marks)}
        """
        total_obtained = sum(m[0] for m in subjects_marks.values())
        total_max = sum(m[1] for m in subjects_marks.values())
        overall_pct = (total_obtained / total_max) * 100.0 if total_max > 0 else 0.0
        
        subject_breakdown = {}
        all_passed = True
        
        for sub, (obt, max_m) in subjects_marks.items():
            sub_pct = (obt / max_m) * 100.0 if max_m > 0 else 0.0
            grade, gp, is_pass, desc = self.evaluate_percentage(sub_pct, scheme_key)
            if not is_pass:
                all_passed = False
            subject_breakdown[sub] = {
                "obtained": obt,
                "maximum": max_m,
                "percentage": round(sub_pct, 2),
                "grade": grade,
                "grade_point": gp,
                "is_passed": is_pass
            }
            
        ov_grade, ov_gp, ov_pass, ov_desc = self.evaluate_percentage(overall_pct, scheme_key)
        
        return {
            "scheme_used": scheme_key,
            "total_obtained": total_obtained,
            "total_maximum": total_max,
            "percentage": round(overall_pct, 2),
            "overall_grade": ov_grade,
            "overall_grade_point": ov_gp,
            "is_passed": (all_passed and ov_pass),
            "subject_breakdown": subject_breakdown
        }
