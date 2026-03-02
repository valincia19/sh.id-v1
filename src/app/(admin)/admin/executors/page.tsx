"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface Executor {
    id: string;
    name: string;
    slug: string;
    status: string;
    owner_username?: string;
    version_count: number;
    created_at: string;
    deleted_at?: string;
}

const TABS = [
    { label: "All", value: "" },
    { label: "Active", value: "active" },
    { label: "Pending", value: "pending" },
    { label: "Archived", value: "archived" },
    { label: "Deleted", value: "deleted" },
];

const statusColor = (s: string, isDeleted: boolean = false) => {
    if (isDeleted) return "bg-white/[0.04] text-offgray-500 border-white/[0.06]";
    if (s === "active") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s === "pending") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    if (s === "archived") return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
};

function ExecutorRowMenu({ executor, isOpen, onToggle, onStatusChange, onChangeOwner, onDelete, onRestore, onClose }: {
    executor: Executor;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onStatusChange: (id: string, status: string) => void;
    onChangeOwner: (e: Executor) => void;
    onDelete: (e: Executor) => void;
    onRestore: (id: string) => void;
    onClose: () => void;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.top - 8, left: rect.right - 160 });
        }
    }, [isOpen]);

    return (
        <div className="relative inline-flex justify-end">
            <button ref={btnRef} onClick={onToggle}
                className="w-7 h-7 rounded-md flex items-center justify-center text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); onClose(); }} />
                    <div className="fixed z-[70] w-48 py-1 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, transform: "translateY(-100%)" }}>

                        {/* Status Actions */}
                        {executor.status !== "active" && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(executor.id, "active"); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Approve Executor
                            </button>
                        )}
                        {executor.status !== "rejected" && executor.status !== "active" && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(executor.id, "rejected"); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                Reject Executor
                            </button>
                        )}
                        {(executor.status === "active" || executor.status === "rejected") && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(executor.id, "archived"); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-400 hover:text-offgray-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="5" x="2" y="4" rx="2" /><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" /><path d="M10 13h4" />
                                </svg>
                                Archive Executor
                            </button>
                        )}

                        <div className="my-1 border-t border-white/[0.04]" />

                        <button onClick={(e) => { e.stopPropagation(); window.open(`/e/${executor.slug}`, "_blank"); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            View Executor
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onChangeOwner(executor); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.04] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Change Owner
                        </button>
                        <div className="my-1 border-t border-white/[0.04]" />
                        {!executor.deleted_at ? (
                            <button onClick={(e) => { e.stopPropagation(); onDelete(executor); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.06] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                                Delete Executor
                            </button>
                        ) : (
                            <button onClick={(e) => { e.stopPropagation(); onRestore(executor.id); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                </svg>
                                Restore Executor
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default function AdminExecutorsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [executors, setExecutors] = useState<Executor[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("");
    const [total, setTotal] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Change Owner State
    const [modOwnerExec, setModOwnerExec] = useState<Executor | null>(null);
    const [newOwnerUsername, setNewOwnerUsername] = useState("");
    const [isModOwnerLoading, setIsModOwnerLoading] = useState(false);

    const loadExecutors = useCallback(async (q: string, status: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (q) params.set("search", q);
            if (status) params.set("status", status);
            const r = await apiClient.get(`/admin/executors?${params}`);
            setExecutors(r.data.data.executors ?? []);
            setTotal(r.data.data.total ?? 0);
        } catch {
            setError("Failed to load executors.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        authApi.getMe().then(({ user }) => { if (!user?.roles?.includes("admin")) { router.replace("/home"); return; } }).catch(() => router.replace("/home"));
    }, [router]);

    useEffect(() => {
        const t = setTimeout(() => loadExecutors(search, activeTab), search === "" ? 0 : 350);
        return () => clearTimeout(t);
    }, [search, activeTab, loadExecutors]);

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/admin/executors/${id}/status`, { status });
            setExecutors(prev => prev.map(e => e.id === id ? { ...e, status } : e));
        } catch {
            alert("Failed to update executor status.");
        }
    };

    const handleDelete = async (executor: Executor) => {
        if (!confirm(`Delete "${executor.name}"? This is a soft-delete.`)) return;
        try {
            await apiClient.delete(`/admin/executors/${executor.id}`);
            if (activeTab === "deleted") {
                loadExecutors(search, activeTab);
            } else {
                setExecutors(prev => prev.filter(e => e.id !== executor.id));
                setTotal(prev => prev - 1);
            }
        } catch { alert("Failed to delete executor."); }
    };

    const handleRestore = async (id: string) => {
        try {
            await apiClient.patch(`/admin/executors/${id}/restore`);
            setExecutors(prev => prev.filter(e => e.id !== id));
            setTotal(prev => prev - 1);
            alert("Executor restored successfully.");
        } catch { alert("Failed to restore executor."); }
    };

    const handleChangeOwner = async () => {
        if (!modOwnerExec || !newOwnerUsername.trim()) return;
        setIsModOwnerLoading(true);
        try {
            const r = await apiClient.patch(`/admin/executors/${modOwnerExec.id}/owner`, { username: newOwnerUsername });
            if (r.data.success) {
                setExecutors(prev => prev.map(e => e.id === modOwnerExec.id ? { ...e, owner_username: newOwnerUsername } : e));
                setModOwnerExec(null);
                setNewOwnerUsername("");
                alert("Executor owner updated successfully.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to update executor owner.");
        } finally {
            setIsModOwnerLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500" onClick={() => setOpenMenuId(null)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-serif text-white">Executors</h1>
                    <p className="text-sm text-offgray-500 mt-1 font-mono">
                        {isLoading ? "Loading…" : `${total} executors found`}
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Search name, slug, owner…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 placeholder-offgray-600 outline-none focus:border-rose-500/30 transition-all w-64"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/[0.06]">
                {TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={[
                            "px-4 py-2 text-[13px] font-medium rounded-t-lg transition-all -mb-px border-b-2",
                            activeTab === tab.value
                                ? "text-rose-300 border-rose-500 bg-rose-500/5"
                                : "text-offgray-500 border-transparent hover:text-offgray-200 hover:bg-white/[0.03]",
                        ].join(" ")}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>{error}</div>
            )}

            <div className="rounded-xl border border-white/[0.04] overflow-visible">
                <table className="w-full text-[13px]">
                    <thead>
                        <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                            {["Name", "Owner", "Slug", "Status", "Versions", "Created", ""].map((h, i) => (
                                <th key={i} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {isLoading ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center"><div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" /></td></tr>
                        ) : executors.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-offgray-600 font-mono text-sm">No executors found.</td></tr>
                        ) : (
                            executors.map((e) => (
                                <tr key={e.id} className="hover:bg-white/[0.01] transition-colors" onClick={() => setOpenMenuId(null)}>
                                    <td className="px-4 py-3 font-medium text-offgray-100">{e.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-offgray-300 text-[12px]">{e.owner_username || "-"}</span>
                                            {e.owner_username && <span className="text-[10px] text-offgray-600 font-mono">@{e.owner_username}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-offgray-500 font-mono text-[11px]">{e.slug}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor(e.status, !!e.deleted_at)}`}>
                                            {e.deleted_at ? "deleted" : e.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-offgray-400">{e.version_count ?? 0}</td>
                                    <td className="px-4 py-3 text-offgray-600 font-mono text-[11px]">
                                        {e.created_at ? new Date(e.created_at).toLocaleDateString("id-ID") : "-"}
                                    </td>
                                    <td className="px-4 py-2" onClick={ev => ev.stopPropagation()}>
                                        <ExecutorRowMenu executor={e} isOpen={openMenuId === e.id}
                                            onToggle={(ev) => { ev.stopPropagation(); setOpenMenuId(openMenuId === e.id ? null : e.id); }}
                                            onStatusChange={handleStatusChange}
                                            onChangeOwner={(exec) => setModOwnerExec(exec)}
                                            onDelete={handleDelete}
                                            onRestore={handleRestore}
                                            onClose={() => setOpenMenuId(null)} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Change Owner Modal */}
            {modOwnerExec && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0c0f]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setModOwnerExec(null)} />
                    <div className="relative w-full max-sm mb-48 max-w-sm bg-[#0f1115] border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/[0.04]">
                            <h3 className="text-lg font-serif text-white">Change Executor Owner</h3>
                            <p className="text-xs text-offgray-500 mt-1 font-mono">Transfer &quot;{modOwnerExec.name}&quot; to another user.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest">Target Username</label>
                                <input
                                    type="text"
                                    value={newOwnerUsername}
                                    onChange={(e) => setNewOwnerUsername(e.target.value)}
                                    placeholder="Enter username..."
                                    className="w-full h-10 px-3 bg-white/[0.04] border border-white/[0.06] rounded-lg text-sm text-offgray-200 outline-none focus:border-rose-500/30 transition-all font-mono"
                                />
                                <p className="text-[10px] text-offgray-600 font-mono">Note: This will move the executor and all its private releases to the target user.</p>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button onClick={() => setModOwnerExec(null)} className="flex-1 h-10 text-[13px] font-medium text-offgray-400 hover:text-white transition-colors">Cancel</button>
                            <button
                                onClick={handleChangeOwner}
                                disabled={isModOwnerLoading || !newOwnerUsername.trim()}
                                className="flex-[2] h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                            >
                                {isModOwnerLoading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                Transfer Ownership
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
