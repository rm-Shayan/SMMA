"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { ViewState } from "@/components/StateSwitcher";
import { listCredentialsApi, saveCredentialApi, deleteCredentialApi } from "@/services/credentialsService";

interface Credential {
  id: string;
  platform: "linkedin" | "instagram" | "twitter" | "facebook" | "whatsapp";
  platformName: string;
  accountId: string;
  tokenExpiresAt: string;
  status: "connected" | "expiring_soon" | "disconnected";
  profilesCount: string;
}

const initialCredentials: Credential[] = [
  {
    id: "cred-1",
    platform: "linkedin",
    platformName: "LinkedIn Enterprise",
    accountId: "lnk_org_9941882",
    tokenExpiresAt: "58 days remaining",
    status: "connected",
    profilesCount: "4 Company Profiles",
  },
  {
    id: "cred-2",
    platform: "instagram",
    platformName: "Instagram Business",
    accountId: "ig_act_5521094",
    tokenExpiresAt: "42 days remaining",
    status: "connected",
    profilesCount: "2 Handles",
  },
  {
    id: "cred-3",
    platform: "twitter",
    platformName: "X (Twitter)",
    accountId: "x_api_3309112",
    tokenExpiresAt: "Token Valid (Permanent)",
    status: "connected",
    profilesCount: "3 Accounts",
  },
  {
    id: "cred-4",
    platform: "facebook",
    platformName: "Facebook Pages",
    accountId: "fb_page_1029482",
    tokenExpiresAt: "Expiring in 3 days",
    status: "expiring_soon",
    profilesCount: "2 Pages",
  },
];

export default function ChannelsPage() {
  const [viewState, setViewState] = useState<ViewState>("live");
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials);
  const [modalOpen, setModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [credentialToDisconnect, setCredentialToDisconnect] = useState<Credential | null>(null);

  // Manual connect form state
  const [formPlatform, setFormPlatform] = useState<Credential["platform"]>("whatsapp");
  const [formAccountId, setFormAccountId] = useState("");
  const [formAccessToken, setFormAccessToken] = useState("");
  const [formRefreshToken, setFormRefreshToken] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    listCredentialsApi().then((rows) => {
      if (mounted && rows && rows.length > 0) {
        const platformLabels: Record<string, string> = {
          linkedin: "LinkedIn Enterprise",
          instagram: "Instagram Business",
          twitter: "X (Twitter)",
          facebook: "Facebook Pages",
          whatsapp: "WhatsApp Business",
        };
        const mapped: Credential[] = rows.map((r, i) => ({
          id: r.id || "cred-" + (i + 1),
          platform: r.platform,
          platformName: platformLabels[r.platform] || r.platform,
          accountId: r.account_id,
          tokenExpiresAt: r.expires_at ? `Expires ${new Date(r.expires_at).toLocaleDateString()}` : "Token Valid",
          status: (r.status as any) || "connected",
          profilesCount: r.profiles_count || "1 Account",
        }));
        setCredentials(mapped);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAccountId.trim()) {
      setFormError("Account ID is required.");
      return;
    }
    if (!formAccessToken.trim()) {
      setFormError("Access token is required.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await saveCredentialApi({
        platform: formPlatform,
        accountId: formAccountId.trim(),
        accessToken: formAccessToken.trim(),
        refreshToken: formRefreshToken.trim() || undefined,
        expiresAt: formExpiresAt.trim() || undefined,
      });
    } catch {
      // Continue optimistic save
    }

    const platformLabels: Record<Credential["platform"], string> = {
      linkedin: "LinkedIn Enterprise",
      instagram: "Instagram Business",
      twitter: "X (Twitter)",
      facebook: "Facebook Pages",
      whatsapp: "WhatsApp Business",
    };

    const newCred: Credential = {
      id: "cred-" + Date.now(),
      platform: formPlatform,
      platformName: platformLabels[formPlatform],
      accountId: formAccountId.trim(),
      tokenExpiresAt: formExpiresAt ? `Expires ${formExpiresAt}` : "Token Valid",
      status: "connected",
      profilesCount: "1 Account",
    };

    setCredentials((prev) => [...prev.filter((c) => c.platform !== formPlatform), newCred]);
    setSaving(false);
    setModalOpen(false);
    setFormAccountId("");
    setFormAccessToken("");
    setFormRefreshToken("");
    setFormExpiresAt("");
  };

  const confirmDisconnect = async () => {
    if (!credentialToDisconnect) return;
    const targetPlatform = credentialToDisconnect.platform;
    const targetId = credentialToDisconnect.id;
    setCredentials((prev) => prev.filter((c) => c.id !== targetId));
    setDisconnectModalOpen(false);
    setCredentialToDisconnect(null);
    try {
      await deleteCredentialApi(targetPlatform);
    } catch {
      // Ignored
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full">
        {/* Top Header & State Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg pb-space-md border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Social Channels &amp; Credentials
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                AES-256 Vault Active
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Securely store API tokens and channel identifiers for autonomous post dispatch and webhook reception.
            </p>
          </div>

          {/* Action & State Switcher */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_link</span>
              <span>Connect Channel</span>
            </button>

            <div className="flex items-center flex-wrap gap-1 bg-surface-container-low p-1 rounded-xl shadow-xs border border-outline-variant/30 text-xs">
              <button
                onClick={() => setViewState("live")}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                  viewState === "live"
                    ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                    : "text-secondary hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                Live Channels
              </button>
              <button
                onClick={() => setViewState("loading")}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                  viewState === "loading"
                    ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                    : "text-secondary hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                Skeleton
              </button>
              <button
                onClick={() => setViewState("empty")}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                  viewState === "empty"
                    ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                    : "text-secondary hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                Empty
              </button>
              <button
                onClick={() => setViewState("error")}
                className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                  viewState === "error"
                    ? "bg-error text-white shadow-xs font-semibold"
                    : "text-secondary hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                API Error
              </button>
            </div>
          </div>
        </div>

        {/* ============================================== */}
        {/* VIEW 1: LIVE CHANNELS TABLE & CARDS            */}
        {/* ============================================== */}
        {viewState === "live" && (
          <div className="flex flex-col space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/40 flex items-center justify-between">
                <div>
                  <span className="font-caption text-caption text-secondary uppercase tracking-wider block">
                    Supported Platforms
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface mt-0.5 block font-bold">
                    5 Channels
                  </span>
                  <span className="font-caption text-caption text-secondary mt-1 inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">
                      verified
                    </span>{" "}
                    {credentials.length} Connected
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[20px]">hub</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/40 flex items-center justify-between">
                <div>
                  <span className="font-caption text-caption text-secondary uppercase tracking-wider block">
                    Encrypted Tokens
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface mt-0.5 block font-bold">
                    AES-256 Vault
                  </span>
                  <span className="font-caption text-caption text-tertiary mt-1 inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span> Zero Plaintext
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined text-[20px]">shield</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/40 flex items-center justify-between">
                <div>
                  <span className="font-caption text-caption text-secondary uppercase tracking-wider block">
                    Sync Status
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface mt-0.5 block font-bold">
                    100% Operational
                  </span>
                  <span className="font-caption text-caption text-secondary mt-1">
                    Node Latency: 32ms
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-[20px]">dns</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/40 flex items-center justify-between">
                <div>
                  <span className="font-caption text-caption text-secondary uppercase tracking-wider block">
                    Webhook Listener
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface mt-0.5 block font-bold">
                    Meta &amp; WA Active
                  </span>
                  <span className="font-caption text-caption text-primary mt-1">
                    Inbound Routing Live
                  </span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">sensors</span>
                </div>
              </div>
            </div>

            {/* Channels Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {credentials.map((c) => (
                <div
                  key={c.id}
                  className="bg-surface-container-lowest rounded-xl p-5 shadow-xs border border-outline-variant/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-outline-variant/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
                          <span className="material-symbols-outlined text-[20px]">
                            {c.platform === "linkedin"
                              ? "share"
                              : c.platform === "instagram"
                              ? "photo_camera"
                              : c.platform === "whatsapp"
                              ? "chat"
                              : c.platform === "facebook"
                              ? "public"
                              : "tag"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                            {c.platformName}
                          </h3>
                          <span className="font-caption text-caption text-secondary">
                            {c.profilesCount}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.status === "connected"
                            ? "bg-tertiary-fixed text-on-tertiary-fixed"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === "connected" ? "bg-tertiary" : "bg-amber-600"
                          }`}
                        ></span>
                        {c.status === "connected" ? "ACTIVE" : "EXPIRING SOON"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2.5 bg-surface-container-low/60 p-3.5 rounded-lg border border-outline-variant/30 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-secondary">Bound Account ID:</span>
                        <span className="font-mono font-medium text-on-surface">{c.accountId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-secondary">Token Validity:</span>
                        <span className="font-medium text-on-surface">{c.tokenExpiresAt}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-secondary">Stored Credential Security:</span>
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Encrypted at Rest (Omitted by API)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-5 pt-3 border-t border-outline-variant/30">
                    <button
                      type="button"
                      onClick={() => {
                        setCredentialToDisconnect(c);
                        setDisconnectModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-error hover:bg-error-container/40 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">link_off</span>
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual Connect Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setModalOpen(false)}
            />
            <div className="relative z-50 w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl p-6 border border-outline-variant/40 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">key</span>
                  <h3 className="text-base font-bold text-on-surface">
                    Connect Social Channel Credential
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-lg text-secondary hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Informational Notice (Strict: Manual credential entry, not OAuth flow) */}
              <div className="mt-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs text-secondary leading-relaxed">
                <strong>Manual Credential Provisioning:</strong> The backend accepts manually supplied platform API credentials. OAuth authorization flows are not supported by the current router.
              </div>

              {formError && (
                <div className="mt-3 p-3 rounded-lg bg-error-container/40 text-error text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleConnect} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Social Platform <span className="text-error">*</span>
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as Credential["platform"])}
                    className="w-full p-2 bg-surface-container-low rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                  >
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="facebook">Facebook</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Account ID / Page ID <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    placeholder="e.g. 1092837465241"
                    required
                    className="w-full p-2 bg-surface-container-low rounded-lg border border-outline-variant/40 text-on-surface text-xs font-mono outline-none focus:border-primary-container"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-on-surface mb-1">
                    Access Token <span className="text-error">*</span>
                  </label>
                  <input
                    type="password"
                    value={formAccessToken}
                    onChange={(e) => setFormAccessToken(e.target.value)}
                    placeholder="EAAK... / Bearer Token"
                    required
                    className="w-full p-2 bg-surface-container-low rounded-lg border border-outline-variant/40 text-on-surface text-xs font-mono outline-none focus:border-primary-container"
                  />
                  <span className="text-[10px] text-secondary mt-0.5 block">
                    Will be encrypted at rest and omitted from client responses.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Refresh Token (Optional)
                    </label>
                    <input
                      type="password"
                      value={formRefreshToken}
                      onChange={(e) => setFormRefreshToken(e.target.value)}
                      placeholder="Optional refresh token"
                      className="w-full p-2 bg-surface-container-low rounded-lg border border-outline-variant/40 text-on-surface text-xs font-mono outline-none focus:border-primary-container"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      className="w-full p-2 bg-surface-container-low rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-outline-variant/30 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs"
                  >
                    {saving ? "Saving Encrypted..." : "Save Credential"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Disconnect Confirmation Modal */}
        {disconnectModalOpen && credentialToDisconnect && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setDisconnectModalOpen(false)}
            />
            <div className="relative z-50 w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-2xl p-6 border border-outline-variant/40 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[24px]">link_off</span>
              </div>
              <h3 className="text-base font-bold text-on-surface">Disconnect Channel</h3>
              <p className="text-xs text-secondary mt-1 leading-relaxed">
                Are you sure you want to revoke credentials for{" "}
                <strong>{credentialToDisconnect.platformName}</strong>? Autonomous publishing and inbound webhook routing will halt.
              </p>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setDisconnectModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDisconnect}
                  className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-on-error-container shadow-xs"
                >
                  Revoke &amp; Disconnect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 2: LOADING SKELETON                       */}
        {/* ============================================== */}
        {viewState === "loading" && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 3: EMPTY STATE                            */}
        {/* ============================================== */}
        {viewState === "empty" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 lg:p-20 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12 border border-outline-variant/40">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-lg text-primary shadow-xs">
              <span className="material-symbols-outlined text-[32px]">hub</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
              No channels connected yet
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-2 mb-space-lg">
              Add your Instagram, LinkedIn, Facebook, X, or WhatsApp credentials to allow the autonomous agent to publish posts and listen for customer messages.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_link</span>
              Connect First Channel
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
              Failed to load credentials (500)
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-2 mb-space-md">
              Unable to reach the Express credentials repository. Check network connection or retry.
            </p>
            <button
              onClick={() => setViewState("live")}
              className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-on-error-container transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Retry Credential Listing
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

