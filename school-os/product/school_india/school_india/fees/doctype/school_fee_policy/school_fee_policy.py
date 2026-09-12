try:
    import frappe
    from frappe.model.document import Document
except ImportError:
    class Document:
        pass

class SchoolFeePolicy(Document):
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)

    def calculate_effective_fee(self, base_fee: float) -> float:
        concession = getattr(self, "concession_type", None)
        if concession == "Percentage Discount":
            pct = getattr(self, "discount_percentage", 0.0) or 0.0
            return max(0.0, base_fee * (1.0 - (pct / 100.0)))
        elif concession == "Fixed Amount Discount":
            amt = getattr(self, "fixed_discount_amount", 0.0) or 0.0
            return max(0.0, base_fee - amt)
        return base_fee
