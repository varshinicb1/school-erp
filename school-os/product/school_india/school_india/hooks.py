app_name = "school_india"
app_title = "School India"
app_publisher = "School OS Team"
app_description = "Indian School ERP extensions"
app_email = "engineering@school-os.in"
app_license = "MIT"

# Hook doctype events, fixtures, and fast REST APIs
fixtures = [
    {"dt": "Custom Field", "filters": [["module", "=", "School India"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "School India"]]}
]
