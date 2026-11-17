"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setTenantId } from "@/redux/slices/authSlice";
import type { TenantOption } from "@/types/tenant";
import { Building2, Check, ChevronDown } from "lucide-react";

const MOCK_TENANTS: TenantOption[] = [
    { id: "ten_styre_tech", companyName: "Styre Tech (Master Platform)" },
    { id: "ten_northwind", companyName: "Northwind Digital" },
    { id: "ten_velocity", companyName: "Velocity Ventures UK" },
    { id: "ten_omni_scale", companyName: "OmniScale Automations" },
];

export default function TenantContextMenu() {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const tenantId = useAppSelector((state) => state.auth.tenantId);
    const [tenants] = useState<TenantOption[]>(MOCK_TENANTS);
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isSuper = user?.role === "SUPERADMIN";

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const activeTenant = tenants.find((t) => t.id === tenantId) ?? tenants[0];

    return (
        <div className="relative" ref={menuRef}>
            {isSuper ? (
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/50 bg-surface-container-low hover:bg-surface-container transition-colors text-xs font-semibold text-on-surface"
                    aria-expanded={open}
                    aria-haspopup="listbox"
                >
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate max-w-[160px]">{activeTenant?.companyName || "Styre Tech"}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-secondary opacity-60" />
                </button>
            ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs font-semibold text-on-surface">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate max-w-[160px]">{activeTenant?.companyName || "Styre Tech"}</span>
                </div>
            )}

            {open && isSuper && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/60 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-outline-variant/30 text-[10px] font-bold uppercase tracking-wider text-secondary">
                        Switch Tenant Enclave
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                        {tenants.map((t) => {
                            const selected = t.id === activeTenant?.id;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                        dispatch(setTenantId(t.id));
                                        setOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${selected
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-on-surface hover:bg-surface-container-low font-medium"
                                        }`}
                                >
                                    <div className="truncate">
                                        <p className="truncate">{t.companyName}</p>
                                        <span className="text-[10px] text-secondary font-normal font-mono">{t.id}</span>
                                    </div>
                                    {selected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
