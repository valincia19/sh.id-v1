"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { keysApi, type LicenseKey, type KeyWithDevices, type KeyStats, type KeySettings, type ScriptOption } from "@/lib/api/keys";
import { plansApi, type PlanWithMaximums } from "@/lib/api/plans";
import Link from 'next/link';

// ============================================
// Helpers
// ============================================

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return "-";
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(mins / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    return formatDate(dateStr);
}

function maskHwid(hwid: string): string {
    if (hwid.length <= 8) return hwid;
    return hwid.slice(0, 4) + "••••" + hwid.slice(-4);
}

function maskIp(ip: string): string {
    const parts = ip.split(".");
    if (parts.length === 4) return parts[0] + "." + parts[1] + ".••.••";
    return ip;
}

const TYPE_DISPLAY: Record<string, string> = {
    lifetime: "Lifetime",
    timed: "Timed",
    device_locked: "Device Locked",
};

const STATUS_DISPLAY: Record<string, string> = {
    active: "Active",
    expired: "Expired",
    revoked: "Revoked",
    unused: "Unused",
};

// ============================================
// Main Component
// ============================================

export default function StudioKeysPage() {
    // Data state
    const [keys, setKeys] = useState<LicenseKey[]>([]);
    const [stats, setStats] = useState<KeyStats | null>(null);
    const [settings, setSettings] = useState<KeySettings | null>(null);
    const [scripts, setScripts] = useState<ScriptOption[]>([]);
    const [totalKeys, setTotalKeys] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // UI state
    const [selectedKey, setSelectedKey] = useState<KeyWithDevices | null>(null);
    const [devicePanelOpen, setDevicePanelOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterScriptId, setFilterScriptId] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

    // Plans & Maximums
    const [planData, setPlanData] = useState<PlanWithMaximums | null>(null);

    // ============================================
    // Data fetching
    // ============================================

    const fetchKeys = useCallback(async (p = 1, statusFilter = "all", scriptFilter = "all", searchFilter = "") => {
        try {
            const params: any = { page: p, limit: 20 };
            if (statusFilter !== "all") params.status = statusFilter;
            if (scriptFilter !== "all") params.scriptId = scriptFilter;
            if (searchFilter) params.search = searchFilter;
            const result = await keysApi.getMyKeys(params);
            setKeys(result.keys);
            setTotalKeys(result.total);
            setPage(result.page);
            setTotalPages(result.totalPages);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const s = await keysApi.getStats();
            setStats(s);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const s = await keysApi.getSettings();
            setSettings(s);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const fetchScripts = useCallback(async () => {
        try {
            const s = await keysApi.getScripts();
            setScripts(s);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const fetchPlanData = useCallback(async () => {
        try {
            const p = await plansApi.getMyPlan();
            setPlanData(p);
        } catch (err) {
            // error silently handled
        }
    }, []);

    // Initial load for mostly static data
    useEffect(() => {
        let mounted = true;
        const loadInitial = async () => {
            if (!mounted) return;
            await Promise.all([fetchStats(), fetchSettings(), fetchScripts(), fetchPlanData()]);
        };
        loadInitial();
        return () => { mounted = false; };
    }, []);

    // Re-fetch keys when filters or search query occur with debounce
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        const timeoutId = setTimeout(() => {
            fetchKeys(1, filterStatus, filterScriptId, searchQuery).finally(() => {
                if (mounted) setLoading(false);
            });
        }, 500);
        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [filterStatus, filterScriptId, searchQuery, fetchKeys]);

    // ============================================
    // Actions
    // ============================================

    const openDevicePanel = useCallback(async (key: LicenseKey) => {
        try {
            const full = await keysApi.getKeyById(key.id);
            setSelectedKey(full);
            setDevicePanelOpen(true);
        } catch (err) {
            // error silently handled
        }
    }, []);

    const closeDevicePanel = useCallback(() => {
        setDevicePanelOpen(false);
        setTimeout(() => setSelectedKey(null), 300);
    }, []);

    const handleRevoke = useCallback(async (keyId: string) => {
        try {
            await keysApi.revokeKey(keyId);
            fetchKeys(page);
            fetchStats();
        } catch (err) {
            // error silently handled
        }
    }, [page, fetchKeys, fetchStats]);

    const handleBulkRevoke = useCallback(async (keyIds: string[]) => {
        try {
            await keysApi.revokeKeys(keyIds);
            fetchKeys(page);
            fetchStats();
            setSelectedKeys([]);
        } catch (err) {
            // error silently handled
        }
    }, [page, fetchKeys, fetchStats]);

    const handleDelete = useCallback(async (keyId: string) => {
        try {
            await keysApi.deleteKey(keyId);
            fetchKeys(page);
            fetchStats();
        } catch (err) {
            // error silently handled
        }
    }, [page, fetchKeys, fetchStats]);

    const handleBulkDelete = useCallback(async (keyIds: string[]) => {
        try {
            await keysApi.deleteKeys(keyIds);
            fetchKeys(page);
            fetchStats();
            setSelectedKeys([]);
        } catch (err) {
            // error silently handled
        }
    }, [page, fetchKeys, fetchStats]);

    const handleRevokeDevice = useCallback(async (keyId: string, deviceId: string) => {
        try {
            await keysApi.revokeDevice(keyId, deviceId);
            // Refresh the panel
            const full = await keysApi.getKeyById(keyId);
            setSelectedKey(full);
            fetchKeys(page);
        } catch (err) {
            // error silently handled
        }
    }, [page, fetchKeys]);

    const handleResetHwid = useCallback(async (keyId: string) => {
        try {
            await keysApi.resetHwid(keyId);
            // Refresh the panel
            const full = await keysApi.getKeyById(keyId);
            setSelectedKey(full);
            fetchKeys(page);
        } catch (err) {
            // error silently handled
        }
    }, [page, fetchKeys]);

    const handleUpdateSettings = useCallback(async (key: string, value: boolean | number) => {
        if (!settings) return;
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            await keysApi.updateSettings({
                deviceLockEnabled: newSettings.device_lock_enabled,
                maxDevicesPerKey: newSettings.max_devices_per_key,
                rateLimitingEnabled: newSettings.rate_limiting_enabled,
                autoExpireEnabled: newSettings.auto_expire_enabled,
                hwidBlacklistEnabled: newSettings.hwid_blacklist_enabled,
            });
        } catch (err) {
            // error silently handled
            fetchSettings(); // revert on error
        }
    }, [settings, fetchSettings]);

    const handleGenerated = useCallback(() => {
        setGenerateModalOpen(false);
        fetchKeys(1);
        fetchStats();
        fetchPlanData(); // Re-fetch plan data to update credits
    }, [fetchKeys, fetchStats, fetchPlanData]);

    const handleGenerateApiKey = useCallback(async () => {
        try {
            const updated = await keysApi.generateApiKey();
            setSettings(updated);
        } catch (err) {
            // error silently handled
        }
    }, []);

    // ============================================
    // Render
    // ============================================

    return (
        <>
            <div className="space-y-8 animate-in fade-in duration-700">
                {/* ============================================ */}
                {/* Header */}
                {/* ============================================ */}
                <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5">
                        <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white">
                            Key System
                        </h1>
                        <p className="text-sm font-mono text-offgray-500 max-w-lg">
                            Manage license access, device bindings, and validation security.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setGenerateModalOpen(true)}
                            className="group relative inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-[#059669] hover:bg-[#10B981] text-[12px] font-medium text-white transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span className="relative z-10">Generate Keys</span>
                        </button>
                    </div>
                </section>

                {/* ============================================ */}
                {/* Section 1: Analytics Cards */}
                {/* ============================================ */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        label="Maximum Keys"
                        value={planData?.maximums.maximum_keys.toLocaleString() ?? "0"}
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.74V17l1 1 1-1v-1h1v-1h1v-2.26c1.8-1.25 3-3.35 3-5.74a7 7 0 0 0-7-7z" /><circle cx="12" cy="9" r="1" fill="currentColor" /></svg>}
                        color={planData?.plan.expires_at && new Date(planData.plan.expires_at) < new Date() ? "rose" : "emerald"}
                        sub1={<span className="text-emerald-600">{stats?.total_active ?? 0} active</span>}
                        sub2={`${Math.max(0, (planData?.maximums.maximum_keys ?? 0) - ((stats?.total_active ?? 0) + (stats?.total_unused ?? 0))).toLocaleString()} available`}
                        progress={Math.min(100, (((stats?.total_active ?? 0) + (stats?.total_unused ?? 0)) / (planData?.maximums.maximum_keys || 1)) * 100)}
                    />
                    <StatCard
                        label="Total Active Keys"
                        value={stats?.total_active?.toLocaleString() ?? "0"}
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                        color="emerald"
                        sub1="↑ +0% this month"
                    />
                    <StatCard
                        label="Expired Keys"
                        value={stats?.total_expired?.toLocaleString() ?? "0"}
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                        color="offgray"
                        sub1="↓ -0% this month"
                    />
                    <StatCard
                        label="Revoked Keys"
                        value={stats?.total_revoked?.toLocaleString() ?? "0"}
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>}
                        color="rose"
                        sub1="↓ -0% this month"
                    />
                    <StatCard
                        label="Active Devices"
                        value={stats?.total_devices?.toLocaleString() ?? "0"}
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /></svg>}
                        color="emerald"
                        sub1="↑ +0% this month"
                    />
                </section>

                {/* ============================================ */}
                {/* Section 2: Keys Table */}
                {/* ============================================ */}
                <section className="relative bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden group/table">
                    {/* Table Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                    {/* Table Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-2.5">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <h2 className="text-sm font-semibold text-offgray-100 tracking-wide">License Keys</h2>
                            <span className="text-[10px] font-mono text-offgray-600 bg-white/[0.04] rounded-full px-2 py-0.5">{totalKeys} keys</span>
                        </div>
                        <div className={`flex items-center gap-2 ${selectedKeys.length > 0 ? '' : 'w-full sm:w-auto justify-between sm:justify-end'}`}>
                            {selectedKeys.length > 0 ? (
                                <div className="flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-200">
                                    <span className="text-[11px] font-mono text-emerald-400 font-medium px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                                        {selectedKeys.length} selected
                                    </span>
                                    <button
                                        onClick={() => handleBulkRevoke(selectedKeys)}
                                        className="h-8 px-2.5 sm:px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] text-[11px] font-mono font-medium text-offgray-300 hover:text-white transition-all flex items-center gap-1.5"
                                        title="Revoke Selected"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                                        <span className="hidden sm:inline">Revoke</span>
                                    </button>
                                    <button
                                        onClick={() => handleBulkDelete(selectedKeys)}
                                        className="h-8 px-2.5 sm:px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30 text-[11px] font-mono font-medium text-rose-400 hover:text-rose-300 transition-all flex items-center gap-1.5"
                                        title="Delete Selected"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                        <span className="hidden sm:inline">Delete</span>
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Filter Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                                            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-mono transition-all border ${filterDropdownOpen || filterStatus !== "all" || filterScriptId !== "all" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-white/[0.03] border-white/[0.06] text-offgray-400 hover:border-white/[0.12] hover:bg-white/[0.05]"}`}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                            </svg>
                                            Filters
                                            {(filterStatus !== "all" || filterScriptId !== "all") && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                                            )}
                                        </button>
                                        {filterDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                                                <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-64 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 py-3 space-y-4">
                                                    {/* Status Option */}
                                                    <div className="px-4 space-y-2">
                                                        <label className="text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest pl-1">Key Status</label>
                                                        <select
                                                            value={filterStatus}
                                                            onChange={(e) => setFilterStatus(e.target.value)}
                                                            className="w-full h-8 px-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-mono text-offgray-200 outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
                                                        >
                                                            <option value="all">Any Status</option>
                                                            <option value="active">Active</option>
                                                            <option value="unused">Unused</option>
                                                            <option value="expired">Expired</option>
                                                            <option value="revoked">Revoked</option>
                                                        </select>
                                                    </div>

                                                    {/* Script Option */}
                                                    <div className="px-4 space-y-2">
                                                        <label className="text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest pl-1">Target Script</label>
                                                        <select
                                                            value={filterScriptId}
                                                            onChange={(e) => setFilterScriptId(e.target.value)}
                                                            className="w-full h-8 px-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-mono text-offgray-200 outline-none focus:border-emerald-500/30 transition-all appearance-none cursor-pointer"
                                                        >
                                                            <option value="all">All Scripts</option>
                                                            {scripts.map(s => (
                                                                <option key={s.id} value={s.id}>{s.title}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {(filterStatus !== "all" || filterScriptId !== "all") && (
                                                        <div className="px-4 pt-2 border-t border-white/[0.04]">
                                                            <button
                                                                onClick={() => { setFilterStatus("all"); setFilterScriptId("all"); }}
                                                                className="w-full h-8 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 text-[11px] font-mono font-semibold transition-colors"
                                                            >
                                                                Clear Filters
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="relative w-full sm:w-auto">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-offgray-600">
                                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search keys..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="h-8 pl-8 pr-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs font-mono text-offgray-300 placeholder:text-offgray-600 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all w-full sm:w-44"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/[0.04]">
                                    <th className="px-3 py-2.5 w-10">
                                        <div className="flex items-center justify-center">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    checked={keys.length > 0 && selectedKeys.length === keys.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedKeys(keys.map(k => k.id));
                                                        } else {
                                                            setSelectedKeys([]);
                                                        }
                                                    }}
                                                />
                                                <div className="w-4 h-4 rounded border border-white/20 bg-transparent flex items-center justify-center text-transparent peer-checked:bg-emerald-500 peer-checked:border-emerald-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/30 transition-all">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Key ID</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Script</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Roblox</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Executor</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Type</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Devices</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Expires</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Last Activity</th>
                                    <th className="px-3 py-2.5 text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest text-right whitespace-nowrap"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={11} className="px-5 py-12 text-center text-sm font-mono text-offgray-500">Loading keys...</td></tr>
                                ) : keys.length === 0 ? (
                                    <tr><td colSpan={11} className="px-5 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-offgray-600">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            </div>
                                            <p className="text-sm text-offgray-400">No keys generated yet</p>
                                            <p className="text-[11px] font-mono text-offgray-600">Click &quot;Generate Keys&quot; to create your first license key.</p>
                                        </div>
                                    </td></tr>
                                ) : keys.map((key) => (
                                    <tr
                                        key={key.id}
                                        className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer group/row"
                                        onClick={() => openDevicePanel(key)}
                                    >
                                        <td className="px-3 py-2.5 w-10" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center">
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        checked={selectedKeys.includes(key.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedKeys(prev => [...prev, key.id]);
                                                            } else {
                                                                setSelectedKeys(prev => prev.filter(id => id !== key.id));
                                                            }
                                                        }}
                                                    />
                                                    <div className="w-4 h-4 rounded border border-white/20 bg-transparent flex items-center justify-center text-transparent peer-checked:bg-emerald-500 peer-checked:border-emerald-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/30 group-hover/row:border-white/30 transition-all">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 group/copy">
                                                <span className="text-[12px] font-mono font-medium text-offgray-200 group-hover/row:text-white transition-colors" title={key.key_value}>
                                                    {key.key_value.length > 20 ? key.key_value.slice(0, 20) + "…" : key.key_value}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(key.key_value);
                                                    }}
                                                    className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-1 text-offgray-500 hover:text-emerald-400"
                                                    title="Copy Key"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="text-[12px] text-offgray-400">{key.script_name}</span>
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            {key.last_roblox_username ? (
                                                <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{key.last_roblox_username}</span>
                                            ) : (
                                                <span className="text-[11px] font-mono text-offgray-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            {key.last_executor ? (
                                                <span className="text-[11px] font-mono text-blue-400/90 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{key.last_executor}</span>
                                            ) : (
                                                <span className="text-[11px] font-mono text-offgray-600">-</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <TypeBadge type={key.type} />
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <DeviceCount used={key.devices_used} max={key.max_devices} />
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <StatusBadge status={key.status} />
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <ExpiresBadge keyData={key} />
                                        </td>
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className="text-[11px] font-mono text-offgray-500">{timeAgo(key.last_activity_at)}</span>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <RowActionMenu
                                                keyId={key.id}
                                                isOpen={openMenuId === key.id}
                                                onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === key.id ? null : key.id); }}
                                                onView={(e) => { e.stopPropagation(); setOpenMenuId(null); openDevicePanel(key); }}
                                                onRevoke={(e) => { e.stopPropagation(); setOpenMenuId(null); handleRevoke(key.id); }}
                                                onDelete={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDelete(key.id); }}
                                                onClose={() => setOpenMenuId(null)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.04]">
                        <p className="text-[11px] font-mono text-offgray-600">
                            {keys.length > 0 ? `Showing ${(page - 1) * 20 + 1}–${Math.min(page * 20, totalKeys)} of ${totalKeys}` : "No keys"}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fetchKeys(Math.max(1, page - 1), filterStatus, filterScriptId)}
                                disabled={page <= 1}
                                className="h-7 px-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => fetchKeys(Math.min(totalPages, page + 1), filterStatus, filterScriptId)}
                                disabled={page >= totalPages}
                                className="h-7 px-2.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>


            </div>

            {/* ============================================ */}
            {/* Device Activity Panel (Side Drawer) */}
            {/* ============================================ */}

            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${devicePanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={closeDevicePanel}
            />

            {/* Drawer */}
            <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#0b0d12] border-l border-white/[0.06] shadow-2xl transition-transform duration-300 ease-out ${devicePanelOpen ? "translate-x-0" : "translate-x-full"}`}>
                {selectedKey && (
                    <div className="flex flex-col h-full">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold text-white">Device Activity</h3>
                                <p className="text-[12px] font-mono text-offgray-500">{selectedKey.key_value}</p>
                            </div>
                            <button
                                onClick={closeDevicePanel}
                                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Key Info Summary */}
                        <div className="px-6 py-4 border-b border-white/[0.04] bg-white/[0.01]">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Script</p>
                                    <p className="text-[13px] text-offgray-200">{selectedKey.script_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Type</p>
                                    <TypeBadge type={selectedKey.type} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Status</p>
                                    <StatusBadge status={selectedKey.status} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Expires</p>
                                    <div className="pt-0.5">
                                        <ExpiresBadge keyData={selectedKey} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Device List */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">
                                    Bound Devices ({selectedKey.devices?.length ?? 0}/{selectedKey.max_devices})
                                </p>
                            </div>

                            {(!selectedKey.devices || selectedKey.devices.length === 0) ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-600">
                                            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-offgray-400">No devices bound</p>
                                    <p className="text-[11px] font-mono text-offgray-600 mt-1">This key has not been activated yet.</p>
                                </div>
                            ) : (
                                selectedKey.devices.map((device) => (
                                    <div key={device.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-colors group/device">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                                                        <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />
                                                    </svg>
                                                </div>
                                                <span className="text-[12px] font-mono font-medium text-offgray-200">{maskHwid(device.hwid)}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeDevice(selectedKey.id, device.id)}
                                                className="opacity-0 group-hover/device:opacity-100 transition-opacity text-[10px] font-mono font-semibold text-rose-400 hover:text-rose-300 uppercase tracking-wider px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-mono text-offgray-600 uppercase tracking-widest">Roblox User</p>
                                                {device.last_roblox_username ? (
                                                    <p className="inline-block px-1.5 py-0.5 mt-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[11px] font-mono text-emerald-400/90">{device.last_roblox_username}</p>
                                                ) : (
                                                    <p className="text-[12px] font-mono text-offgray-500">-</p>
                                                )}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-mono text-offgray-600 uppercase tracking-widest">Executor</p>
                                                {device.last_executor ? (
                                                    <p className="inline-block px-1.5 py-0.5 mt-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[11px] font-mono text-blue-400/90">{device.last_executor}</p>
                                                ) : (
                                                    <p className="text-[12px] font-mono text-offgray-500">-</p>
                                                )}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-mono text-offgray-600 uppercase tracking-widest">IP Address</p>
                                                <p className="text-[12px] font-mono text-offgray-400">{maskIp(device.ip_address || "-")}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-mono text-offgray-600 uppercase tracking-widest">First Seen</p>
                                                <p className="text-[12px] font-mono text-offgray-400">{formatDate(device.first_seen_at)}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-mono text-offgray-600 uppercase tracking-widest">Last Seen</p>
                                                <p className="text-[12px] font-mono text-offgray-400">{timeAgo(device.last_seen_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-4 border-t border-white/[0.06] flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                                {selectedKey.devices && selectedKey.devices.length > 0 && (
                                    <button
                                        onClick={() => handleResetHwid(selectedKey.id)}
                                        className="w-full h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 transition-colors"
                                    >
                                        Reset HWID
                                    </button>
                                )}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => navigator.clipboard.writeText(selectedKey.key_value)}
                                        className="flex-1 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-offgray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                                    >
                                        Copy Key
                                    </button>
                                    <button
                                        onClick={() => { handleRevoke(selectedKey.id); closeDevicePanel(); }}
                                        className="flex-1 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                                    >
                                        Revoke Key
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Generate Key Modal */}
            <GenerateKeyModal
                isOpen={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                scripts={scripts}
                onGenerated={handleGenerated}
                availableQuota={Math.max(0, (planData?.maximums.maximum_keys ?? 0) - ((stats?.total_active ?? 0) + (stats?.total_unused ?? 0)))}
                planType={planData?.plan.plan_type ?? "free"}
                maxDeviceLimit={planData?.maximums.maximum_devices_per_key ?? 1}
            />
        </>
    );
}

// ============================================
// Generate Key Modal
// ============================================

function GenerateKeyModal({ isOpen, onClose, scripts, onGenerated, availableQuota, planType, maxDeviceLimit }: {
    isOpen: boolean;
    onClose: () => void;
    scripts: ScriptOption[];
    onGenerated: () => void;
    availableQuota: number;
    planType: string;
    maxDeviceLimit: number;
}) {
    const [scriptId, setScriptId] = useState("");
    const canUseLifetime = planType === "custom";
    const [keyType, setKeyType] = useState<"lifetime" | "timed" | "device_locked">(canUseLifetime ? "lifetime" : "timed");
    const [maxDevices, setMaxDevices] = useState(1);
    const [expiryDays, setExpiryDays] = useState(30);
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState("");
    const [generating, setGenerating] = useState(false);
    const [scriptDropdownOpen, setScriptDropdownOpen] = useState(false);
    const [scriptSearch, setScriptSearch] = useState("");
    const filteredScripts = scripts.filter((s) => s.title.toLowerCase().includes(scriptSearch.toLowerCase()));
    const selectedScript = scripts.find((s) => s.id === scriptId);

    const handleGenerate = async () => {
        if (!scriptId || quantity > availableQuota) return;
        setGenerating(true);
        try {
            await keysApi.generateKeys({
                scriptId,
                type: keyType,
                maxDevices,
                quantity,
                expiresInDays: keyType === "timed" ? expiryDays : undefined,
                note: note || undefined,
            });
            // Reset form
            setScriptId("");
            setKeyType("lifetime");
            setMaxDevices(1);
            setExpiryDays(30);
            setQuantity(1);
            setNote("");
            onGenerated();
        } catch (err) {
            // error silently handled
        } finally {
            setGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="relative w-full max-w-lg bg-[#0b0d12] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 pointer-events-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                        <div className="space-y-1">
                            <h3 className="text-base font-semibold text-white">Generate Keys</h3>
                            <p className="text-[11px] font-mono text-offgray-500">Create new license keys for a script.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">Target Script</label>
                            <div className="relative">
                                {/* Selected / Trigger */}
                                <button
                                    type="button"
                                    onClick={() => setScriptDropdownOpen(!scriptDropdownOpen)}
                                    className={`w-full h-9 px-3 bg-white/[0.03] border rounded-lg text-[13px] font-mono outline-none transition-all flex items-center justify-between gap-2 ${scriptDropdownOpen ? "border-emerald-500/30 ring-1 ring-emerald-500/10" : "border-white/[0.08] hover:border-white/[0.12]"
                                        }`}
                                >
                                    {selectedScript ? (
                                        <span className="text-offgray-200 truncate">{selectedScript.title}</span>
                                    ) : (
                                        <span className="text-offgray-500">Select a script...</span>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                        {selectedScript && (
                                            <span
                                                onClick={(e) => { e.stopPropagation(); setScriptId(""); }}
                                                className="w-4 h-4 rounded flex items-center justify-center text-offgray-500 hover:text-white hover:bg-white/[0.08] transition-colors"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </span>
                                        )}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-offgray-500 transition-transform duration-200 ${scriptDropdownOpen ? "rotate-180" : ""}`}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>
                                </button>

                                {/* Dropdown */}
                                {scriptDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => { setScriptDropdownOpen(false); setScriptSearch(""); }} />
                                        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                            {/* Search input */}
                                            <div className="p-2 border-b border-white/[0.04]">
                                                <div className="relative">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-offgray-600">
                                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                                                    </svg>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        value={scriptSearch}
                                                        onChange={(e) => setScriptSearch(e.target.value)}
                                                        placeholder="Search scripts..."
                                                        className="w-full h-8 pl-8 pr-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[12px] font-mono text-offgray-200 placeholder:text-offgray-600 outline-none focus:border-emerald-500/20"
                                                    />
                                                </div>
                                            </div>
                                            {/* Options list */}
                                            <div className="max-h-44 overflow-y-auto py-1">
                                                {filteredScripts.length === 0 ? (
                                                    <p className="px-3 py-4 text-center text-[11px] font-mono text-offgray-600">No scripts found</p>
                                                ) : (
                                                    filteredScripts.map((s) => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setScriptId(s.id);
                                                                setScriptDropdownOpen(false);
                                                                setScriptSearch("");
                                                            }}
                                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono transition-colors ${scriptId === s.id
                                                                ? "text-emerald-400 bg-emerald-500/[0.06]"
                                                                : "text-offgray-300 hover:text-white hover:bg-white/[0.04]"
                                                                }`}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 shrink-0">
                                                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                                                            </svg>
                                                            <span className="truncate">{s.title}</span>
                                                            {scriptId === s.id && (
                                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-emerald-400">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">Key Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["lifetime", "timed", "device_locked"] as const).map((type) => {
                                    const isLifetimeLocked = type === "lifetime" && !canUseLifetime;
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => !isLifetimeLocked && setKeyType(type)}
                                            disabled={isLifetimeLocked}
                                            title={isLifetimeLocked ? "Lifetime keys require a Custom plan" : undefined}
                                            className={`h-9 rounded-lg text-[11px] font-mono font-semibold border transition-all ${isLifetimeLocked
                                                ? "bg-white/[0.01] border-white/[0.04] text-offgray-600 cursor-not-allowed opacity-50"
                                                : keyType === type
                                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                                    : "bg-white/[0.02] border-white/[0.06] text-offgray-400 hover:border-white/[0.12] hover:text-offgray-200"
                                                }`}
                                        >
                                            {TYPE_DISPLAY[type]}
                                            {isLifetimeLocked && " 🔒"}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">
                                    Max Devices <span className="text-offgray-600">(max {maxDeviceLimit})</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setMaxDevices((v) => Math.max(1, v - 1))} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm font-mono">−</button>
                                    <span className="text-sm font-mono font-semibold text-white w-8 text-center">{maxDevices}</span>
                                    <button onClick={() => setMaxDevices((v) => Math.min(maxDeviceLimit, v + 1))} disabled={maxDevices >= maxDeviceLimit} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center text-sm font-mono disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">
                                    Expires In {keyType !== "timed" && <span className="text-offgray-600">(N/A)</span>}
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={expiryDays}
                                        onChange={(e) => setExpiryDays(Number(e.target.value))}
                                        disabled={keyType !== "timed"}
                                        className="w-full h-9 px-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13px] text-offgray-200 font-mono outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    />
                                    <span className="text-[11px] font-mono text-offgray-500 shrink-0">days</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">Quantity</label>
                                <span className="text-[10px] font-mono text-offgray-600">
                                    {availableQuota.toLocaleString()} remaining
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={1}
                                    max={Math.min(availableQuota, 1000) || 1}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.min(Number(e.target.value), Math.min(availableQuota, 1000)))}
                                    disabled={availableQuota <= 0}
                                    className="flex-1 h-1.5 rounded-full appearance-none bg-white/[0.08] accent-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                                <input
                                    type="number"
                                    min={1}
                                    max={Math.min(availableQuota, 1000)}
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setQuantity(Math.max(1, Math.min(val, Math.min(availableQuota, 1000))));
                                    }}
                                    disabled={availableQuota <= 0}
                                    className="w-20 h-9 px-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13px] text-white font-mono text-center outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                            </div>
                            {availableQuota <= 0 && (
                                <p className="text-[10px] font-mono text-rose-400 flex items-center gap-1.5">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    You have reached your key quota. Upgrade your plan.
                                </p>
                            )}
                            {availableQuota > 1000 && (
                                <p className="text-[10px] font-mono text-offgray-600 flex items-center gap-1.5">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    Max 1,000 keys per generation. You can generate multiple batches.
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">Note <span className="text-offgray-600">(optional)</span></label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. Giveaway batch #12"
                                className="w-full h-9 px-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-[13px] text-offgray-200 font-mono placeholder:text-offgray-600 outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
                        <div className="flex flex-col">
                            <p className="text-[11px] font-mono text-offgray-500">
                                {quantity.toLocaleString()} key{quantity !== 1 ? "s" : ""} will be generated
                            </p>
                            <p className={`text-[10px] font-mono mt-0.5 ${quantity > availableQuota ? 'text-rose-400 font-semibold' : 'text-emerald-500/80'}`}>
                                Quota: {availableQuota.toLocaleString()} remaining slots
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-offgray-300 hover:bg-white/[0.08] hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={!scriptId || generating || availableQuota <= 0 || quantity > availableQuota}
                                className="group relative h-9 px-5 rounded-lg bg-[#059669] hover:bg-[#10B981] text-xs font-semibold text-white transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#059669]"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative z-10 flex items-center gap-1.5">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    {generating ? "Generating..." : quantity > availableQuota ? "Limit Exceeded" : "Generate"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ============================================
// Sub-components
// ============================================

type StatCardProps = {
    label: string;
    value: string;
    icon?: React.ReactNode;
    color?: "emerald" | "offgray" | "rose" | "amber";
    sub1?: React.ReactNode;
    sub2?: React.ReactNode;
    progress?: number;
};

function StatCard({ label, value, icon, color = "offgray", sub1, sub2, progress }: StatCardProps) {
    const colorStyles = {
        emerald: {
            border: "hover:border-emerald-500/20",
            glow: "via-emerald-500/20",
            dot: "bg-emerald-500/40 group-hover:bg-emerald-400",
            icon: "group-hover:text-emerald-500",
            bar: "bg-emerald-500",
        },
        rose: {
            border: "hover:border-rose-500/20",
            glow: "via-rose-500/20",
            dot: "bg-rose-500/40 group-hover:bg-rose-400",
            icon: "group-hover:text-rose-500",
            bar: "bg-rose-500",
        },
        amber: {
            border: "hover:border-amber-500/20",
            glow: "via-amber-500/20",
            dot: "bg-amber-500/40 group-hover:bg-amber-400",
            icon: "group-hover:text-amber-500",
            bar: "bg-amber-500",
        },
        offgray: {
            border: "hover:border-white/[0.08]",
            glow: "via-white/5",
            dot: "bg-white/10 group-hover:bg-offgray-400",
            icon: "group-hover:text-offgray-400",
            bar: "bg-offgray-500",
        },
    };

    const c = colorStyles[color];

    return (
        <div className={`group relative p-5 bg-[#0a0c10] border border-white/[0.04] rounded-xl hover:bg-white/[0.02] transition-all overflow-hidden ${c.border}`}>
            <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${c.glow} to-transparent`} />
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-mono font-medium text-offgray-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-sm transition-colors ${c.dot}`} />
                        {label}
                    </p>
                    {icon && (
                        <div className={`text-offgray-600 transition-colors ${c.icon}`}>
                            {icon}
                        </div>
                    )}
                </div>
                <p className="text-3xl font-serif tracking-tight text-white">{value}</p>

                {(progress !== undefined || sub1 || sub2) && (
                    <div className="space-y-1.5">
                        {progress !== undefined && (
                            <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${progress}%` }} />
                            </div>
                        )}
                        {(sub1 || sub2) && (
                            <div className="flex justify-between text-[10px] font-mono text-offgray-600">
                                {sub1 && <span>{sub1}</span>}
                                {sub2 && <span>{sub2}</span>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5",
        expired: "text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5",
        revoked: "text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-500/5",
        unused: "text-offgray-400 bg-white/[0.04] border-white/[0.08]",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border shadow-sm ${styles[status] || styles.unused}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-emerald-400 animate-pulse" : status === "expired" ? "bg-amber-400" : status === "revoked" ? "bg-rose-400" : "bg-offgray-500"}`} />
            {STATUS_DISPLAY[status] || status}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    const styles: Record<string, string> = {
        lifetime: "text-sky-300 bg-sky-500/10 border-sky-500/15",
        timed: "text-violet-300 bg-violet-500/10 border-violet-500/15",
        device_locked: "text-orange-300 bg-orange-500/10 border-orange-500/15",
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border uppercase tracking-wider ${styles[type] || ""}`}>
            {TYPE_DISPLAY[type] || type}
        </span>
    );
}

function DeviceCount({ used, max }: { used: number; max: number }) {
    const percentage = max > 0 ? (used / max) * 100 : 0;
    return (
        <div className="flex items-center gap-2">
            <div className="w-12 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${percentage >= 100 ? "bg-rose-400" : percentage >= 66 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span className="text-[11px] font-mono text-offgray-400">{used}/{max}</span>
        </div>
    );
}

function ExpiresBadge({ keyData }: { keyData: LicenseKey }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (keyData.status === "active" && keyData.expires_at) {
            const interval = setInterval(() => setNow(Date.now()), 60000);
            return () => clearInterval(interval);
        }
    }, [keyData.status, keyData.expires_at]);

    if (keyData.expires_at) {
        const expiresAt = new Date(keyData.expires_at).getTime();
        if (now > expiresAt || keyData.status === "expired") {
            return <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Expired</span>;
        } else {
            const diff = expiresAt - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            return (
                <span className="text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    {days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} left
                </span>
            );
        }
    }

    if (keyData.expires_in_days) {
        return (
            <span className="text-[11px] font-mono text-sky-400/90 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 cursor-help" title={`Expires ${keyData.expires_in_days} days after first use`}>
                {keyData.expires_in_days} Day(s)
            </span>
        );
    }

    return <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Lifetime</span>;
}

function RowActionMenu({ keyId, isOpen, onToggle, onView, onRevoke, onDelete, onClose }: {
    keyId: string;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onView: (e: React.MouseEvent) => void;
    onRevoke: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onClose: () => void;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setMenuPos({
                top: rect.top - 8,
                left: rect.right - 144,
            });
        }
    }, [isOpen]);

    return (
        <div className="relative inline-flex justify-end">
            <button
                ref={btnRef}
                onClick={onToggle}
                className="w-7 h-7 rounded-md flex items-center justify-center text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); onClose(); }} />

                    <div
                        className="fixed z-[70] w-36 py-1 bg-[#12151a] border border-white/[0.08] rounded-lg shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, transform: 'translateY(-100%)' }}
                    >
                        <button
                            onClick={onView}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <circle cx="12" cy="12" r="3" /><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            </svg>
                            View
                        </button>
                        <button
                            onClick={onRevoke}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-amber-400 hover:text-amber-300 hover:bg-amber-500/[0.06] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <path d="M18.36 6.64A9 9 0 0 1 20.77 15" /><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68" /><path d="m2 2 20 20" />
                            </svg>
                            Revoke
                        </button>
                        <div className="my-1 border-t border-white/[0.04]" />
                        <button
                            onClick={onDelete}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.06] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function ToggleRow({ title, description, enabled, onToggle }: { title: string; description: string; enabled: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.015] transition-colors">
            <div className="space-y-0.5 mr-4">
                <p className="text-[13px] font-medium text-offgray-200">{title}</p>
                <p className="text-[11px] font-mono text-offgray-500">{description}</p>
            </div>
            <button
                onClick={onToggle}
                className={`relative shrink-0 w-10 h-[22px] rounded-full transition-colors duration-300 ${enabled ? "bg-emerald-500" : "bg-white/[0.08]"}`}
            >
                <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${enabled ? "left-[22px]" : "left-[3px]"}`} />
            </button>
        </div>
    );
}
