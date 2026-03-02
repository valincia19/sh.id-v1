"use client";
import { envConfig } from '@/lib/config/env';

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { getFreeKeyBaseUrl } from "@/lib/utils/getkey";

const SMARTLINK_URL = envConfig.smartlinkUrl || "https://www.effectivegatecpm.com/emir9zu0?key=f4680038fe11c74bdf3ca16d8d2bce63";

interface ScriptInfo {
    title: string;
    slug: string;
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const key = searchParams.get("key") || "";
    const expires = searchParams.get("expires") || "";
    const slug = searchParams.get("slug") || "";

    const [copied, setCopied] = useState(false);
    const [scriptName, setScriptName] = useState("...");
    const [timeLeft, setTimeLeft] = useState("");
    const [isExpired, setIsExpired] = useState(false);
    const [adVisited, setAdVisited] = useState(false);


    // Fetch script name
    useEffect(() => {
        if (!slug) return;
        const baseUrl = envConfig.apiBaseUrl;
        fetch(`${baseUrl}/keys/public/script/${slug}`)
            .then((r) => r.json())
            .then((d) => { if (d.success && d.data?.title) setScriptName(d.data.title); })
            .catch(() => setScriptName("Unknown"));
    }, [slug]);

    // Countdown
    useEffect(() => {
        if (!expires || expires === "null") {
            setTimeLeft("Lifetime");
            setIsExpired(false);
            return;
        }
        const target = new Date(expires).getTime();
        const tick = () => {
            const now = Date.now();
            if (target <= now) { setTimeLeft("Expired"); setIsExpired(true); return; }
            const diff = target - now;
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);

            // Format matching Studio Keys precisely + seconds (since it updates every second here)
            if (d > 0) {
                setTimeLeft(`${d}d ${h}h ${m}m left`);
            } else if (h > 0) {
                setTimeLeft(`${h}h ${m}m ${s}s left`);
            } else {
                setTimeLeft(`${m}m ${s}s left`);
            }
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expires]);

    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(key); } catch {
            const el = document.createElement("textarea"); el.value = key;
            document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
    };


    if (!key) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none opacity-40" />
                <div className="text-center space-y-3 relative z-10">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/10">
                        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                    <p className="text-sm font-mono text-rose-400/80 tracking-wide">No key found in URL.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 flex flex-col items-center bg-[#09090b] relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none opacity-30 animate-pulse-slow" />

            <div className="w-full max-w-[480px] space-y-6 animate-in fade-in duration-1000 relative z-10 pt-4">

                <div className="bg-black/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 rounded-2xl overflow-hidden p-6 sm:p-8 space-y-8 relative">
                    {/* Inner Top Highlight */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                    {/* Header */}
                    <section className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-serif tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
                                Key Generated
                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border drop-shadow-sm ${isExpired ? "bg-gradient-to-r from-red-500/10 to-red-500/20 text-red-400 border-red-500/30" : "bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 text-emerald-400 border-emerald-500/30"}`}>
                                    {isExpired ? "Expired" : "Active"}
                                </span>
                            </h1>
                            <p className="text-[13px] font-mono text-offgray-400">{scriptName}</p>
                        </div>
                    </section>

                    {/* Countdown */}
                    <div className={`flex items-center justify-between px-5 py-3.5 rounded-xl border shadow-sm ${isExpired ? "bg-gradient-to-r from-red-500/5 to-transparent border-red-500/20" : "bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20"}`}>
                        <span className="text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest">Time Remaining</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-[15px] font-mono font-bold tracking-wider drop-shadow-sm ${isExpired ? "text-red-400" : "text-emerald-400"}`}>
                                {timeLeft || "..."}
                            </span>
                            {!isExpired && timeLeft && timeLeft !== "Lifetime" && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Key Display */}
                    <div className="space-y-2.5">
                        <span className="text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest pl-1">Your License Key</span>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-black/60 border border-white/[0.08] shadow-inner rounded-xl px-4 py-3.5 overflow-x-auto select-none relative group">
                                <span className="text-[14px] font-mono font-medium text-emerald-400 whitespace-nowrap tracking-wider pointer-events-none drop-shadow-sm">{key}</span>
                            </div>
                            <button
                                onClick={() => {
                                    handleCopy();
                                    window.open(SMARTLINK_URL, "_blank", "noopener,noreferrer");
                                }}
                                className={`h-[52px] px-5 rounded-xl text-[13px] font-semibold transition-all duration-300 shrink-0 shadow-sm ${copied
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10"
                                    : "bg-white/[0.04] text-white border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.08]"
                                    }`}
                            >
                                {copied ? "Copied!" : "Copy"}
                            </button>
                        </div>
                    </div>

                    {/* Expiry info */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-offgray-500 pt-2 px-1">
                        <span>Expiration Date</span>
                        <span className="text-offgray-300">{expires && expires !== "null" ? new Date(expires).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Never (Lifetime)"}</span>
                    </div>

                    {/* Actions */}
                    {slug && (
                        <div className="pt-2">
                            <button
                                onClick={() => {
                                    window.open(SMARTLINK_URL, "_blank", "noopener,noreferrer");
                                    window.location.href = `${getFreeKeyBaseUrl()}/${slug}`;
                                }}
                                className="w-full h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] text-[13px] font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                Generate Another Key
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-[11px] font-mono text-offgray-700/80 pt-2 uppercase tracking-[0.2em]">Powered by ScriptHub.id Enterprise</p>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin relative z-10" />
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
