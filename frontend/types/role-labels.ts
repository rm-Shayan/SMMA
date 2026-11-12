import type { UserRole } from "@/types/auth";

export const ROLE_LABEL: Record<UserRole, string> = {
  SUPERADMIN: "Platform Superadmin",
  CLIENT_OWNER: "Agency Owner",
  AGENT_OPERATOR: "Agent Operator",
  TRAINEE: "Trainee",
};

export function roleInitials(displayName: string): string {
  const source = displayName.trim();
  if (!source) return "—";
  if (source.includes("@")) return source.slice(0, 2).toUpperCase();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
