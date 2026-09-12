import csv
import io
import re
from typing import List, Dict, Tuple

class StudentMigrationImporter:
    REQUIRED_COLUMNS = ["admission_number", "student_name", "class", "section", "guardian_name", "guardian_phone"]

    @staticmethod
    def validate_and_parse(csv_content: str) -> Tuple[List[Dict], List[Dict]]:
        """
        Parses legacy CSV export and returns: (valid_records, errors)
        Never silently skips corrupted or missing rows.
        """
        reader = csv.DictReader(io.StringIO(csv_content))
        valid_records = []
        errors = []
        
        # Check header
        if not reader.fieldnames or not all(col in reader.fieldnames for col in StudentMigrationImporter.REQUIRED_COLUMNS):
            missing = [c for c in StudentMigrationImporter.REQUIRED_COLUMNS if not reader.fieldnames or c not in reader.fieldnames]
            return [], [{"row": 0, "error": f"Header validation failed. Missing required columns: {missing}"}]

        for idx, row in enumerate(reader, start=1):
            row_errors = []
            
            # Validation
            if not row.get("admission_number", "").strip():
                row_errors.append("Admission Number is missing")
            if not row.get("student_name", "").strip():
                row_errors.append("Student Name is missing")
            if not row.get("class", "").strip():
                row_errors.append("Class is missing")
            if not row.get("section", "").strip():
                row_errors.append("Section is missing")
            
            phone = row.get("guardian_phone", "").strip()
            if phone and not re.match(r"^(\+91[\-\s]?)?[6-9]\d{9}$", phone):
                row_errors.append(f"Invalid Indian phone format: {phone}")

            if row_errors:
                errors.append({"row": idx, "data": row, "errors": row_errors})
            else:
                valid_records.append(row)
                
        return valid_records, errors
