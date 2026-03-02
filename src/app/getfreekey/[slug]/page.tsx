"use client";
import { envConfig } from '@/lib/config/env';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getStorageUrl } from "@/lib/utils/image";
import { getFreeKeyBaseUrl } from "@/lib/utils/getkey";

interface ScriptInfo {
    title: string;
    description: string;
    slug: string;
    thumbnail_url?: string;
    game?: {
        name: string;
        logo_url: string;
    };
    hub?: {
        name: string;
        logo_url: string;
        is_verified: boolean;
        is_official: boolean;
    };
    owner?: {
        username: string;
        avatar_url: string;
    };
}

export default function GetFreeKeyLandingPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<ScriptInfo | null>(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        const fetchScriptInfo = async () => {
            try {
                const baseUrl = envConfig.apiBaseUrl;
                const res = await fetch(`${baseUrl}/keys/public/script/${slug}`);
                const data = await res.json();

                if (data.success) {
                    setInfo(data.data);
                } else {
                    setError(data.message || "Failed to load script info");
                }
            } catch (err) {
                setError("Failed to connect to server");
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchScriptInfo();
    }, [slug]);

    const handleStartSession = async (network: string = 'official') => {
        if (!info || starting) return;
        setStarting(true);
        setError(null);

        // Save network choice to localStorage for the checkpoint flow
        localStorage.setItem(`getfreekey_path_${slug}`, network);

        // Official gateway: redirect directly to checkpoint page (session will be created there)
        if (network === "official") {
            const redirectBase = getFreeKeyBaseUrl();
            window.location.href = `${redirectBase}/${slug}/checkpoint`;
            return;
        }

        try {
            const baseUrl = envConfig.apiBaseUrl;

            const res = await fetch(`${baseUrl}/keys/public/start-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    scriptSlug: slug,
                    network: network
                })
            });
            const data = await res.json();

            if (data.success) {
                const { redirectUrl } = data.data;

                if (redirectUrl) {
                    // Work.ink / Linkvertise: redirect to external provider
                    window.location.href = redirectUrl;
                } else {
                    setError("No redirect URL available for this provider.");
                    setStarting(false);
                }
            } else {
                setError(data.message || "Failed to start session");
                setStarting(false);
            }
        } catch (err) {
            setError("Network error starting session");
            setStarting(false);
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-8 h-8 border-2 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin mx-auto" />
                    <p className="text-[11px] font-mono text-offgray-500 uppercase tracking-widest">Loading...</p>
                </div>
            </div>
        );
    }

    if (error || !info) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-serif text-offgray-50">Unavailable</h1>
                        <p className="text-sm font-mono text-offgray-500">{error || "Script not found"}</p>
                    </div>
                    <button
                        onClick={() => router.push('https://scripthub.id')}
                        className="h-10 px-6 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] text-offgray-300 text-[11px] font-mono uppercase tracking-widest transition-all"
                    >
                        Return to ScriptHub
                    </button>
                </div>
            </div>
        );
    }

    const authorName = info.hub ? info.hub.name : (info.owner?.username || "Unknown Developer");
    const authorImage = info.hub && info.hub.logo_url
        ? getStorageUrl(info.hub.logo_url)
        : (info.owner?.avatar_url ? getStorageUrl(info.owner.avatar_url) : '/logo.svg');
    const isVerified = info.hub?.is_verified;
    const isOfficial = info.hub?.is_official;

    return (
        <div className="min-h-screen py-12 px-4 flex flex-col items-center relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none opacity-30 animate-pulse-slow" />

            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-10 relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <Image src="/logo.svg" alt="ScriptHub" width={18} height={18} />
                </div>
                <span className="font-semibold text-lg bg-gradient-to-r from-white to-offgray-400 bg-clip-text text-transparent tracking-tight">ScriptHub</span>
            </div>

            <div className="relative z-10 w-full max-w-xl bg-black/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Inner Top Highlight */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                {/* Header / Game Banner */}
                <div className="h-36 bg-[#0a0c10] relative">
                    {info.thumbnail_url ? (
                        <>
                            <Image
                                src={getStorageUrl(info.thumbnail_url)}
                                alt={info.title}
                                fill
                                sizes="(max-width: 640px) 100vw, 576px"
                                className="object-cover opacity-50 mix-blend-luminosity hover:mix-blend-normal hover:opacity-100 transition-all duration-700"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-black/40 to-black/80" />
                    )}

                    {info.game && (
                        <div className="absolute bottom-4 left-5 flex items-center gap-3 z-10">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0a0c10] border border-white/[0.08] shrink-0">
                                <Image
                                    src={getStorageUrl(info.game.logo_url)}
                                    alt={info.game.name}
                                    width={40} height={40}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                                {info.game.name}
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-5 sm:p-8 space-y-6">
                    {/* Creator Info */}
                    <div className="flex items-center gap-4 pb-6 border-b border-white/[0.04]">
                        <div className="relative">
                            <Image
                                src={authorImage || '/logo.svg'}
                                alt={authorName}
                                width={44} height={44}
                                className="rounded-full bg-[#0a0c10] border border-white/[0.08] object-cover"
                            />
                            {(isVerified || isOfficial) && (
                                <div className="absolute -bottom-0.5 -right-0.5 bg-[#0a0c10] rounded-full p-0.5 border border-white/[0.08]">
                                    {isOfficial ? (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B981]">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                        </svg>
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                        </svg>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-offgray-600 uppercase tracking-widest">Created By</p>
                            <p className="font-semibold text-offgray-100">{authorName}</p>
                        </div>
                    </div>

                    {/* Script Info */}
                    <div className="space-y-3">
                        <h1 className="text-2xl sm:text-[28px] font-serif tracking-tight text-white leading-tight drop-shadow-sm">{info.title}</h1>
                        <p className="text-sm font-mono text-offgray-400 leading-relaxed line-clamp-3">
                            {info.description || "No description provided."}
                        </p>
                    </div>

                    {/* Security Notice */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 p-4 flex items-start gap-4">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            </svg>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[12px] font-semibold text-emerald-100 mb-0.5 tracking-wide">Secure Key Gateway</p>
                            <p className="text-[11px] font-mono text-emerald-500/80 leading-relaxed">
                                This script is heavily protected. Complete one of the secure paths below to generate your unique license key.
                            </p>
                        </div>
                    </div>

                    {/* Choice Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-px flex-1 bg-white/[0.04]" />
                            <span className="text-[10px] font-mono text-offgray-600 uppercase tracking-[0.2em]">Select Path</span>
                            <div className="h-px flex-1 bg-white/[0.04]" />
                        </div>

                        <div className="grid gap-3 pt-1">
                            {/* Option 1: Work.ink */}
                            <button
                                onClick={() => handleStartSession('workink')}
                                disabled={starting}
                                className="group relative w-full h-16 bg-white/[0.02] hover:bg-[#ff4e50]/5 border border-white/[0.06] hover:border-[#ff4e50]/30 rounded-xl transition-all duration-500 flex items-center px-4 gap-4 overflow-hidden shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#ff4e50]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Image src="/images/work-ink.png" alt="Work.ink" width={22} height={22} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-[13px] font-semibold text-offgray-100 group-hover:text-white transition-colors">Work.ink Path</p>
                                    <p className="text-[10px] font-mono text-offgray-500 uppercase tracking-wider">Multipurpose Gateway</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ff4e50]"><path d="m9 18 6-6-6-6" /></svg>
                                </div>
                            </button>

                            {/* Option 2: Linkvertise */}
                            <button
                                onClick={() => handleStartSession('linkvertise')}
                                disabled={starting}
                                className="group relative w-full h-16 bg-white/[0.02] hover:bg-[#005cbb]/5 border border-white/[0.06] hover:border-[#005cbb]/30 rounded-xl transition-all duration-500 flex items-center px-4 gap-4 overflow-hidden shadow-sm"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#005cbb]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Image src="/images/linkvertise_logo_small.svg" alt="Linkvertise" width={22} height={22} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-[13px] font-semibold text-offgray-100 group-hover:text-white transition-colors">Linkvertise Path</p>
                                    <p className="text-[10px] font-mono text-offgray-500 uppercase tracking-wider">Fast & Popular</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#005cbb]"><path d="m9 18 6-6-6-6" /></svg>
                                </div>
                            </button>

                            {/* Option 3: ScriptHub Ads (Official) */}
                            <button
                                onClick={() => handleStartSession('official')}
                                disabled={starting}
                                className="group relative w-full h-16 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 hover:from-emerald-500/20 hover:to-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all duration-500 flex items-center px-4 gap-4 overflow-hidden shadow-lg shadow-emerald-500/5"
                            >
                                <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Image src="/logo.svg" alt="" width={20} height={20} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[13px] font-semibold text-offgray-100 group-hover:text-white transition-colors">Official Gateway</p>
                                        <span className="text-[8px] font-mono bg-[#10B981]/20 text-[#10B981] px-1 rounded-sm uppercase">Secure</span>
                                    </div>
                                    <p className="text-[10px] font-mono text-offgray-500 uppercase tracking-wider">Direct Verification</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#10B981]"><path d="m9 18 6-6-6-6" /></svg>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Terms */}
                    <p className="text-center text-[10px] font-mono text-offgray-600 pt-2">
                        {starting ? (
                            <span className="flex items-center justify-center gap-2 text-blue-400">
                                <span className="inline-block w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                Initializing secure session...
                            </span>
                        ) : (
                            "By continuing, you agree to ScriptHub's Terms of Service."
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
