"use client";

import { useMemo, useState } from "react";
import { Building2, Download, Plus, RefreshCw, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { RoleBadge } from "@/components/shared/RoleBadge";
import BuyCreditsDialog from "@/components/billing/BuyCreditsDialog";
import { useGetTeamsQuery, useGetUsersQuery, type UserRow } from "@/redux/api/teamApi";
import { normalizeRole } from "@/services/authService";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data;
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return "Could not load workforce data.";
}

function formatDate(value?: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleDateString();
}

function statusLabel(status?: string | null): string {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function exportMembers(users: UserRow[]): void {
  const header = ["Name", "Email", "Role", "Status", "Joined"];
  const rows = users.map((user) => [
    user.name || "",
    user.email,
    user.role,
    user.status || "",
    user.created_at || "",
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "workforce-members.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function WorkforceHubPage() {
  const {
    data: usersResponse,
    isLoading: usersLoading,
    isFetching: usersFetching,
    error: usersError,
    refetch: refetchUsers,
  } = useGetUsersQuery();
  const {
    data: teamsResponse,
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = useGetTeamsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "MANAGERS" | "OPERATORS">("ALL");
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);

  const users = useMemo(() => usersResponse?.users ?? [], [usersResponse?.users]);
  const teams = teamsResponse?.teams ?? [];
  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.name, user.email, user.role, user.status]
          .some((value) => value?.toLowerCase().includes(query));
      const role = user.role.toLowerCase();
      const matchesRole =
        roleFilter === "ALL" ||
        (roleFilter === "MANAGERS" && role === "manager") ||
        (roleFilter === "OPERATORS" && role === "employee");
      return matchesSearch && matchesRole;
    });
  }, [roleFilter, searchQuery, users]);

  const activeCount = users.filter((user) => user.status?.toLowerCase() === "active").length;
  const managerCount = users.filter((user) => user.role.toLowerCase() === "manager").length;
  const pendingCount = users.filter((user) => user.status?.toLowerCase() === "invited").length;

  const refresh = () => {
    void refetchUsers();
    void refetchTeams();
  };

  return (
    <>
      <div className="flex w-full flex-col pb-8">
        <PageHeader
          title="Workforce Hub"
          badge={
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              Workspace
            </span>
          }
          description="Workspace members, roles, and configured teams."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={refresh}
                disabled={usersFetching}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-xs font-semibold text-on-surface shadow-2xs transition-colors hover:bg-surface-container-low disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-secondary ${usersFetching ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => exportMembers(filteredUsers)}
                disabled={filteredUsers.length === 0}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-3 text-xs font-semibold text-on-surface shadow-2xs transition-colors hover:bg-surface-container-low disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5 text-secondary" />
                Export
              </button>
              <button
                type="button"
                onClick={() => setIsBuyCreditsOpen(true)}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-on-primary shadow-2xs transition-colors hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" />
                Buy Credits
              </button>
            </div>
          }
        />

        {(usersError || teamsError) && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error-container/30 p-4 text-sm text-on-surface"
          >
            <span>
              {usersError ? getErrorMessage(usersError) : getErrorMessage(teamsError)}
            </span>
            <button type="button" onClick={refresh} className="shrink-0 font-semibold text-primary hover:underline">
              Retry
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Workspace members"
            value={usersLoading ? "—" : users.length.toLocaleString()}
            subtext="Registered company users"
            icon={<Users className="h-4 w-4 text-primary" />}
          />
          <StatCard
            label="Active members"
            value={usersLoading ? "—" : activeCount.toLocaleString()}
            subtext="Status reported by the API"
            icon={<Users className="h-4 w-4 text-secondary" />}
          />
          <StatCard
            label="Managers"
            value={usersLoading ? "—" : managerCount.toLocaleString()}
            subtext="Manager role assignments"
            icon={<Users className="h-4 w-4 text-secondary" />}
          />
          <StatCard
            label="Configured teams"
            value={teamsLoading ? "—" : teams.length.toLocaleString()}
            subtext="Teams in this workspace"
            icon={<Building2 className="h-4 w-4 text-emerald-600" />}
          />
        </div>

        <section className="mb-6 rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-xs">
          <div className="flex flex-col justify-between gap-3 border-b border-outline-variant/30 p-4 sm:flex-row sm:items-center sm:p-5">
            <div>
              <h2 className="text-base font-bold text-on-surface">Workspace teams</h2>
              <p className="mt-0.5 text-xs text-secondary">Teams configured for this company.</p>
            </div>
            <span className="text-xs font-semibold text-secondary">
              {teamsLoading ? "Loading…" : `${teams.length} teams`}
            </span>
          </div>
          {teamsLoading ? (
            <p className="p-5 text-sm text-secondary">Loading teams…</p>
          ) : teams.length ? (
            <ul className="flex flex-wrap gap-2 p-4 sm:p-5">
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="rounded-lg bg-surface-container-low px-3 py-2 text-sm font-medium text-on-surface"
                >
                  {team.name}
                </li>
              ))}
            </ul>
          ) : (
            !teamsError && <p className="p-5 text-sm text-secondary">No teams have been created yet.</p>
          )}
        </section>

        <section className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-xs">
          <div className="flex flex-col justify-between gap-4 border-b border-outline-variant/30 p-4 sm:flex-row sm:items-center sm:p-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-on-surface">Team Access Directory</h2>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-bold text-secondary">
                  {usersLoading ? "…" : `${users.length} members`}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-secondary">Live member records from the workspace API.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
                <input
                  type="search"
                  placeholder="Search name, email, role..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-9 w-full rounded-lg border border-outline-variant/40 bg-surface-container-low pl-9 pr-3 text-xs text-on-surface outline-none transition-all placeholder:text-secondary focus:border-primary focus:bg-surface-container-lowest"
                />
              </div>
              <div className="flex items-center rounded-lg border border-outline-variant/30 bg-surface-container-low p-1 text-xs">
                {(["ALL", "MANAGERS", "OPERATORS"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setRoleFilter(filter)}
                    aria-pressed={roleFilter === filter}
                    className={`rounded px-2.5 py-1 font-semibold transition-all ${roleFilter === filter
                      ? "bg-surface-container-lowest text-on-surface shadow-2xs"
                      : "text-secondary hover:text-on-surface"
                      }`}
                  >
                    {filter === "ALL" ? "All" : filter === "MANAGERS" ? "Managers" : "Operators"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low/70 text-[11px] font-bold uppercase tracking-wider text-secondary">
                  <th className="px-5 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-xs">
                {usersLoading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-secondary">
                      Loading workspace members…
                    </td>
                  </tr>
                ) : usersError ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-secondary">
                      Member list is unavailable.
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-secondary">
                      {users.length ? "No members match these filters." : "No workspace members found."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-surface-container-low/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(user.name || user.email)
                              .split(/\s+/)
                              .map((part) => part[0] ?? "")
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold text-on-surface">{user.name || "Unnamed member"}</span>
                            <span className="truncate text-[11px] text-secondary">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <RoleBadge role={normalizeRole(user.role)} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
                          {statusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-secondary">{formatDate(user.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 border-t border-outline-variant/30 bg-surface-container-low/70 px-5 py-3 text-xs text-secondary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>
              Showing {filteredUsers.length} of {users.length} members · {pendingCount} pending invites
            </span>
          </div>
        </section>
      </div>

      <BuyCreditsDialog isOpen={isBuyCreditsOpen} onClose={() => setIsBuyCreditsOpen(false)} />
    </>
  );
}
