"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import apiClient from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface CDNFile {
    key: string;
    size: number;
    lastModified: string;
    eTag: string;
    storageClass: string;
    owner: { username: string; displayName: string } | null;
    deploymentTitle: string | null;
    deploymentStatus: string | null;
    deployKey: string | null;
}

interface CDNFolder {
    prefix: string;
    name: string;
    fileCount: number;
    totalSize: number;
}

interface CDNStats {
    [bucket: string]: {
        bucket: string;
        totalFiles: number;
        totalSize: number;
        status: string;
    };
}

const BUCKET_TABS = [
    { label: "Scripts", value: "scripts", icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="m10 15-2 2 2 2" /><path d="m14 15 2 2-2 2" /></svg>), domain: "v1.scripthub.id" },
    { label: "Images / CDN", value: "images", icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>), domain: "cdn.scripthub.id" },
];

const getCDNUrl = (bucket: string, key: string) => {
    const tab = BUCKET_TABS.find(t => t.value === bucket);
    return `https://${tab?.domain || "cdn.scripthub.id"}/${key}`;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatDate = (d: string) => {
    if (!d) return "-";
    const date = new Date(d);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) + " " +
        date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const getFileExtension = (key: string) => {
    const parts = key.split(".");
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : "-";
};

const getFileName = (key: string) => {
    const parts = key.split("/");
    return parts[parts.length - 1] || key;
};

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "ico", "bmp", "avif"];
const TEXT_EXTENSIONS = ["txt", "lua", "json", "js", "ts", "css", "html", "xml", "md", "yaml", "yml", "toml", "ini", "cfg", "log", "csv", "sql"];

const isImageFile = (key: string) => {
    const ext = key.split(".").pop()?.toLowerCase() || "";
    return IMAGE_EXTENSIONS.includes(ext);
};

const isTextFile = (key: string) => {
    const ext = key.split(".").pop()?.toLowerCase() || "";
    return TEXT_EXTENSIONS.includes(ext);
};

// ── Image Preview Modal ───────────────────────────────────────────────────────
function ImagePreviewModal({ file, imageUrl, onClose }: {
    file: CDNFile;
    imageUrl: string;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative z-10 max-w-[90vw] max-h-[90vh] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="w-full flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        <span className="text-[13px] font-mono text-offgray-200 truncate max-w-[400px]">{getFileName(file.key)}</span>
                        <span className="text-[10px] font-mono text-offgray-600">{formatBytes(file.size)}</span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>
                {/* Image */}
                <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0c0f] shadow-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt={file.key} className="max-w-[85vw] max-h-[80vh] object-contain" />
                </div>
                {/* Footer */}
                <p className="mt-2 text-[10px] font-mono text-offgray-600 truncate max-w-[600px]">{file.key}</p>
            </div>
        </div>
    );
}

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyButton({ content }: { content: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-[11px] font-mono border transition-all ${copied ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "text-offgray-400 hover:text-white bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08]"}`}>
            {copied ? (
                <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    Copied!
                </>
            ) : (
                <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                    Copy
                </>
            )}
        </button>
    );
}

// ── File Viewer Modal ─────────────────────────────────────────────────────────
function FileViewerModal({ file, content, truncated, isLoading, onClose }: {
    file: CDNFile;
    content: string;
    truncated: boolean;
    isLoading: boolean;
    onClose: () => void;
}) {
    const lines = content.split("\n");
    const lineNumWidth = String(lines.length).length;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0c0e13] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400 shrink-0">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                            <path d="m10 15-2 2 2 2" /><path d="m14 15 2 2-2 2" />
                        </svg>
                        <span className="text-[13px] font-mono text-offgray-200 truncate">{getFileName(file.key)}</span>
                        <code className="text-[10px] font-mono text-offgray-600 bg-white/[0.04] px-1.5 py-0.5 rounded shrink-0">{getFileExtension(file.key)}</code>
                        <span className="text-[10px] font-mono text-offgray-600 shrink-0">{formatBytes(file.size)}</span>
                        {truncated && <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">truncated</span>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <CopyButton content={content} />
                        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-offgray-400 hover:text-white hover:bg-white/[0.08] transition-colors">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="flex text-[12px] font-mono leading-[1.7]">
                            {/* Line numbers */}
                            <div className="shrink-0 select-none text-right pr-4 pl-4 py-4 text-offgray-700 border-r border-white/[0.04] bg-white/[0.01] sticky left-0">
                                {lines.map((_, i) => (
                                    <div key={i} style={{ width: `${lineNumWidth}ch` }}>{i + 1}</div>
                                ))}
                            </div>
                            {/* Code */}
                            <pre className="flex-1 py-4 px-4 text-offgray-200 overflow-x-auto">
                                <code>{content}</code>
                            </pre>
                        </div>
                    )}
                </div>
                {/* Footer */}
                <div className="shrink-0 px-5 py-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-offgray-600">
                    <span>{lines.length} lines</span>
                    <span>{file.key}</span>
                </div>
            </div>
        </div>
    );
}

// ── Row Menu ──────────────────────────────────────────────────────────────────
function CDNRowMenu({ file, bucket, isOpen, onToggle, onDelete, onViewImage, onViewFile, onClose }: {
    file: CDNFile;
    bucket: string;
    isOpen: boolean;
    onToggle: (e: React.MouseEvent) => void;
    onDelete: (f: CDNFile) => void;
    onViewImage: (f: CDNFile) => void;
    onViewFile: (f: CDNFile) => void;
    onClose: () => void;
}) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setMenuPos({ top: rect.top - 8, left: rect.right - 180 });
        }
    }, [isOpen]);

    const canViewImage = isImageFile(file.key);
    const canViewFile = isTextFile(file.key);

    return (
        <div className="relative inline-flex justify-end">
            <button
                ref={btnRef}
                onClick={onToggle}
                className="w-7 h-7 rounded-md flex items-center justify-center text-offgray-500 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={(e) => { e.stopPropagation(); onClose(); }} />
                    <div
                        className="fixed z-[70] w-44 py-1 bg-[#12151a] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px`, transform: "translateY(-100%)" }}
                    >
                        {/* View Image */}
                        {canViewImage && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewImage(file); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-violet-300 hover:text-violet-200 hover:bg-violet-500/[0.06] transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                                View Image
                            </button>
                        )}
                        {/* View File */}
                        {canViewFile && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewFile(file); onClose(); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-violet-300 hover:text-violet-200 hover:bg-violet-500/[0.06] transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
                                    <path d="m10 15-2 2 2 2" /><path d="m14 15 2 2-2 2" />
                                </svg>
                                View File
                            </button>
                        )}
                        {(canViewImage || canViewFile) && <div className="my-1 border-t border-white/[0.04]" />}
                        {/* Copy URL */}
                        <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(getCDNUrl(bucket, file.key)); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            Copy URL
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(file.eTag || ""); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-offgray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 9h16" /><path d="M4 15h16" /><path d="M10 3 8 21" /><path d="M16 3 14 21" />
                            </svg>
                            Copy ETag
                        </button>
                        <div className="my-1 border-t border-white/[0.04]" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(file); onClose(); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/[0.06] transition-colors"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                            Delete File
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Inner Page Component ──────────────────────────────────────────────────────
function AdminCDNContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Init from URL params so refresh preserves state
    const [files, setFiles] = useState<CDNFile[]>([]);
    const [folders, setFolders] = useState<CDNFolder[]>([]);
    const [activeBucket, setActiveBucket] = useState(searchParams.get("bucket") || "scripts");
    const [search, setSearch] = useState("");
    const [prefix, setPrefix] = useState(searchParams.get("path") || "");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [stats, setStats] = useState<CDNStats | null>(null);
    const [isTruncated, setIsTruncated] = useState(false);
    const [nextToken, setNextToken] = useState<string | null>(null);
    // Preview state
    const [previewImage, setPreviewImage] = useState<{ file: CDNFile; url: string } | null>(null);
    const [viewerFile, setViewerFile] = useState<{ file: CDNFile; content: string; truncated: boolean; isLoading: boolean } | null>(null);

    // ── Load CDN Stats ────────────────────────────────────────────────────────
    const loadStats = useCallback(async () => {
        try {
            const r = await apiClient.get("/admin/cdn/stats");
            setStats(r.data.data);
        } catch {
            // Non-critical, silently ignore
        }
    }, []);

    // ── Load Files ────────────────────────────────────────────────────────────
    const loadFiles = useCallback(async (bucket: string, pfx: string, token?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ bucket, maxKeys: "200" });
            if (pfx) params.set("prefix", pfx);
            if (token) params.set("continuationToken", token);
            const r = await apiClient.get(`/admin/cdn/files?${params}`);
            const data = r.data.data;
            setFiles(data.files || []);
            setFolders(data.folders || []);
            setIsTruncated(data.isTruncated);
            setNextToken(data.nextContinuationToken);
        } catch {
            setError("Failed to load CDN files.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auth check
    useEffect(() => {
        authApi.getMe().then(({ user }) => {
            if (!user?.roles?.includes("admin")) { router.replace("/home"); }
        }).catch(() => router.replace("/home"));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load stats once
    useEffect(() => { loadStats(); }, [loadStats]);

    // Load files on bucket/prefix change
    useEffect(() => {
        loadFiles(activeBucket, prefix);
    }, [activeBucket, prefix, loadFiles]);

    const handleDelete = async (file: CDNFile) => {
        if (!confirm(`Permanently delete "${file.key}" from S3?\n\nThis action CANNOT be undone.`)) return;
        try {
            await apiClient.delete(`/admin/cdn/files?bucket=${activeBucket}`, { data: { key: file.key } });
            setFiles(prev => prev.filter(f => f.key !== file.key));
            loadStats(); // Refresh stats
        } catch { alert("Failed to delete file."); }
    };

    const handleLoadMore = () => {
        if (nextToken) {
            loadFiles(activeBucket, prefix, nextToken);
        }
    };

    // ── Folder navigation with URL sync ───────────────────────────────────────
    const navigateToFolder = useCallback((bucket: string, path: string) => {
        setActiveBucket(bucket);
        setPrefix(path);
        setSearch("");
        // Update URL without full navigation
        const params = new URLSearchParams();
        params.set("bucket", bucket);
        if (path) params.set("path", path);
        window.history.replaceState(null, "", `/admin/cdn?${params}`);
    }, []);

    const handleViewImage = async (file: CDNFile) => {
        try {
            const r = await apiClient.get(`/admin/cdn/preview?bucket=${activeBucket}&key=${encodeURIComponent(file.key)}`);
            setPreviewImage({ file, url: r.data.data.url });
        } catch { alert("Failed to generate preview URL."); }
    };

    const handleViewFile = async (file: CDNFile) => {
        setViewerFile({ file, content: "", truncated: false, isLoading: true });
        try {
            const r = await apiClient.get(`/admin/cdn/content?bucket=${activeBucket}&key=${encodeURIComponent(file.key)}`);
            setViewerFile({ file, content: r.data.data.content, truncated: r.data.data.truncated, isLoading: false });
        } catch {
            setViewerFile(null);
            alert("Failed to fetch file content.");
        }
    };

    // Client-side search filter
    const filteredFiles = search
        ? files.filter(f => f.key.toLowerCase().includes(search.toLowerCase()))
        : files;

    const filteredFolders = search
        ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
        : folders;

    const currentStats = stats?.[activeBucket];

    return (
        <div className="space-y-5 pb-20 animate-in fade-in duration-500" onClick={() => setOpenMenuId(null)}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-serif text-white">CDN Management</h1>
                    <p className="text-sm text-offgray-500 mt-1 font-mono">
                        Manage files stored in your AWS S3 buckets
                    </p>
                </div>
                <input
                    type="text"
                    placeholder="Filter by filename…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-offgray-200 placeholder-offgray-600 outline-none focus:border-violet-500/30 transition-all w-64"
                />
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(stats).map(([name, s]) => (
                        <div key={name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-mono text-offgray-500 uppercase tracking-widest">{name}</p>
                                    <p className="text-[10px] font-mono text-offgray-600 mt-0.5">{s.bucket}</p>
                                </div>
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${s.status === "connected"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                    }`}>
                                    {s.status}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-4 mt-3">
                                <div>
                                    <p className="text-xl font-serif text-white">{s.totalFiles.toLocaleString()}</p>
                                    <p className="text-[10px] font-mono text-offgray-500">files</p>
                                </div>
                                <div>
                                    <p className="text-xl font-serif text-white">{formatBytes(s.totalSize)}</p>
                                    <p className="text-[10px] font-mono text-offgray-500">total size</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bucket Tabs */}
            <div className="flex gap-1 border-b border-white/[0.06]">
                {BUCKET_TABS.map(tab => (
                    <button key={tab.value} onClick={() => navigateToFolder(tab.value, "")}
                        className={[
                            "px-4 py-2 text-[13px] font-medium rounded-t-lg transition-all -mb-px border-b-2 flex items-center gap-1.5",
                            activeBucket === tab.value
                                ? "text-violet-300 border-violet-500 bg-violet-500/5"
                                : "text-offgray-500 border-transparent hover:text-offgray-200 hover:bg-white/[0.03]",
                        ].join(" ")}>
                        <span>{tab.icon}</span> {tab.label}
                        {currentStats && activeBucket === tab.value && (
                            <span className="ml-1 text-[10px] font-mono text-offgray-600">({currentStats.totalFiles})</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1 text-[12px] font-mono text-offgray-400 flex-wrap">
                <button
                    onClick={() => navigateToFolder(activeBucket, "")}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${prefix ? "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10" : "text-offgray-300 cursor-default"
                        }`}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                    </svg>
                    /
                </button>
                {prefix && prefix.split("/").filter(Boolean).map((segment, i, arr) => {
                    const pathUpTo = arr.slice(0, i + 1).join("/") + "/";
                    const isLast = i === arr.length - 1;
                    return (
                        <span key={pathUpTo} className="flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-700">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                            <button
                                onClick={() => !isLast && navigateToFolder(activeBucket, pathUpTo)}
                                className={`px-1.5 py-0.5 rounded transition-colors ${isLast
                                    ? "text-offgray-200 font-medium"
                                    : "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                                    }`}
                            >
                                {segment}
                            </button>
                        </span>
                    );
                })}
            </div>

            {error && <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm text-rose-400 font-mono flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>{error}</div>}

            {/* Table */}
            <div className="rounded-xl border border-white/[0.04] overflow-visible">
                <div className="overflow-x-auto rounded-xl">
                    <table className="w-full text-[13px]">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                                {["Key / Filename", "Owner", "Deployment", "Size", "Last Modified", ""].map((h, i) => (
                                    <th key={i} className="text-left px-4 py-3 text-[10px] font-mono font-bold text-offgray-600 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center">
                                    <div className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto" />
                                </td></tr>
                            ) : (filteredFolders.length === 0 && filteredFiles.length === 0) ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-offgray-600 font-mono text-sm">
                                    No files or folders{prefix ? ` in "${prefix}"` : ""}{search ? ` matching "${search}"` : ""}.
                                </td></tr>
                            ) : (
                                <>
                                    {/* Folder rows */}
                                    {filteredFolders.map(folder => (
                                        <tr
                                            key={folder.prefix}
                                            className="hover:bg-violet-500/[0.03] transition-colors cursor-pointer group"
                                            onClick={() => navigateToFolder(activeBucket, folder.prefix)}
                                        >
                                            <td className="px-4 py-3 max-w-[300px]">
                                                <div className="flex items-center gap-2">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400 shrink-0">
                                                        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                                                    </svg>
                                                    <span className="font-medium text-offgray-100 text-[12px] group-hover:text-violet-300 transition-colors">{folder.name}/</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-offgray-700 text-[11px]">—</td>
                                            <td className="px-4 py-3 text-offgray-700 text-[11px]">—</td>
                                            <td className="px-4 py-3">
                                                <span className="text-[11px] font-mono text-offgray-400">{formatBytes(folder.totalSize)}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-mono text-offgray-500">{folder.fileCount} files</span>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="text-[10px] font-mono text-offgray-600 bg-white/[0.03] px-1.5 py-0.5 rounded">folder</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* File rows */}
                                    {filteredFiles.map(f => (
                                        <tr key={f.key} className="hover:bg-white/[0.01] transition-colors group" onClick={() => setOpenMenuId(null)}>
                                            <td className="px-4 py-3 max-w-[300px]">
                                                <p className="font-medium text-offgray-100 truncate text-[12px]" title={f.key}>
                                                    {getFileName(f.key)}
                                                </p>
                                                <p className="text-[10px] font-mono text-offgray-600 truncate mt-0.5" title={f.key}>
                                                    {f.key}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {f.owner ? (
                                                    <div>
                                                        <p className="text-offgray-200 text-[12px]">{f.owner.displayName || f.owner.username}</p>
                                                        <p className="text-[10px] font-mono text-offgray-600">@{f.owner.username}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-mono text-offgray-700">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap max-w-[180px]">
                                                {f.deploymentTitle ? (
                                                    <div>
                                                        <p className="text-offgray-300 text-[12px] truncate">{f.deploymentTitle}</p>
                                                        <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded border ${f.deploymentStatus === "active"
                                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                            : "bg-white/[0.04] text-offgray-500 border-white/[0.06]"
                                                            }`}>{f.deploymentStatus}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-mono text-offgray-700">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-offgray-400 font-mono text-[11px] whitespace-nowrap">
                                                {formatBytes(f.size)}
                                            </td>
                                            <td className="px-4 py-3 text-offgray-500 font-mono text-[11px] whitespace-nowrap">
                                                {formatDate(f.lastModified)}
                                            </td>
                                            <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                                                <CDNRowMenu
                                                    file={f}
                                                    bucket={activeBucket}
                                                    isOpen={openMenuId === f.key}
                                                    onToggle={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === f.key ? null : f.key); }}
                                                    onDelete={handleDelete}
                                                    onViewImage={handleViewImage}
                                                    onViewFile={handleViewFile}
                                                    onClose={() => setOpenMenuId(null)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination / Load More */}
                {isTruncated && nextToken && !isLoading && (
                    <div className="border-t border-white/[0.04] px-4 py-3 text-center">
                        <button
                            onClick={handleLoadMore}
                            className="px-4 py-1.5 text-[12px] font-mono text-violet-400 hover:text-violet-300 border border-violet-500/20 hover:border-violet-500/40 rounded-lg transition-all hover:bg-violet-500/5"
                        >
                            Load More Files →
                        </button>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between text-[10px] font-mono text-offgray-600 px-1">
                <span>Showing {filteredFiles.length} files{isTruncated ? " (truncated)" : ""}</span>
                <span>Bucket: {BUCKET_TABS.find(t => t.value === activeBucket)?.label}</span>
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <ImagePreviewModal
                    file={previewImage.file}
                    imageUrl={previewImage.url}
                    onClose={() => setPreviewImage(null)}
                />
            )}

            {/* File Viewer Modal */}
            {viewerFile && (
                <FileViewerModal
                    file={viewerFile.file}
                    content={viewerFile.content}
                    truncated={viewerFile.truncated}
                    isLoading={viewerFile.isLoading}
                    onClose={() => setViewerFile(null)}
                />
            )}
        </div>
    );
}

import { Suspense as ReactSuspense } from "react";

export default function AdminCDNPage() {
    return (
        <ReactSuspense fallback={<div className="p-10 flex justify-center"><div className="w-5 h-5 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto" /></div>}>
            <AdminCDNContent />
        </ReactSuspense>
    );
}
