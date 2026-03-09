"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { authApi } from "@/lib/api/auth";
import { useUser } from "@/hooks/useUser";
import { getStorageUrl } from "@/lib/utils/image";

// ============================================
// Navigation Config
// ============================================

const ADMIN_GROUPS = [
    {
        label: "Management",
        items: [
            {
                label: "Overview", href: "/admin",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                ),
            },
            {
                label: "Users", href: "/admin/users",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Marketplace",
        items: [
            {
                label: "Scripts", href: "/admin/scripts",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                    </svg>
                ),
            },
            {
                label: "Hubs", href: "/admin/hubs",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 21a8 8 0 0 0-16 0" />
                        <circle cx="10" cy="8" r="5" />
                        <path d="M22 20c0-3.37-2.69-6.29-6.44-7.4" />
                    </svg>
                ),
            },
            {
                label: "Executors", href: "/admin/executors",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m7 11 2-2-2-2" />
                        <path d="M11 13h4" />
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Infrastructure",
        items: [
            {
                label: "Deployments", href: "/admin/deployments",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                    </svg>
                ),
            },
            {
                label: "Keys", href: "/admin/keys",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                    </svg>
                ),
            },
            {
                label: "CDN Storage", href: "/admin/cdn",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M3 5v14a9 3 0 0 0 18 0V5" />
                        <path d="M3 12a9 3 0 0 0 18 0" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "System",
        items: [
            {
                label: "Plans", href: "/admin/plans",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                ),
            },
            {
                label: "Reports", href: "/admin/reports",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m4 11 7-7 7 7" />
                        <path d="M11 20v-9" />
                        <path d="m8 17 3 3 3-3" />
                    </svg>
                ),
            },
            {
                label: "Stub Editor", href: "/admin/settings/stub",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                    </svg>
                ),
            },
            {
                label: "Loaders", href: "/admin/settings/loaders",
                icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 13h20" /><path d="M12 2v20" /><path d="m5 16 7-7 7 7" />
                    </svg>
                ),
            },
        ],
    },
];

// ============================================
// Component
// ============================================

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading } = useUser();
    const [isMounted, setIsMounted] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    // Click outside handler for user menu
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Auth state + Admin check
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !isLoading) {
            if (!user?.roles?.includes("admin")) {
                router.replace("/home");
            }
        }
    }, [isMounted, isLoading, user, router]);

    const handleLogout = async () => {
        await authApi.logout();
        window.dispatchEvent(new Event('auth-change'));
        window.location.href = "/";
    };

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    // ---- Sidebar Content (shared between desktop & mobile) ----
    const sidebarContent = (
        <>
            {/* Header / Brand */}
            <div className={`flex items-center gap-2.5 px-4 h-14 shrink-0 border-b border-rose-500/10 ${isCollapsed ? "justify-center px-0" : ""}`}>
                <Link href="/admin" className={`flex items-center gap-2 select-none ${isCollapsed ? "justify-center" : ""}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    {!isCollapsed && (
                        <>
                            <span className="text-[14px] font-medium text-offgray-50 tracking-tight">
                                script<span className="text-rose-400">hub</span>
                            </span>
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5 ml-1">
                                Admin
                            </span>
                        </>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5">
                {ADMIN_GROUPS.map((group) => (
                    <div key={group.label} className="mb-4">
                        {!isCollapsed && (
                            <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-offgray-600 px-2 mb-1.5">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={isCollapsed ? item.label : undefined}
                                        className={[
                                            "group/item flex items-center gap-2.5 rounded-md transition-all duration-150 select-none relative",
                                            isCollapsed ? "justify-center w-9 h-9 mx-auto" : "h-8 px-2",
                                            active
                                                ? "text-offgray-50 bg-rose-500/10"
                                                : "text-offgray-500 hover:text-offgray-200 hover:bg-white/[0.04]",
                                        ].join(" ")}
                                    >
                                        <span className={`shrink-0 ${active ? "text-rose-400" : "text-offgray-600 group-hover/item:text-offgray-400"} transition-colors`}>
                                            {item.icon}
                                        </span>
                                        {!isCollapsed && (
                                            <span className={`text-[13px] tracking-tight truncate ${active ? 'text-rose-300' : ''}`}>
                                                {item.label}
                                            </span>
                                        )}
                                        {/* Active indicator */}
                                        {active && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-rose-400 rounded-r-full" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className={`shrink-0 border-t border-rose-500/10 ${isCollapsed ? "px-1.5 py-2" : "px-2.5 py-2.5"}`}>
                {/* Back to site */}
                <Link
                    href="/studio"
                    title={isCollapsed ? "Back to studio" : undefined}
                    className={[
                        "flex items-center gap-2 rounded-md text-offgray-500 hover:text-offgray-200 hover:bg-white/[0.04] transition-colors mb-0.5",
                        isCollapsed ? "justify-center w-9 h-9 mx-auto" : "h-8 px-2",
                    ].join(" ")}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    {!isCollapsed && <span className="text-[12px] tracking-tight">Studio</span>}
                </Link>
                <Link
                    href="/home"
                    title={isCollapsed ? "Back to site" : undefined}
                    className={[
                        "flex items-center gap-2 rounded-md text-offgray-500 hover:text-offgray-200 hover:bg-white/[0.04] transition-colors mb-2",
                        isCollapsed ? "justify-center w-9 h-9 mx-auto" : "h-8 px-2",
                    ].join(" ")}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    {!isCollapsed && <span className="text-[12px] tracking-tight">Main Site</span>}
                </Link>

                {/* User */}
                {isMounted && user && (
                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className={[
                                "w-full flex items-center gap-2.5 rounded-md hover:bg-white/[0.04] transition-colors",
                                isCollapsed ? "justify-center p-1.5" : "px-2 py-1.5",
                            ].join(" ")}
                        >
                            <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center overflow-hidden shrink-0">
                                {user.avatarUrl ? (
                                    <Image
                                        src={getStorageUrl(user.avatarUrl)}
                                        alt={user.displayName || "Admin"}
                                        width={28}
                                        height={28}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-[10px] font-medium">
                                        {user.username?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-[12px] font-medium text-offgray-100 truncate leading-tight">
                                        {user.displayName}
                                    </p>
                                    <p className="text-[10px] text-offgray-600 truncate leading-tight">
                                        @{user.username}
                                    </p>
                                </div>
                            )}
                            {!isCollapsed && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-offgray-600">
                                    <path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" />
                                </svg>
                            )}
                        </button>

                        {/* User dropdown menu */}
                        {isUserMenuOpen && (
                            <div className={`absolute z-50 bg-[#0f1115] border border-white/[0.08] rounded-lg shadow-xl py-1 w-48 ${isCollapsed ? "left-full ml-2 bottom-0" : "bottom-full mb-2 left-0"}`}>
                                <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                                    <p className="text-[13px] font-medium text-offgray-50 truncate">{user.displayName}</p>
                                    <p className="text-[11px] text-offgray-500 truncate">@{user.username}</p>
                                </div>
                                <Link
                                    href="/settings"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-offgray-200 hover:bg-white/[0.04] transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    Settings
                                </Link>
                                <button
                                    onClick={() => { setIsUserMenuOpen(false); handleLogout(); }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-red-400 hover:bg-white/[0.04] transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Log Out
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Collapse toggle — desktop only (hidden in mobile drawer) */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden md:flex items-center justify-center w-full h-8 mt-1.5 rounded-md text-offgray-600 hover:text-offgray-400 hover:bg-white/[0.04] transition-colors"
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={`transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}
                    >
                        <path d="m11 17-5-5 5-5" />
                        <path d="m18 17-5-5 5-5" />
                    </svg>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={[
                    "hidden md:flex flex-col fixed top-0 left-0 h-screen bg-[#0a0c0f] border-r border-rose-500/10 z-30 transition-all duration-200",
                    isCollapsed ? "w-[56px]" : "w-[240px]",
                ].join(" ")}
            >
                {sidebarContent}
            </aside>

            {/* Desktop spacer (pushes content) */}
            <div className={`hidden md:block shrink-0 transition-all duration-200 ${isCollapsed ? "w-[56px]" : "w-[240px]"}`} />

            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-2.5 px-4 h-14 shrink-0 bg-[#0a0c0f]/80 backdrop-blur-xl border-b border-rose-500/10">
                <Link href="/admin" className="flex items-center gap-2 select-none">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-[14px] font-medium text-offgray-50 tracking-tight">
                        script<span className="text-rose-400">hub</span>
                    </span>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5 ml-1">
                        Admin
                    </span>
                </Link>
                <button
                    className="p-2 text-offgray-500 hover:text-offgray-200 transition-colors rounded-md"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileOpen ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
                        </svg>
                    )}
                </button>
            </div>


            {/* Mobile overlay */}
            {isMobileOpen && (
                <>
                    <div
                        className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsMobileOpen(false)}
                    />
                    <aside className="md:hidden fixed top-0 left-0 h-full w-[260px] z-50 bg-[#0a0c0f] border-r border-rose-500/10 flex flex-col animate-in slide-in-from-left duration-200">
                        {sidebarContent}
                    </aside>
                </>
            )}
        </>
    );
}
