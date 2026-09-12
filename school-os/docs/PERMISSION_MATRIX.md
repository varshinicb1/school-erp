# Permission Matrix — Indian School ERP Roles

| Role Persona | Student Record | Attendance | Fees & Billing | Marks & Exams | Payroll / HR | Timetable | Announcements | Settings / Audit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (CRUD) | Full (CRUD) |
| **School Owner / Trustee** | Read | Read | Read (Reports) | Read (Reports) | Read (Summary) | Read | Read | Read (Audit Logs) |
| **Principal** | Read / Edit | Read / Override | Read / Approve | Read / Lock | Read / Approve | Read / Edit | Create / Publish | Read / Manage |
| **Vice Principal** | Read / Edit | Read / Edit | Read | Read / Verify | Read | Read / Edit | Create / Publish | Read |
| **Academic Coordinator** | Read | Read | No Access | Read / Edit | No Access | Full (CRUD) | Create / Publish | No Access |
| **Class Teacher** | Read (Own Class) | Create / Edit (Own Class) | Read (Status only) | Create / Edit (Own Class) | No Access | Read | Create (Own Class) | No Access |
| **Subject Teacher** | Read (Assigned) | Create (Subject period) | No Access | Create / Edit (Own Subject) | No Access | Read | No Access | No Access |
| **Accountant** | Read | Read | Full (CRUD) | No Access | Read (Salary slip) | No Access | Read | No Access |
| **HR Manager** | Read | Read (Staff) | Read | No Access | Full (CRUD) | No Access | Create / Publish | No Access |
| **Admissions Officer** | Create / Edit | No Access | Read | No Access | No Access | No Access | No Access | No Access |
| **Front Desk / Reception** | Read | Read | Read | No Access | No Access | Read | Read | No Access |
| **Transport Manager** | Read (Transport) | Read | Read (Transport fee) | No Access | No Access | Read | Create (Bus alerts) | No Access |
| **Parent** | Read (Own Child) | Read (Own Child) | Read & Pay (Own Child) | Read (Own Child) | No Access | Read (Own Child) | Read | No Access |
| **Student** | Read (Self) | Read (Self) | Read (Self) | Read (Self) | No Access | Read (Self) | Read | No Access |
