from typing import Literal

RoleType = Literal["superadmin", "company_admin", "employee", "viewer"]

ROLE_AGENT_PERMISSIONS: dict[str, set[str]] = {
    "superadmin": {"*"},
    "company_admin": {
        "own_post_engager", "competitor_researcher", "comment_responder", "analytics",
        "daily_brief", "outreach", "competitor_engager", "publisher", "inbox_responder",
        "trainee_sop", "company_ops", "supervisor", "copilot"
    },
    "employee": {
        "own_post_engager", "comment_responder", "daily_brief", "outreach",
        "publisher", "inbox_responder", "trainee_sop", "company_ops", "copilot"
    },
    "viewer": {
        "analytics", "daily_brief", "company_ops", "copilot"
    },
}

ACTION_PERMISSIONS: dict[str, set[str]] = {
    "grant_credits": {"superadmin"},
    "allocate_credits": {"superadmin", "company_admin"},
    "approve_runs": {"superadmin", "company_admin"},
    "publish_live": {"superadmin", "company_admin"},
    "view_analytics": {"superadmin", "company_admin", "employee", "viewer"},
    "view_company_ledger": {"superadmin", "company_admin"},
}


def can_execute_agent(
    role: str | None,
    agent_code: str,
    custom_permissions: set[str] | list[str] | None = None,
) -> tuple[bool, str]:
    """Checks role permissions with support for explicit Admin/Manager overrides."""
    grants = set(custom_permissions or [])
    if "*" in grants or agent_code in grants:
        return True, ""  # Explicit grant by Admin/Manager overrides role default

    user_role = (role or "viewer").lower()
    allowed = ROLE_AGENT_PERMISSIONS.get(user_role, set())

    if "*" in allowed or agent_code in allowed:
        return True, ""
    return False, f"Permission Denied: Role '{user_role}' is not authorized to execute agent '{agent_code}'."


def can_perform_action(
    role: str | None,
    action: str,
    custom_permissions: set[str] | list[str] | None = None,
) -> tuple[bool, str]:
    """Checks action permissions with support for explicit Admin/Manager overrides."""
    grants = set(custom_permissions or [])
    if "*" in grants or action in grants:
        return True, ""  # Explicit grant by Admin/Manager overrides role default

    user_role = (role or "viewer").lower()
    allowed_roles = ACTION_PERMISSIONS.get(action, set())

    if user_role == "superadmin" or user_role in allowed_roles:
        return True, ""
    return False, f"Permission Denied: Role '{user_role}' cannot perform action '{action}'."
