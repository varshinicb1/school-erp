# Feature Gap Matrix: Indian School ERP vs Upstream

| Domain / Feature | Frappe Education | ERPNext | HRMS | Gibbon SIS | openSIS | Indian School Requirement | Resolution in `school_india` | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Class & Section Model** | Program / Course hierarchy | N/A | N/A | Year Group / Form Group | Grade / Section | Strict Class (Nursery-12) + Sections (A, B, C) with Class Teacher | Dedicated DocTypes: `Academic Class`, `Class Section`, `Class Teacher Assignment` | P0 |
| **CBSE / State Board Exam Cycles** | Assessment Plan / Result | N/A | N/A | Rubrics / Markbook | Gradebook / Weighted GPA | FA1, FA2, SA1, FA3, FA4, SA2, PT, Term 1 & 2, Co-scholastic grades | `Exam Cycle`, `Marks Entry Sheet`, `CBSE Report Card Generator` | P0 |
| **Fee Structure & Concessions** | Fee Schedule / Category | Sales Invoice | N/A | Invoicing | Billing | Sibling discounts, Staff ward concessions, RTE quota, Installment plans, Late fee calculation | `School Fee Structure`, `Concession Policy`, `Installment Matrix` linked to Sales Invoice | P0 |
| **Indian Govt ID Layer** | N/A | N/A | N/A | N/A | State ID | UDISE+ School Code, Student PEN, APAAR ID, Aadhaar (Masked), Board Reg No | Dedicated custom fields + `Government Data Health Dashboard` | P0 |
| **Timetable & Substitution** | Course Schedule | N/A | N/A | Conflict Engine & Substitution Tracker | Timetable | Multi-period daily timetable, Lab batch splitting, Teacher absence substitution matrix | `Class Timetable Grid`, `Teacher Substitution Manager` | P0 |
| **Attendance** | Student Attendance | N/A | Employee Attendance | Period/Daily roll-call | Daily roll-call | Rapid section roll-call (<20s), SMS alert on absence, late attendance reason | Fast Attendance Grid API + Parent notification dispatch | P0 |
| **Certificates** | N/A | N/A | N/A | Form Letters | Transcript Generator | Transfer Certificate (TC) with serial tracking, Bonafide, Study, Conduct, Fee Paid | Configurable Print Formats & `Certificate Register` | P0 |
| **Transport & Fleet** | N/A | Fleet Management | N/A | Transport tracking | N/A | Bus routes, Stops, Student pickup/drop assignment, Transport fee head, Driver assignment | `Transport Route`, `Route Stop`, `Student Transport Allocation` | P1 |
| **Parent Communication** | Email / Discussion | Newsletter | N/A | Messenger | Portal Notes | Multi-channel Noticeboard: WhatsApp, SMS, Push, In-App with recipient targeting | `School Announcement`, `Communication Log`, WhatsApp/SMS gateway hooks | P1 |
