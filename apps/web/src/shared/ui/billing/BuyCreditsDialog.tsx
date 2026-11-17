"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useCreateCheckoutSessionMutation } from "@/redux/api/creditsApi";
import {
 X,
 CreditCard,
 CheckCircle2,
 Lock,
 Plus,
 Wallet,
} from "lucide-react";

interface BuyCreditsDialogProps {
 isOpen: boolean;
 onClose: () => void;
 onSuccess?: (addedCredits: number) => void;
 /** Current available balance, used for the post-purchase preview. */
 currentBalance?: number;
}

export default function BuyCreditsDialog({
 isOpen,
 onClose,
 onSuccess,
 currentBalance = 0,
}: BuyCreditsDialogProps) {
 const [selectedPackage, setSelectedPackage] = useState<"starter" | "growth" | "scale" | "custom">("growth");
 const [customAmount, setCustomAmount] = useState(10000);
 const [createCheckoutSession, { isLoading }] = useCreateCheckoutSessionMutation();

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === "Escape" && isOpen) onClose();
 };
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, [isOpen, onClose]);

 if (!isOpen) return null;

 const getCredits = () => {
 if (selectedPackage === "starter") return 5000;
 if (selectedPackage === "growth") return 20000;
 if (selectedPackage === "scale") return 50000;
 return Math.max(1000, customAmount || 1000);
 };

 const getCost = () => {
 if (selectedPackage === "starter") return 25.0;
 if (selectedPackage === "growth") return 80.0;
 if (selectedPackage === "scale") return 175.0;
 return Number((Math.max(1000, customAmount || 1000) * 0.005).toFixed(2));
 };

 const handlePay = async () => {
 const credits = getCredits();
 try {
 const payload =
 selectedPackage === "custom"
 ? { credits }
 : { packId: selectedPackage };
 const res = await createCheckoutSession(payload).unwrap();
 if (res.checkoutUrl) {
 window.location.href = res.checkoutUrl;
 return;
 }
 toast.success(res.message ?? `Purchased ${credits.toLocaleString()} credits successfully! Wallet updated.`);
 onSuccess?.(res.credits ?? credits);
 onClose();
 } catch (err) {
 const message = (err as { data?: { message?: string } }).data?.message;
 toast.error(message ?? "Could not complete the credit purchase.");
 }
 };

 return (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
 <div className="fixed inset-0 -z-10" onClick={onClose} />
 <div className="relative w-full max-w-[640px] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-y-auto max-h-[90vh] my-auto animate-in zoom-in-95 duration-150">
 <div className="p-6">
 {/* Header */}
 <div className="flex items-start justify-between pb-4 border-b border-outline-variant ">
 <div className="space-y-1">
 <h2 className="text-xl font-bold tracking-tight text-on-surface ">
 Buy credits
 </h2>
 <p className="text-xs text-secondary ">
 Credits are added to your company wallet right after payment
 </p>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="p-1 text-outline hover:text-on-surface-variant rounded-lg hover:bg-surface-container-low transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Package Selection */}
 <div className="mt-5">
 <label className="block font-semibold text-xs text-on-surface-variant mb-3 uppercase tracking-wider">
 Choose a package
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
 {/* Option 1: Starter */}
 <div
 onClick={() => setSelectedPackage("starter")}
 className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
 selectedPackage === "starter"
 ? "border-[#063cbc] bg-surface-container-low/50 ring-1 ring-[#063cbc]"
 : "border-outline-variant bg-surface-container-lowest hover:border-outline-variant"
 }`}
 >
 <div className="space-y-1">
 <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
 Starter
 </div>
 <div className="text-lg font-bold text-on-surface tabular-nums">
 $25
 </div>
 </div>
 <div className="text-[10px] text-outline font-medium">5,000 credits</div>
 </div>

 {/* Option 2: Growth (Popular) */}
 <div
 onClick={() => setSelectedPackage("growth")}
 className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
 selectedPackage === "growth"
 ? "border-[#063cbc] bg-surface-container-low/60 shadow-sm"
 : "border-outline-variant bg-surface-container-lowest hover:border-outline-variant"
 }`}
 >
 <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-full bg-[#063cbc] text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
 Popular
 </span>
 <div className="space-y-1">
 <div className="flex items-center gap-1">
 <div className="text-[11px] font-bold text-[#063cbc] uppercase tracking-wider">
 Growth
 </div>
 {selectedPackage === "growth" && (
 <CheckCircle2 className="w-3.5 h-3.5 text-[#063cbc]" />
 )}
 </div>
 <div className="text-lg font-bold text-on-surface tabular-nums">
 $80
 </div>
 </div>
 <div className="text-[10px] text-[#063cbc] font-semibold">20,000 credits</div>
 </div>

 {/* Option 3: Scale */}
 <div
 onClick={() => setSelectedPackage("scale")}
 className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
 selectedPackage === "scale"
 ? "border-[#063cbc] bg-surface-container-low/50 ring-1 ring-[#063cbc]"
 : "border-outline-variant bg-surface-container-lowest hover:border-outline-variant"
 }`}
 >
 <div className="space-y-1">
 <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
 Scale
 </div>
 <div className="text-lg font-bold text-on-surface tabular-nums">
 $175
 </div>
 </div>
 <div className="text-[10px] text-outline font-medium">50,000 credits</div>
 </div>

 {/* Option 4: Custom */}
 <div
 onClick={() => setSelectedPackage("custom")}
 className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
 selectedPackage === "custom"
 ? "border-[#063cbc] bg-surface-container-low/50 ring-1 ring-[#063cbc]"
 : "border-outline-variant bg-surface-container-lowest hover:border-outline-variant"
 }`}
 >
 <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
 Custom
 </div>
 <div className="relative">
 <input
 type="number"
 min={1000}
 step={500}
 value={customAmount}
 onChange={(e) => {
 setSelectedPackage("custom");
 setCustomAmount(Number(e.target.value));
 }}
 placeholder="10,000"
 className="w-full h-7 px-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-semibold text-on-surface focus:outline-none focus:border-[#063cbc]"
 />
 </div>
 <div className="text-[9px] text-outline font-medium">Min 1,000 ($0.005/cr)</div>
 </div>
 </div>
 </div>

 {/* Payment Method */}
 <div className="mt-5">
 <label className="block font-semibold text-xs text-on-surface-variant mb-2 uppercase tracking-wider">
 Payment method
 </label>
 <div className="flex items-center justify-between p-3 rounded-xl border border-outline-variant bg-surface-container-lowest ">
 <div className="flex items-center gap-3">
 <div className="w-10 h-7 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-[#063cbc] shadow-xs">
 <CreditCard className="w-5 h-5" />
 </div>
 <div>
 <div className="text-xs font-semibold text-on-surface flex items-center gap-2">
 <span>Visa ending in 4417</span>
 <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant ">
 Default
 </span>
 </div>
 <div className="text-[11px] text-outline">Expires 08/28</div>
 </div>
 </div>
 <button
 type="button"
 onClick={() => toast("Card selector opened")}
 className="text-xs font-semibold text-[#063cbc] hover:underline"
 >
 Change
 </button>
 </div>
 <div className="mt-2">
 <button
 type="button"
 onClick={() => toast("New card dialog")}
 className="text-xs font-medium text-[#063cbc] hover:underline inline-flex items-center gap-1"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Add a new card</span>
 </button>
 </div>
 </div>

 {/* Summary */}
 <div className="mt-5 pt-4 border-t border-outline-variant ">
 <div className="font-semibold text-xs text-on-surface-variant mb-2.5 uppercase tracking-wider">
 Summary
 </div>
 <div className="space-y-1.5 text-xs">
 <div className="flex justify-between text-secondary">
 <span>{getCredits().toLocaleString()} credits</span>
 <span className="font-semibold tabular-nums text-on-surface ">
 ${getCost().toFixed(2)}
 </span>
 </div>
 <div className="flex justify-between text-secondary">
 <span>Tax</span>
 <span className="font-semibold tabular-nums text-on-surface ">$0.00</span>
 </div>
 <div className="flex justify-between items-baseline pt-2 mt-2 border-t border-surface-container font-bold text-on-surface ">
 <span className="text-sm">Total</span>
 <span className="text-base tabular-nums">${getCost().toFixed(2)}</span>
 </div>
 </div>

 <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 ">
 <Wallet className="w-4 h-4" />
 <span>
 New balance after purchase:{" "}
 <strong className="font-bold">
 {(currentBalance + getCredits()).toLocaleString()} credits
 </strong>
 </span>
 </div>
 </div>

 {/* Security Note */}
 <div className="mt-4 flex items-center gap-1.5 text-[11px] text-outline">
 <Lock className="w-3.5 h-3.5" />
 <span>Payments are processed securely by Stripe.</span>
 </div>
 </div>

 {/* Footer */}
 <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-end gap-3">
 <button
 type="button"
 onClick={onClose}
 className="px-4 py-2 text-xs font-semibold rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
 >
 Cancel
 </button>
 <button
 type="button"
 disabled={isLoading}
 onClick={handlePay}
 className="px-5 py-2 text-xs font-semibold rounded-lg text-white bg-[#063cbc] hover:bg-[#00298a] shadow-sm transition-all flex items-center gap-1.5"
 >
 <Lock className="w-3.5 h-3.5" />
 <span>{isLoading ? "Processing..." : `Pay $${getCost().toFixed(2)}`}</span>
 </button>
 </div>
 </div>
 </div>
 );
}
