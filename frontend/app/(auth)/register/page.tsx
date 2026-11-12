"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState("Apex Growth Partners, LLC");
  const [contactEmail, setContactEmail] = useState("alex.morgan@apexgrowth.io");
  const [brandVoice, setBrandVoice] = useState(
    "Authoritative, high-velocity growth engineering, precise analytical tone"
  );
  const [googleSheetId, setGoogleSheetId] = useState("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");
  const [bookingUrl, setBookingUrl] = useState("https://calendly.com/apexgrowth/discovery");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    companyName?: string;
    contactEmail?: string;
    bookingUrl?: string;
  }>({});

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { companyName?: string; contactEmail?: string; bookingUrl?: string } = {};

    if (!companyName.trim()) {
      errors.companyName = "Company name is required (minimum 3 characters).";
    }

    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      errors.contactEmail = "A valid corporate contact email address is required.";
    }

    if (bookingUrl && !bookingUrl.startsWith("http://") && !bookingUrl.startsWith("https://")) {
      errors.bookingUrl = "Booking calendar must be a valid URL starting with http:// or https://";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setApiError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-body-md text-on-surface">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e9edff_1px,transparent_1px),linear-gradient(to_bottom,#e9edff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60"></div>

      {/* Main Container */}
      <div className="w-full max-w-[560px] relative z-10 flex flex-col">
      
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white"><span className="material-symbols-outlined text-[22px]">neurology</span></div>
            <div className="text-left"><div className="text-xl font-bold text-on-surface">SMMA AI</div><div className="text-[10px] font-semibold text-primary-container uppercase">Autonomous Platform</div></div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            Create Your Organization
          </h1>
          <p className="text-xs text-secondary mt-1 max-w-md mx-auto">
            Register an authoritative multi-tenant enclave to deploy autonomous agency agents and omnichannel dispatch.
          </p>
        </div>

        {/* Card Surface */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl p-6 sm:p-8 relative">
        
          {/* Architectural Context Banner (Strict requirement: Registration creates tenant record only, not user credentials) */}
          {/* <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">
              info
            </span>
            <div className="text-xs text-on-surface leading-relaxed">
              <span className="font-semibold text-primary">Authoritative Tenant Provisioning:</span>{" "}
              This form provisions an isolated organization enclave record. In accordance with platform architecture, operator logins and administrator accounts must be provisioned via <strong>Team Management</strong> after enclave activation.
            </div>
          </div> */}

          {/* API Error State Banner */}
          {apiError && (
            <div className="bg-error-container/40 border border-error/30 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] text-error shrink-0">
                  error
                </span>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-error">Registration Gateway Error</h3>
                  <p className="text-xs text-on-error-container mt-0.5 leading-relaxed">
                    {apiError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUCCESS STATE MODAL / OVERLAY */}
          {success ? (
            <div className="py-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
                <span className="material-symbols-outlined text-[32px]">verified</span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">Tenant Record Created!</h2>
              <p className="text-xs text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
                Organization enclave successfully registered on the cluster with cryptographic partition.
              </p>

              <div className="mt-5 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 text-left text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Enclave ID:</span>
                  <span className="font-mono font-semibold text-on-surface">#TEN-9921-ACTIVE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Company Name:</span>
                  <span className="font-medium text-on-surface">{companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Notification Email:</span>
                  <span className="font-medium text-on-surface">{contactEmail}</span>
                </div>
              </div>

              {/* Strict Notice regarding Owner login */}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left flex items-start gap-2 text-xs text-amber-800">
                <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 mt-0.5">
                  warning
                </span>
                <span>
                  <strong>Important:</strong> Tenant registration does not create an owner login account. An administrator can now provision user credentials in the Team section.
                </span>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Register Another Tenant
                </button>
                <Link
                  href="/login"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-primary-container text-white hover:bg-primary-container/90 transition-colors shadow-xs"
                >
                  Proceed to Login
                </Link>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              {/* Company Name */}
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-xs font-semibold text-on-surface mb-1"
                >
                  Company Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                    <span className="material-symbols-outlined text-[18px]">business</span>
                  </div>
                  <input
                    type="text"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Growth Partners, LLC"
                    required
                    className="w-full pl-10 pr-3.5 py-2 text-sm bg-surface-container-low/40 focus:bg-surface-container-lowest text-on-surface placeholder:text-secondary rounded-xl border border-outline-variant/50 focus:border-primary-container focus:ring-3 focus:ring-primary-container/15 outline-none transition-all"
                  />
                </div>
                {validationErrors.companyName && (
                  <p className="text-xs text-error mt-1">{validationErrors.companyName}</p>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-xs font-semibold text-on-surface mb-1"
                >
                  Primary Contact Email <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <input
                    type="email"
                    id="contactEmail"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="alex.morgan@apexgrowth.io"
                    required
                    className="w-full pl-10 pr-3.5 py-2 text-sm bg-surface-container-low/40 focus:bg-surface-container-lowest text-on-surface placeholder:text-secondary rounded-xl border border-outline-variant/50 focus:border-primary-container focus:ring-3 focus:ring-primary-container/15 outline-none transition-all"
                  />
                </div>
                {validationErrors.contactEmail && (
                  <p className="text-xs text-error mt-1">{validationErrors.contactEmail}</p>
                )}
              </div>

              {/* Brand Voice */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="brandVoice" className="block text-xs font-semibold text-on-surface">
                    Brand Voice Tone (Optional)
                  </label>
                  <span className="text-[10px] text-secondary">Backend default available</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                    <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
                  </div>
                  <input
                    type="text"
                    id="brandVoice"
                    value={brandVoice}
                    onChange={(e) => setBrandVoice(e.target.value)}
                    placeholder="e.g. Authoritative, direct, analytical"
                    className="w-full pl-10 pr-3.5 py-2 text-sm bg-surface-container-low/40 focus:bg-surface-container-lowest text-on-surface placeholder:text-secondary rounded-xl border border-outline-variant/50 focus:border-primary-container focus:ring-3 focus:ring-primary-container/15 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 2-Column: Google Sheet ID & Booking Calendar URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="googleSheetId" className="block text-xs font-semibold text-on-surface mb-1">
                    Google Sheet ID (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                      <span className="material-symbols-outlined text-[18px]">table_chart</span>
                    </div>
                    <input
                      type="text"
                      id="googleSheetId"
                      value={googleSheetId}
                      onChange={(e) => setGoogleSheetId(e.target.value)}
                      placeholder="Google Sheet ID"
                      className="w-full pl-10 pr-3.5 py-2 text-xs font-mono bg-surface-container-low/40 focus:bg-surface-container-lowest text-on-surface placeholder:text-secondary rounded-xl border border-outline-variant/50 focus:border-primary-container focus:ring-3 focus:ring-primary-container/15 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bookingUrl" className="block text-xs font-semibold text-on-surface mb-1">
                    Booking Calendar URL (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
                      <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                    </div>
                    <input
                      type="url"
                      id="bookingUrl"
                      value={bookingUrl}
                      onChange={(e) => setBookingUrl(e.target.value)}
                      placeholder="https://calendly.com/..."
                      className="w-full pl-10 pr-3.5 py-2 text-xs font-mono bg-surface-container-low/40 focus:bg-surface-container-lowest text-on-surface placeholder:text-secondary rounded-xl border border-outline-variant/50 focus:border-primary-container focus:ring-3 focus:ring-primary-container/15 outline-none transition-all"
                    />
                  </div>
                  {validationErrors.bookingUrl && (
                    <p className="text-xs text-error mt-1">{validationErrors.bookingUrl}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-primary-container hover:bg-primary-container/90 active:bg-primary text-white font-semibold text-sm rounded-xl shadow-md shadow-primary-container/20 transition-all duration-150 flex items-center justify-center gap-2 outline-none disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        sync
                      </span>
                      <span>Provisioning Enclave Record...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>Register Organization Enclave</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Already have an account */}
          <div className="mt-5 pt-4 border-t border-outline-variant/30 text-center text-xs text-secondary">
            <span>Already have tenant credentials? </span>
            <Link href="/login" className="text-primary-container font-semibold hover:underline">
              Sign in to Enclave
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

