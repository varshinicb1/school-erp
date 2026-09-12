# Vidyuth International School Synthetic Seeder
# Generates 500+ Students, 50+ Staff, 500+ Guardians with realistic Indian demographics & CBSE curriculum

import json
import random

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharv", "Ananya", "Diya", "Saanvi", "Aadhya", "Pari", "Chiara", "Myra", "Isha",
    "Avni", "Kavya", "Riya", "Sneha", "Pooja", "Rahul", "Varun", "Rohan", "Tanvi", "Meera"
]

LAST_NAMES = [
    "Reddy", "Rao", "Sharma", "Verma", "Patel", "Mehta", "Nair", "Iyer", "Choudhury", "Gupta",
    "Singh", "Kumar", "Das", "Joshi", "Bhat", "Kulkarni", "Deshmukh", "Chowdary", "Goud", "Prasad"
]

GRADES = ["Nursery", "LKG", "UKG"] + [f"Grade {i}" for i in range(1, 11)]
SECTIONS = ["A", "B", "C"]
SUBJECTS = ["English", "Telugu", "Hindi", "Mathematics", "Science", "Social Science", "Computer Science", "Physical Education"]

def generate_school_data():
    students = []
    guardians = []
    staff = []
    
    # Generate Staff
    for i in range(1, 55):
        emp_id = f"EMP-{1000 + i}"
        name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
        role = "Teacher" if i <= 40 else random.choice(["Principal", "Vice Principal", "Accountant", "HR", "Librarian", "Transport Manager"])
        staff.append({
            "employee_id": emp_id,
            "name": name,
            "designation": role,
            "department": "Academics" if "Teacher" in role or "Principal" in role else "Administration",
            "email": f"{name.lower().replace(' ', '.')}@vidyuthschool.edu.in",
            "phone": f"+91 98490 {random.randint(10000, 99999)}"
        })

    # Generate Students & Guardians
    student_count = 0
    for grade in GRADES:
        for sec in SECTIONS:
            # ~14 students per section = 13 classes * 3 sections * 14 = 546 students
            for s in range(1, 15):
                student_count += 1
                stu_id = f"VIS-2026-{student_count:04d}"
                s_first = random.choice(FIRST_NAMES)
                s_last = random.choice(LAST_NAMES)
                s_name = f"{s_first} {s_last}"
                
                g_name = f"{random.choice(FIRST_NAMES)} {s_last}"
                g_phone = f"+91 97010 {random.randint(10000, 99999)}"
                g_email = f"parent.{s_last.lower()}{random.randint(10, 99)}@gmail.com"
                
                # Mock APAAR / PEN (Govt IDs)
                pen_id = f"PEN-36{random.randint(1000000000, 9999999999)}"
                apaar_id = f"{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"

                students.append({
                    "admission_number": stu_id,
                    "student_name": s_name,
                    "class": grade,
                    "section": sec,
                    "academic_year": "2026-27",
                    "pen_number": pen_id,
                    "apaar_id": apaar_id,
                    "guardian_name": g_name,
                    "guardian_contact": g_phone,
                    "fee_status": random.choice(["Paid", "Partially Paid", "Pending"]),
                    "outstanding_amount": random.choice([0, 4500, 12000, 25000])
                })
                
                guardians.append({
                    "guardian_name": g_name,
                    "ward_admission_number": stu_id,
                    "contact_phone": g_phone,
                    "email": g_email,
                    "relation": "Father" if random.random() > 0.3 else "Mother"
                })

    dataset = {
        "school": {
            "name": "Vidyuth International School",
            "udise_code": "36190500124",
            "board": "CBSE",
            "state": "Telangana",
            "location": "Hyderabad",
            "academic_year": "2026-27"
        },
        "stats": {
            "total_students": len(students),
            "total_staff": len(staff),
            "total_guardians": len(guardians)
        },
        "staff": staff,
        "students": students,
        "guardians": guardians
    }
    
    with open("tests/vidyuth_seed_data.json", "w") as f:
        json.dump(dataset, f, indent=2)
        
    print(f"Successfully generated seed data with {len(students)} students, {len(staff)} staff, and {len(guardians)} guardians.")

if __name__ == "__main__":
    generate_school_data()
