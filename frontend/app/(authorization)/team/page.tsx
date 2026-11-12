"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { ViewState } from "@/components/StateSwitcher";

type UserRole = "CLIENT_OWNER" | "AGENT_OPERATOR" | "SUPERADMIN";

export default function TeamPage() {
  const [viewState, setViewState] = useState<ViewState>("live");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("AGENT_OPERATOR");
  const [tenantId, setTenantId] = useState("TEN-8841");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { fullName?: string; email?: string; password?: string } = {};

    if (!fullName.trim()) {
      errors.fullName = "Full name is required.";
    }
    if (!email.trim() || !email.includes("@")) {
      errors.email = "A valid email address is required.";
    }
    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setErrorMsg(null);
    setLoading(true);

    // Simulate POST /api/v1/auth/create-user
    setTimeout(() => {
      setLoading(false);
      setCreatedUser({
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        name: fullName.trim(),
        email: email.trim(),
        role: role,
      });
      // Clear password for security policy (never echo or retain password)
      setPassword("");
    }, 800);
  };

  const handleResetForm = () => {
    setCreatedUser(null);
    setFullName("");
    setEmail("");
    setPassword("");
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full">
        {/* Top Header & State Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg pb-space-md border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Team &amp; User Provisioning
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Role-Based Provisioning
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Create authenticated operator or executive accounts assigned to tenant enclaves.
            </p>
          </div>

          {/* State Switcher Tabs */}
          <div className="flex items-center flex-wrap gap-1 bg-surface-container-low p-1 rounded-xl shadow-xs border border-outline-variant/30 text-xs">
            <button
              onClick={() => {
                setViewState("live");
                setCreatedUser(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "live" && !createdUser
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              Live Form
            </button>
            <button
              onClick={() => setViewState("loading")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "loading"
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
              Creating
            </button>
            <button
              onClick={() => setViewState("empty")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "empty"
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">info</span>
              Role Guide
            </button>
            <button
              onClick={() => setViewState("error")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "error"
                  ? "bg-error text-white shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">error_outline</span>
              API Error
            </button>
          </div>
        </div>

        {/* ============================================== */}
        {/* VIEW 1: LIVE FORM & PROVISIONING               */}
        {/* ============================================== */}
        {viewState === "live" && (
          <div className="w-full space-y-6">
            {/* Created Success Banner */}
            {createdUser && (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-on-surface shadow-xs animate-in zoom-in-95 duration-150">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[24px]">person_check</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-emerald-950">
                      User Account Successfully Created!
                    </h3>
                    <p className="text-xs text-emerald-800 mt-1">
                      Account has been provisioned on the authentication cluster. In accordance with security policy, password was hashed and not retained.
                    </p>

                    <div className="mt-4 p-4 bg-white/90 rounded-xl border border-emerald-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-secondary block text-[10px] uppercase">User ID</span>
                        <span className="font-mono font-semibold text-on-surface">{createdUser.id}</span>
                      </div>
                      <div>
                        <span className="text-secondary block text-[10px] uppercase">Full Name</span>
                        <span className="font-semibold text-on-surface">{createdUser.name}</span>
                      </div>
                      <div>
                        <span className="text-secondary block text-[10px] uppercase">Role Assigned</span>
                        <span className="font-mono font-bold text-primary">{createdUser.role}</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={handleResetForm}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
                      >
                        Provision Another User
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
              {/* Left Column: Create User Form (7 Cols) */}
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/40 p-6 sm:p-8 flex flex-col space-y-6">
                <div className="flex items-start justify-between pb-4 border-b border-outline-variant/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-container text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">person_add</span>
                    </div>
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                        Provision Team Member
                      </h2>
                      <p className="text-xs text-secondary">
                        Enter user credentials and assign role tier.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-mono font-semibold">
                    POST /auth/create-user
                  </span>
                </div>

                <form onSubmit={handleCreateUser} noValidate className="space-y-4 text-xs">
                  {/* Full Name */}
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Full Name <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        badge
                      </span>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Jordan Rivera"
                        required
                        className="w-full pl-10 pr-3 py-2 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                      />
                    </div>
                    {validationErrors.fullName && (
                      <p className="text-error mt-1">{validationErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Email Address <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        mail
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="j.rivera@apexgrowth.io"
                        required
                        className="w-full pl-10 pr-3 py-2 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="text-error mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  {/* Initial Password */}
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Initial Password <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                        lock
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        className="w-full pl-10 pr-10 py-2 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 text-secondary hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="text-error mt-1">{validationErrors.password}</p>
                    )}
                    <span className="text-[10px] text-secondary mt-0.5 block">
                      Hashed at backend. Password will never be displayed in API responses.
                    </span>
                  </div>

                  {/* Role Selector */}
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Role Assignment <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          val: "AGENT_OPERATOR" as UserRole,
                          label: "Operator",
                          desc: "Inbound & Publishing",
                        },
                        {
                          val: "CLIENT_OWNER" as UserRole,
                          label: "Client Owner",
                          desc: "Tenant Admin",
                        },
                        {
                          val: "SUPERADMIN" as UserRole,
                          label: "Superadmin",
                          desc: "Platform Operator",
                        },
                      ].map((r) => {
                        const isSelected = role === r.val;
                        return (
                          <div
                            key={r.val}
                            onClick={() => setRole(r.val)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary-fixed/30 border-primary-container text-primary font-semibold"
                                : "bg-surface-container-low border-outline-variant/30 text-secondary hover:text-on-surface"
                            }`}
                          >
                            <div className="font-semibold text-xs">{r.label}</div>
                            <div className="text-[10px] opacity-80">{r.desc}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tenant ID for Superadmin */}
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Tenant Assignment Identifier
                    </label>
                    <input
                      type="text"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      placeholder="e.g. TEN-8841"
                      className="w-full p-2 bg-surface-container-low rounded-lg border border-outline-variant/40 text-on-surface text-xs font-mono outline-none focus:border-primary-container"
                    />
                    <span className="text-[10px] text-secondary mt-0.5 block">
                      SUPERADMIN can assign across tenants; CLIENT_OWNER defaults to own tenant.
                    </span>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 border-t border-outline-variant/30">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-primary-container hover:bg-primary-container/90 active:bg-primary text-white font-semibold text-xs rounded-xl shadow-md shadow-primary-container/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] animate-spin">
                            sync
                          </span>
                          <span>Creating User Account...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                          <span>Provision User Account</span>
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Architectural & RBAC Guide (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/40 p-6 space-y-4 text-xs">
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      admin_panel_settings
                    </span>
                    Role Permissions Architecture
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                      <span className="font-bold text-on-surface block mb-1">SUPERADMIN</span>
                      <p className="text-secondary leading-relaxed">
                        Platform-level operator. Can view tenant directory, target any tenant context, and create all three user roles.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                      <span className="font-bold text-on-surface block mb-1">CLIENT_OWNER</span>
                      <p className="text-secondary leading-relaxed">
                        Executive manager of an individual agency enclave. Can configure credentials, view leads, and create operator accounts for their own tenant. Cannot create SUPERADMIN.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
                      <span className="font-bold text-on-surface block mb-1">AGENT_OPERATOR</span>
                      <p className="text-secondary leading-relaxed">
                        Operational staff member. Can interact with Agent Workspace, reply to inbox messages, view leads, and schedule publishing posts.
                      </p>
                    </div>
                  </div>

                  {/* Backend Evidence Note */}
                  <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 text-secondary leading-relaxed">
                    <span className="font-bold text-primary block mb-0.5">
                      Backend Design Boundary:
                    </span>
                    The backend exposes user creation via <code>POST /api/v1/auth/create-user</code>. No user-list, edit, or deactivation endpoints exist in the current router.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 2: LOADING SKELETON                       */}
        {/* ============================================== */}
        {viewState === "loading" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 max-w-xl mx-auto my-12 border border-outline-variant/40 text-center animate-pulse">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-white flex items-center justify-center mx-auto mb-4 animate-spin">
              <span className="material-symbols-outlined text-[28px]">sync</span>
            </div>
            <h2 className="text-lg font-bold text-on-surface">Provisioning User Enclave</h2>
            <p className="text-xs text-secondary mt-2 max-w-sm mx-auto">
              Hashing credentials and generating cryptographic user identity on the auth service...
            </p>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 3: EMPTY / ROLE GUIDE                     */}
        {/* ============================================== */}
        {viewState === "empty" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 lg:p-20 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12 border border-outline-variant/40">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-lg text-primary shadow-xs">
              <span className="material-symbols-outlined text-[32px]">group</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
              User Creation Gateway
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-2 mb-space-lg">
              This screen allows authorized personnel (SUPERADMIN and CLIENT_OWNER) to provision new team members. User listings are not maintained here as no user-list endpoint is exposed by the backend.
            </p>
            <button
              onClick={() => setViewState("live")}
              className="px-5 py-2.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs"
            >
              Open Provisioning Form
            </button>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 4: API ERROR                              */}
        {viewState === "error" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-8 max-w-lg mx-auto my-12 border-t-4 border-error border-x border-b border-outline-variant/40 text-center">
            <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">cloud_off</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              User Provisioning Gateway Error (500)
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-2 mb-space-md">
              Duplicate email detected or unauthorized role assignment request blocked by RBAC middleware.
            </p>
            <button
              onClick={() => setViewState("live")}
              className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-on-error-container transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Retry Form
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

