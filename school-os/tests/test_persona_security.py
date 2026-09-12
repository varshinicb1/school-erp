import pytest
from typing import Dict

# Simulation of Server-side RBAC Guard
ROLE_PERMISSIONS = {
    "Principal": ["VIEW_DASHBOARD", "VIEW_FINANCE", "APPROVE_TC", "VIEW_STAFF_REPORTS", "SUBMIT_ATTENDANCE"],
    "Teacher": ["SUBMIT_ATTENDANCE", "ENTER_MARKS", "VIEW_OWN_CLASSES"],
    "Parent": ["VIEW_CHILD_REPORT", "VIEW_CHILD_FEES", "PAY_FEES"],
    "Accountant": ["VIEW_FINANCE", "COLLECT_FEE", "ISSUE_RECEIPT", "MANAGE_CONCESSION"]
}

def authorize_request(user_session: Dict[str, any], required_permission: str) -> bool:
    """
    Enforces that authorization is strictly checked against the server-authenticated session role,
    NEVER against client-provided persona request headers or switcher state.
    """
    if not user_session or "authenticated_user" not in user_session:
        return False
        
    server_assigned_role = user_session.get("server_role")
    allowed_perms = ROLE_PERMISSIONS.get(server_assigned_role, [])
    return required_permission in allowed_perms

def test_persona_privilege_escalation_fails():
    # Teacher logs in
    teacher_session = {
        "authenticated_user": "teacher_01@vidyuthschool.edu.in",
        "server_role": "Teacher"
    }
    
    # Client tries to send 'Client-Persona: Principal' header
    # Server authorizes against server_role only
    assert authorize_request(teacher_session, "SUBMIT_ATTENDANCE") is True
    assert authorize_request(teacher_session, "VIEW_FINANCE") is False
    assert authorize_request(teacher_session, "APPROVE_TC") is False

def test_parent_cannot_enter_marks_or_view_staff_reports():
    parent_session = {
        "authenticated_user": "parent_01@gmail.com",
        "server_role": "Parent"
    }
    assert authorize_request(parent_session, "VIEW_CHILD_REPORT") is True
    assert authorize_request(parent_session, "ENTER_MARKS") is False
    assert authorize_request(parent_session, "VIEW_STAFF_REPORTS") is False

def test_unauthenticated_request_rejected():
    assert authorize_request(None, "VIEW_DASHBOARD") is False
    assert authorize_request({}, "VIEW_DASHBOARD") is False

if __name__ == "__main__":
    test_persona_privilege_escalation_fails()
    test_parent_cannot_enter_marks_or_view_staff_reports()
    test_unauthenticated_request_rejected()
    print("RBAC Authorization and Privilege Escalation prevention assertions PASSED!")
