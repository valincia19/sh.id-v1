"use client";
import { envConfig } from '@/lib/config/env';

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { getFreeKeyBaseUrl } from "@/lib/utils/getkey";

type Stage = "loading" | "checkpoints" | "captcha" | "completing" | "error";

interface CheckpointInfo {
    type: string;
    url: string;
    label: string;
}

export default function OfficialCheckpointPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [stage, setStage] = useState<Stage>("loading");
    const [error, setError] = useState<string | null>(null);

    // Session token (returned from start-session, sent via header)
    const sessionTokenRef = useRef<string | null>(null);

    // Session data
    const [totalCheckpoints, setTotalCheckpoints] = useState(0);
    const [timerSeconds, setTimerSeconds] = useState(10);
    const [captchaEnabled, setCaptchaEnabled] = useState(true);
    const [allCheckpointInfos, setAllCheckpointInfos] = useState<CheckpointInfo[]>([]);

    // Checkpoint completion tracking
    const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());
    const [activeIndex, setActiveIndex] = useState(0);

    // Timer
    const [countdown, setCountdown] = useState(0);
    const [timerStarted, setTimerStarted] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Captcha
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const turnstileRef = useRef<HTMLDivElement>(null);
    const turnstileLoadedRef = useRef(false);
    const initRef = useRef(false);

    const apiBase = envConfig.apiBaseUrl;

    // All checkpoints done?
    const allDone = completedSet.size >= totalCheckpoints;

    // Helper: build headers with session token
    const authHeaders = useCallback(
        (extra?: Record<string, string>) => ({
            "Content-Type": "application/json",
            ...(sessionTokenRef.current ? { "X-Session-Token": sessionTokenRef.current } : {}),
            ...extra,
        }),
        []
    );

    // Start session on mount
    useEffect(() => {
        if (!slug || initRef.current) return;
        initRef.current = true;

        const startSession = async () => {
            try {
                const res = await fetch(`${apiBase}/keys/public/start-session`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ scriptSlug: slug, network: "official" }),
                });
                const data = await res.json();

                if (!data.success) {
                    setError(data.message || "Failed to start session");
                    setStage("error");
                    return;
                }

                const d = data.data;

                // Store session token for header-based auth
                sessionTokenRef.current = d.sessionToken;

                const tc = d.totalCheckpoints || 0;
                const timer = d.checkpointTimerSeconds || 10;
                setTotalCheckpoints(tc);
                setTimerSeconds(timer);
                setCaptchaEnabled(d.captchaEnabled !== false);

                // Checkpoints come directly from start-session response
                if (d.checkpoints && d.checkpoints.length > 0) {
                    setAllCheckpointInfos(d.checkpoints);
                } else {
                    const fallback: CheckpointInfo[] = [];
                    for (let i = 0; i < tc; i++) fallback.push({ type: "ad", url: "", label: `Checkpoint ${i + 1}` });
                    setAllCheckpointInfos(fallback);
                }

                setActiveIndex(0);
                setCountdown(timer);
                setTimerStarted(false); // Timer starts at max but doesn't run until clicked
                setStage("checkpoints");
            } catch {
                setError("Network error starting session");
                setStage("error");
            }
        };

        startSession();
    }, [slug, apiBase]);

    // Countdown timer
    useEffect(() => {
        if (stage !== "checkpoints" || countdown <= 0 || allDone || !timerStarted) return;

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [stage, activeIndex, countdown > 0 ? "active" : "done", allDone, timerStarted]);

    // Click checkpoint button
    const handleCheckpointClick = useCallback(
        async (index: number) => {
            if (index !== activeIndex || completedSet.has(index)) return;

            // If timer not started yet, just start the timer and open the link. 
            // Don't advance on backend until timer finishes.
            if (!timerStarted) {
                // Open ad link
                const cp = allCheckpointInfos[index];
                if (cp?.url) {
                    let finalUrl = cp.url.trim();
                    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                        finalUrl = 'https://' + finalUrl;
                    }
                    window.open(finalUrl, "_blank", "noopener,noreferrer");
                }
                setTimerStarted(true);
                return;
            }

            // If timer is running and > 0, do nothing
            if (countdown > 0) return;

            // Timer is 0 and started, meaning it finished. Advance backend.
            try {
                const res = await fetch(`${apiBase}/keys/public/official/advance`, {
                    method: "POST",
                    headers: authHeaders(),
                    credentials: "include",
                });
                const data = await res.json();

                if (data.success) {
                    setCompletedSet((prev) => new Set(prev).add(index));
                    if (!data.data.completed) {
                        setActiveIndex(index + 1);
                        setCountdown(timerSeconds);
                        setTimerStarted(false); // Reset for next checkpoint
                    }
                } else if (data.retryAfter) {
                    setCountdown(data.retryAfter);
                    setTimerStarted(true); // Restart timer with retryAfter
                } else {
                    setError(data.message || "Failed to advance");
                }
            } catch {
                setError("Network error");
            }
        },
        [activeIndex, countdown, completedSet, allCheckpointInfos, apiBase, timerSeconds, authHeaders, timerStarted]
    );

    // Complete flow — generate key
    const doComplete = useCallback(async () => {
        setStage("completing" as Stage);
        try {
            const res = await fetch(`${apiBase}/keys/public/official/complete`, {
                method: "POST",
                headers: authHeaders(),
                credentials: "include",
            });
            const data = await res.json();
            if (data.success) {
                const { key, expiresAt, slug: s } = data.data;
                const redirectBase = getFreeKeyBaseUrl();
                window.location.href = `${redirectBase}/success?key=${encodeURIComponent(key)}&expires=${encodeURIComponent(expiresAt)}&slug=${encodeURIComponent(s)}`;
            } else {
                setError(data.message || "Failed to generate key");
                setStage("error");
            }
        } catch {
            setError("Network error completing flow");
            setStage("error");
        }
    }, [apiBase, authHeaders]);

    // Continue to verification / completion
    const handleContinue = useCallback(() => {
        if (!allDone) return;
        if (captchaEnabled) {
            setStage("captcha");
        } else {
            doComplete();
        }
    }, [allDone, captchaEnabled, doComplete]);

    // Turnstile captcha
    const widgetIdRef = useRef<string | null>(null);
    useEffect(() => {
        if (stage !== "captcha" || turnstileLoadedRef.current) return;
        turnstileLoadedRef.current = true;
        const renderWidget = () => {
            if (turnstileRef.current && (window as any).turnstile) {
                widgetIdRef.current = (window as any).turnstile.render(turnstileRef.current, {
                    sitekey: envConfig.turnstileSiteKey,
                    callback: (token: string) => setCaptchaToken(token),
                    theme: "dark",
                });
            }
        };
        if ((window as any).turnstile) {
            setTimeout(renderWidget, 100);
        } else {
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.onload = () => setTimeout(renderWidget, 100);
            document.head.appendChild(script);
        }
    }, [stage]);

    const handleVerifyCaptcha = useCallback(async () => {
        if (!captchaToken) return;
        try {
            const res = await fetch(`${apiBase}/keys/public/official/verify-captcha`, {
                method: "POST",
                headers: authHeaders(),
                credentials: "include",
                body: JSON.stringify({ turnstileToken: captchaToken }),
            });
            const data = await res.json();
            if (data.success) {
                await doComplete();
            } else {
                setError(data.message || "Captcha verification failed");
                // Reset Turnstile widget to get a fresh token
                setCaptchaToken(null);
                if ((window as any).turnstile && widgetIdRef.current != null) {
                    (window as any).turnstile.reset(widgetIdRef.current);
                }
            }
        } catch {
            setError("Network error verifying captcha");
            setCaptchaToken(null);
            if ((window as any).turnstile && widgetIdRef.current != null) {
                (window as any).turnstile.reset(widgetIdRef.current);
            }
        }
    }, [captchaToken, apiBase, authHeaders, doComplete]);

    // ──────────── RENDER ────────────

    if (stage === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
                <div className="text-center space-y-4 relative z-10">
                    <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                    <p className="text-[11px] font-mono text-emerald-500/80 uppercase tracking-widest drop-shadow-sm">Initializing Secure Session...</p>
                </div>
            </div>
        );
    }

    if (stage === "error") {
        return (
            <div className="min-h-screen py-10 px-4 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none opacity-40" />
                <div className="w-full max-w-md space-y-5 animate-in fade-in duration-700 relative z-10 bg-black/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10">
                            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-serif tracking-tight text-white drop-shadow-sm">Authorization Error</h1>
                            <p className="text-xs font-mono text-rose-400/80">{error}</p>
                        </div>
                    </div>
                    <button onClick={() => window.history.back()} className="w-full h-11 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] text-[13px] font-medium text-white transition-all shadow-sm">
                        ← Return to Gateway
                    </button>
                </div>
            </div>
        );
    }

    if ((stage as string) === "completing") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none opacity-60 animate-pulse" />
                <div className="text-center space-y-5 relative z-10">
                    <div className="w-12 h-12 border-[3px] border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    <p className="text-[13px] font-mono text-emerald-400 font-semibold tracking-[0.2em] uppercase drop-shadow-sm">Generating Secure Key...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4 flex flex-col items-center relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none opacity-40" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none opacity-20 animate-pulse-slow" />

            <div className="w-full max-w-[480px] space-y-6 animate-in fade-in duration-1000 relative z-10 pt-4">
                {/* Header */}
                <section className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
                        <Image src="/logo.svg" alt="ScriptHub" width={22} height={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-serif tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
                            Official Gateway
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 text-emerald-400 border border-emerald-500/30 drop-shadow-sm">Secure</span>
                        </h1>
                    </div>
                </section>

                {/* Checkpoint stage */}
                {stage === "checkpoints" && (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 rounded-2xl overflow-hidden p-6 sm:p-8 space-y-8 relative">
                        {/* Inner Top Highlight */}
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

                        <div className="text-center space-y-1">
                            <h2 className="text-lg font-semibold text-white drop-shadow-sm">System Checkpoints</h2>
                            {totalCheckpoints > 0 ? (
                                <p className="text-[12px] text-offgray-400 font-mono">
                                    Complete all {totalCheckpoints} secure verification link{totalCheckpoints > 1 ? "s" : ""} to proceed.
                                </p>
                            ) : (
                                <p className="text-[12px] text-emerald-400 font-mono">
                                    No verification links required. You may proceed.
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            {allCheckpointInfos.map((cp, index) => {
                                const isDone = completedSet.has(index);
                                const isActive = index === activeIndex && !isDone;
                                const isLocked = index > activeIndex && !isDone;
                                const canClick = isActive && (!timerStarted || countdown <= 0);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleCheckpointClick(index)}
                                        disabled={isActive && timerStarted && countdown > 0}
                                        className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300 shadow-sm ${isDone
                                            ? "bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 shadow-emerald-500/5 glow"
                                            : canClick
                                                ? "bg-gradient-to-r from-white/[0.04] to-transparent border border-white/[0.12] hover:border-white/[0.2] hover:bg-white/[0.06] cursor-pointer"
                                                : isActive
                                                    ? "bg-white/[0.02] border border-white/[0.06]"
                                                    : "bg-white/[0.01] border border-white/[0.03] opacity-40 cursor-not-allowed"
                                            }`}
                                    >
                                        <span
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${isDone
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                : isActive && (!canClick || timerStarted)
                                                    ? "bg-white/[0.06] text-white border border-white/[0.1]"
                                                    : isActive && canClick
                                                        ? "bg-white/[0.1] text-white border border-white/[0.2] shadow-lg"
                                                        : "bg-white/[0.03] text-offgray-600 border border-white/[0.05]"
                                                }`}
                                        >
                                            {isDone ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400 drop-shadow-sm">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                index + 1
                                            )}
                                        </span>
                                        <div className="flex-1 text-left">
                                            <span
                                                className={`text-[14px] font-semibold block transition-colors ${isDone ? "text-emerald-400 drop-shadow-sm" : canClick ? "text-white drop-shadow-sm" : isActive ? "text-offgray-200" : "text-offgray-600"
                                                    }`}
                                            >
                                                {isDone ? "Verification Passed" : isActive && timerStarted && countdown > 0 ? `Please Wait...` : isActive ? "Click to Validate" : "Locked"}
                                            </span>
                                            {isActive && timerStarted && countdown > 0 && <span className="text-[11px] font-mono text-offgray-500">{countdown} seconds remaining</span>}
                                        </div>
                                        {isActive && timerStarted && countdown > 0 && <div className="w-5 h-5 border-2 border-offgray-600 border-t-offgray-300 rounded-full animate-spin shrink-0 shadow-lg" />}
                                        {isLocked && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-offgray-700 shrink-0">
                                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Progress counter */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between text-[11px] font-mono text-offgray-500 mb-2 px-1">
                                <span>Verification Progress</span>
                                <span>{totalCheckpoints > 0 ? Math.round((completedSet.size / totalCheckpoints) * 100) : 100}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700"
                                    style={{ width: `${totalCheckpoints > 0 ? (completedSet.size / totalCheckpoints) * 100 : 100}%` }}
                                />
                            </div>
                        </div>

                        {allDone && (
                            <button
                                onClick={handleContinue}
                                className="w-full h-14 rounded-xl font-semibold text-[14px] tracking-wide bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-lg shadow-emerald-500/20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 flex items-center justify-center gap-2 drop-shadow-sm"
                            >
                                Secure Generate Key
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Captcha stage */}
                {stage === "captcha" && (
                    <section className="bg-black/40 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
                        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/[0.04] bg-white/[0.01]">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400/80">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <h2 className="text-[15px] font-semibold text-offgray-100 tracking-wide drop-shadow-sm">Final Validation</h2>
                        </div>
                        <div className="p-6 sm:p-8 space-y-6">
                            <p className="text-[13px] font-mono text-offgray-400 text-center leading-relaxed">
                                Prove you are a human to encrypt and authorize your unique license token.
                            </p>
                            <div className="flex justify-center p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div ref={turnstileRef} />
                            </div>
                            <button
                                onClick={handleVerifyCaptcha}
                                disabled={!captchaToken}
                                className={`w-full h-14 rounded-xl font-semibold text-[14px] tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${!captchaToken
                                    ? "bg-white/[0.03] border border-white/[0.06] text-offgray-600 cursor-not-allowed shadow-none"
                                    : "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-lg shadow-emerald-500/20 drop-shadow-sm"
                                    }`}
                            >
                                {captchaToken ? "Authorize Key Generation" : "Awaiting Verification"}
                                {captchaToken && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>}
                            </button>
                            {error && <p className="text-[12px] font-mono text-rose-400 text-center bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{error}</p>}
                        </div>
                    </section>
                )}

                <p className="text-center text-[11px] font-mono text-offgray-700/80 pt-4 uppercase tracking-[0.2em]">Powered by ScriptHub.id Enterprise</p>
            </div>
        </div>
    );
}
