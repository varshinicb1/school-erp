import frappe
from frappe.model.document import Document
from school_india.examination.evaluator import calculate_cbse_grade

class StudentMarkSheet(Document):
    def validate(self):
        if self.maximum_marks and self.maximum_marks > 0:
            self.aggregate_percentage = round((self.total_marks_obtained / self.maximum_marks) * 100.0, 2)
            grade, _ = calculate_cbse_grade(self.aggregate_percentage)
            self.cbse_grade = grade
            self.result_status = "Passed" if self.aggregate_percentage >= 33.0 else "Failed"
