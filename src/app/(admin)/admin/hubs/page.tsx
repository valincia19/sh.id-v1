"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

interface AdminHub {
    id: string;
    name: string;
    slug: string;
    status: string;
    is_official: boolean;
    is_verified: boolean;
    discord_server: string | null;
    owner_username: string;
    owner_display_name: string;
    script_count: number;
    created_at: string;
}

const STATUS_TABS = [
    { label: "All", value: "" },
    { label: "Active", value: "active" },
    { label: "Pending", value: "pending" },
    { label: "Suspended", value: "suspended" },
];

const statusColor = (s: string) => {
    if (s === "active") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (s === "pending") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
};

// ── Fixed-position row menu ───────────────────────────────────────────────────
function HubRowMenu({ hub, isOpen, onToggle, onStatusChange, onDelete, onChangeOwner, onEdit, onClose }: {
    hub: AdminHub;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onStatusChange: (id: string, status: string) => void;
    onDelete: (h: AdminHub) => void;
    onChangeOwner: (h: AdminHub) => void;
    onEdit: (h: AdminHub) => void;
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
                        {hub.status !== "active" && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(hub.id, "active"); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-emerald-400 hover:text-emerald-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Approve Hub
                            </button>
                        )}
                        {hub.status !== "suspended" && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(hub.id, "suspended"); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-yellow-400 hover:text-yellow-300 hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" />
                                </svg>
                                Suspend Hub
                            </button>
                        )}
                        {hub.status === "suspended" && (
                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(hub.id, "pending"); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m9 14-4-4 4-4" /><path d="M5 10h11a4 4 0 0 1 0 8h-1" />
                                </svg>
                                Reset to Pending
                            </button>
                        )}
                        <div className="my-1 border-t border-white/[0.04]" />

                        <button onClick={(e) => { e.stopPropagation(); window.open(`/h/${hub.slug}`, "_blank"); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            View Hub
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(hub); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit Hub
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onChangeOwner(hub); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-indigo-400 hover:text-indigo-300 hover:bg-white/[0.04] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Change Owner
                        </button>
                        <div className="my-1 border-t border-white/[0.04]" />
                        <button onClick={(e) => { e.stopPropagation(); onDelete(hub); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.06] transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            Delete Hub
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminHubsPage() {
    const router = useRouter();
    const [hubs, setHubs] = useState<AdminHub[]>([]);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("");
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Change Owner State
    const [modOwnerHub, setModOwnerHub] = useState<AdminHub | null>(null);
    const [newOwnerUsername, setNewOwnerUsername] = useState("");
    const [isModOwnerLoading, setIsModOwnerLoading] = useState(false);

    // Edit Hub State
    const [editHub, setEditHub] = useState<AdminHub | null>(null);
    const [editForm, setEditForm] = useState({ name: "", slug: "", is_official: false, is_verified: false });
    const [isEditSaving, setIsEditSaving] = useState(false);

    const load = useCallback(async (q: string, status: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (q) params.set("search", q);
            if (status) params.set("status", status);
            const r = await apiClient.get(`/admin/hubs?${params}`);
            setHubs(r.data.data?.hubs ?? []);
            setTotal(r.data.data?.total ?? 0);
        } catch {
            setError("Failed to load hubs.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        authApi.getMe().then(({ user }) => { if (!user?.roles?.includes("admin")) { router.replace("/home"); return; } }).catch(() => router.replace("/home"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(search, activeTab), search === "" ? 0 : 350);
        return () => clearTimeout(t);
    }, [search, activeTab, load]);

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/admin/hubs/${id}/status`, { status });
            if (activeTab && status !== activeTab) {
                setHubs(prev => prev.filter(h => h.id !== id));
                setTotal(prev => prev - 1);
            } else {
                setHubs(prev => prev.map(h => h.id === id ? { ...h, status } : h));
            }
        } catch { alert("Failed to update hub status."); }
    };

    const handleDelete = async (hub: AdminHub) => {
        if (!confirm(`Delete hub "${hub.name}"? All its scripts will be disassociated.`)) return;
        try {
            await apiClient.delete(`/admin/hubs/${hub.id}`);
            setHubs(prev => prev.filter(h => h.id !== hub.id));
            setTotal(prev => prev - 1);
        } catch { alert("Failed to delete hub."); }
    };

    const handleChangeOwner = async () => {
        if (!modOwnerHub || !newOwnerUsername.trim()) return;
        setIsModOwnerLoading(true);
        try {
            const r = await apiClient.patch(`/admin/hubs/${modOwnerHub.id}/owner`, { username: newOwnerUsername });
            if (r.data.success) {
                setHubs(prev => prev.map(h => h.id === modOwnerHub.id ? { ...h, owner_username: newOwnerUsername, owner_display_name: newOwnerUsername } : h));
                setModOwnerHub(null);
                setNewOwnerUsername("");
                alert("Hub owner updated successfully.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to update hub owner.");
        } finally {
            setIsModOwnerLoading(false);
        }
    };

    const handleEdit = (hub: AdminHub) => {
        setEditForm({ name: hub.name, slug: hub.slug, is_official: hub.is_official, is_verified: hub.is_verified });
        setEditHub(hub);
    };

    const saveEdit = async () => {
        if (!editHub) return;
        setIsEditSaving(true);
        try {
            await apiClient.patch(`/admin/hubs/${editHub.id}`, {
                name: editForm.name,
                slug: editForm.slug,
                is_official: editForm.is_official,
                is_verified: editForm.is_verified
            });
            setHubs(prev => prev.map(h => h.id === editHub.id ? { ...h, name: editForm.name, slug: editForm.slug, is_official: editForm.is_official, is_verified: editForm.is_verified } : h));
            setEditHub(null);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to update hub.");
        } finally {
            setIsEditSaving(false);
        }
    };

    return (
        <div className="space-y-5 pb-20 animate-in fade-in duration-500" onClick={() => setOpenMenuId(null)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-serif text-white">Hub Management</h1>
                    <p className="text-sm text-offgray-500 mt-1 font-mono">{isLoading ? "Loading…" : `${total} hubs`}</p>
                </div>
                <input type="text" placeholder="Search name, slug, owner…" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 placeholder-offgray-600 outline-none focus:border-rose-500/30 transition-all w-64" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/[0.06]">
                {STATUS_TABS.map(tab => (
                    <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                        className={["px-4 py-2 text-[13px] font-medium rounded-t-lg transition-all -mb-px border-b-2",
                            activeTab === tab.value ? "text-rose-300 border-rose-500 bg-rose-500/5" : "text-offgray-500 border-transparent hover:text-offgray-200 hover:bg-white/[0.03]"
                        ].join(" ")}>{tab.label}</button>
                ))}
            </div>

            {error && <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>{error}</div>}

            <div className="rounded-xl border border-white/[0.04] overflow-visible">
                <div className="overflow-x-auto rounded-xl">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                                {["Hub", "Owner", "Scripts", "Status", "Badges", "Discord", "Created", ""].map((h, i) => (
                                    <th key={i} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {isLoading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center">
                                    <div className="w-5 h-5 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
                                </td></tr>
                            ) : hubs.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-offgray-600 font-mono text-sm">
                                    No hubs{activeTab ? ` with status "${activeTab}"` : ""}{search ? ` matching "${search}"` : ""}.
                                </td></tr>
                            ) : (
                                hubs.map(h => (
                                    <tr key={h.id} className="hover:bg-white/[0.01] transition-colors" onClick={() => setOpenMenuId(null)}>
                                        <td className="px-4 py-3 max-w-[180px]">
                                            <p className="font-medium text-offgray-100 truncate">{h.name}</p>
                                            <p className="text-[10px] font-mono text-offgray-600 truncate">{h.slug}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <p className="text-offgray-300 text-[12px]">{h.owner_display_name || h.owner_username}</p>
                                            <p className="text-[10px] font-mono text-offgray-600">@{h.owner_username}</p>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-400 text-center">{h.script_count}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor(h.status)}`}>{h.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                {h.is_official && (
                                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400 border-rose-500/20">official</span>
                                                )}
                                                {h.is_verified && (
                                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20">verified</span>
                                                )}
                                                {!h.is_official && !h.is_verified && <span className="text-offgray-700 font-mono text-[10px]">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-offgray-500 text-[12px]">
                                            {h.discord_server
                                                ? <a href={h.discord_server} target="_blank" className="text-indigo-400 hover:underline truncate max-w-[100px] block">discord</a>
                                                : <span className="text-offgray-700">-</span>}
                                        </td>
                                        <td className="px-4 py-3 text-offgray-600 font-mono text-[11px] whitespace-nowrap">
                                            {h.created_at ? new Date(h.created_at).toLocaleDateString("id-ID") : "-"}
                                        </td>
                                        <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                                            <HubRowMenu hub={h} isOpen={openMenuId === h.id}
                                                onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === h.id ? null : h.id); }}
                                                onStatusChange={handleStatusChange}
                                                onDelete={handleDelete}
                                                onChangeOwner={(hub) => setModOwnerHub(hub)}
                                                onEdit={handleEdit}
                                                onClose={() => setOpenMenuId(null)} />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Change Owner Modal */}
            {modOwnerHub && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0c0f]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setModOwnerHub(null)} />
                    <div className="relative w-full max-w-sm bg-[#0f1115] border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/[0.04]">
                            <h3 className="text-lg font-serif text-white">Change Hub Owner</h3>
                            <p className="text-xs text-offgray-500 mt-1 font-mono">Transfer &quot;{modOwnerHub.name}&quot; to another user.</p>
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
                                <p className="text-[10px] text-offgray-600 font-mono">Note: This will move the hub and all its scripts to the target user.</p>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button onClick={() => setModOwnerHub(null)} className="flex-1 h-10 text-[13px] font-medium text-offgray-400 hover:text-white transition-colors">Cancel</button>
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

            {/* Edit Hub Modal */}
            {editHub && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0c0f]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={() => setEditHub(null)} />
                    <div className="relative w-full max-w-sm bg-[#0f1115] border border-white/[0.06] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/[0.04]">
                            <h3 className="text-lg font-serif text-white">Edit Hub</h3>
                            <p className="text-xs text-offgray-500 mt-1 font-mono">Update "{editHub.name}" settings.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-3 pb-2">
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest mb-1">Hub Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 outline-none focus:border-rose-500/30 transition-all font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest mb-1">Hub Slug</label>
                                    <input
                                        type="text"
                                        value={editForm.slug}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, slug: e.target.value }))}
                                        className="w-full h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 outline-none focus:border-rose-500/30 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4 border-t border-white/[0.04] pt-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${editForm.is_verified ? 'bg-amber-500 border-amber-500' : 'bg-white/[0.04] border-white/[0.06] group-hover:border-white/[0.1]'}`}>
                                        {editForm.is_verified && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                    </div>
                                    <span className="text-[13px] font-mono text-offgray-200">Verified Hub <span className="text-offgray-500 text-[11px] block">(Amber checkmark)</span></span>
                                    <input type="checkbox" className="hidden" checked={editForm.is_verified} onChange={(e) => setEditForm(prev => ({ ...prev, is_verified: e.target.checked }))} />
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${editForm.is_official ? 'bg-rose-500 border-rose-500' : 'bg-white/[0.04] border-white/[0.06] group-hover:border-white/[0.1]'}`}>
                                        {editForm.is_official && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                    </div>
                                    <span className="text-[13px] font-mono text-offgray-200">Official Hub <span className="text-offgray-500 text-[11px] block">(Rose checkmark)</span></span>
                                    <input type="checkbox" className="hidden" checked={editForm.is_official} onChange={(e) => setEditForm(prev => ({ ...prev, is_official: e.target.checked }))} />
                                </label>
                            </div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3">
                            <button onClick={() => setEditHub(null)} className="flex-1 h-10 text-[13px] font-medium text-offgray-400 hover:text-white transition-colors">Cancel</button>
                            <button
                                onClick={saveEdit}
                                disabled={isEditSaving}
                                className="flex-[2] h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-lg transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                            >
                                {isEditSaving && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
