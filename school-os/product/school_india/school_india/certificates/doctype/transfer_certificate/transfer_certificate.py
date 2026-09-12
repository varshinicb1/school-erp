import frappe
from frappe.model.document import Document

class TransferCertificate(Document):
    def validate(self):
        if not self.fees_cleared:
            frappe.throw("Cannot issue Transfer Certificate until all fee dues are cleared.")
