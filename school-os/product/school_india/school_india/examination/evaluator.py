# Indian Examination Result & CCE Grade Calculator
from typing import Dict, Tuple

def calculate_cbse_grade(percentage: float) -> Tuple[str, float]:
    """
    CBSE 9-Point Grading Scale:
    91-100 -> A1 (10.0)
    81-90  -> A2 (9.0)
    71-80  -> B1 (8.0)
    61-70  -> B2 (7.0)
    51-60  -> C1 (6.0)
    41-50  -> C2 (5.0)
    33-40  -> D  (4.0)
    21-32  -> E1 (Fail)
    0-20   -> E2 (Fail)
    """
    if percentage >= 91.0:
        return ("A1", 10.0)
    elif percentage >= 81.0:
        return ("A2", 9.0)
    elif percentage >= 71.0:
        return ("B1", 8.0)
    elif percentage >= 61.0:
        return ("B2", 7.0)
    elif percentage >= 51.0:
        return ("C1", 6.0)
    elif percentage >= 41.0:
        return ("C2", 5.0)
    elif percentage >= 33.0:
        return ("D", 4.0)
    elif percentage >= 21.0:
        return ("E1", 0.0)
    else:
        return ("E2", 0.0)

def compute_term_aggregate(subjects_marks: Dict[str, Tuple[float, float]]) -> Dict:
    """
    Computes total obtained, total maximum, percentage, and overall grade point.
    Input format: {"Subject": (obtained, max_marks)}
    """
    total_obtained = sum(m[0] for m in subjects_marks.values())
    total_max = sum(m[1] for m in subjects_marks.values())
    percentage = (total_obtained / total_max) * 100.0 if total_max > 0 else 0.0
    grade, grade_point = calculate_cbse_grade(percentage)
    
    subject_results = {}
    for sub, (obt, max_m) in subjects_marks.items():
        sub_pct = (obt / max_m) * 100.0 if max_m > 0 else 0.0
        sub_grade, sub_gp = calculate_cbse_grade(sub_pct)
        subject_results[sub] = {
            "obtained": obt,
            "max": max_m,
            "percentage": round(sub_pct, 2),
            "grade": sub_grade,
            "grade_point": sub_gp
        }
        
    return {
        "total_obtained": total_obtained,
        "total_max": total_max,
        "percentage": round(percentage, 2),
        "overall_grade": grade,
        "grade_point": grade_point,
        "is_passed": percentage >= 33.0,
        "subject_breakdown": subject_results
    }
