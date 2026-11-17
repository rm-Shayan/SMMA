export const ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  CLIENT_OWNER: "Owner",
  COMPANY_ADMIN: "Company Admin",
  MANAGER: "Manager",
  AGENT_OPERATOR: "Operator",
  EMPLOYEE: "Employee",
  TRAINEE: "Trainee",
};

export function roleInitials(role?: string | null): string {
  if (!role) return "OP";
  switch (role.toUpperCase()) {
    case "SUPERADMIN":
      return "SA";
    case "CLIENT_OWNER":
      return "OW";
    case "COMPANY_ADMIN":
      return "CA";
    case "MANAGER":
      return "MG";
    case "AGENT_OPERATOR":
      return "OP";
    case "TRAINEE":
      return "TR";
    default:
      return role.slice(0, 2).toUpperCase();
  }
}
