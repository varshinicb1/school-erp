# Academic Class Controller
import frappe
from frappe.model.document import Document

class AcademicClass(Document):
    def validate(self):
        if not self.class_name:
            frappe.throw("Class Name is mandatory.")
