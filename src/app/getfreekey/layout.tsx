"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function AdsterraInjector() {
    const pathname = usePathname();

    useEffect(() => {
        const scriptId = "adsterra-popunder";
        const existing = document.getElementById(scriptId);
        if (existing) existing.remove();

        const script = document.createElement("script");
        script.id = scriptId;
        script.type = "text/javascript";
        script.src = `https://pl28803011.effectivegatecpm.com/b0/c4/1c/b0c41c29f6b9de81c3a84a2e77bf5f0c.js?v=${Date.now()}`;
        script.async = true;
        document.body.appendChild(script);

        return () => {
            const el = document.getElementById(scriptId);
            if (el) el.remove();
        };
    }, [pathname]);

    return null;
}

type AdCheckState = "checking" | "passed" | "blocked";

function useAdblockCheck(): AdCheckState {
    const [state, setState] = useState<AdCheckState>("checking");

    useEffect(() => {
        const checks: Promise<boolean>[] = [];

        // 1. Bait element — ad blockers hide elements with ad-related class names
        checks.push(new Promise((resolve) => {
            const bait = document.createElement("div");
            bait.className = "ad-banner ad-placement adsbox ad-container textads banner-ads";
            bait.style.cssText = "position:absolute;top:-999px;left:-999px;width:1px;height:1px;overflow:hidden;";
            bait.innerHTML = "&nbsp;";
            document.body.appendChild(bait);

            setTimeout(() => {
                const isHidden =
                    bait.offsetHeight === 0 ||
                    bait.offsetWidth === 0 ||
                    bait.clientHeight === 0 ||
                    getComputedStyle(bait).display === "none" ||
                    getComputedStyle(bait).visibility === "hidden";
                bait.remove();
                resolve(isHidden);
            }, 200);
        }));

        // 2. Check if our own ad script was blocked
        checks.push(new Promise((resolve) => {
            const testScript = document.createElement("script");
            testScript.src = "https://pl28803011.effectivegatecpm.com/b0/c4/1c/b0c41c29f6b9de81c3a84a2e77bf5f0c.js?check=1";
            testScript.async = true;
            let loaded = false;
            testScript.onload = () => { loaded = true; };
            testScript.onerror = () => { loaded = false; };
            document.head.appendChild(testScript);
            setTimeout(() => {
                testScript.remove();
                resolve(!loaded);
            }, 1500);
        }));

        Promise.all(checks).then((results) => {
            setState(results.some((r) => r) ? "blocked" : "passed");
        });
    }, []);

    return state;
}

function AdblockWall() {
    return (
        <div className="fixed inset-0 z-[99999] bg-[#09090b] flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">Ad Blocker Detected</h2>
                    <p className="text-[13px] font-mono text-offgray-400 leading-relaxed">
                        This service is free and supported by ads.
                        <br />Please disable your ad blocker to continue.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full h-11 rounded-xl font-medium text-[13px] bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] text-white transition-all flex items-center justify-center gap-2"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    I&apos;ve Disabled It - Reload
                </button>
                <p className="text-[10px] font-mono text-offgray-700 pt-4">Powered by ScriptHub.id</p>
            </div>
        </div>
    );
}

function CheckingScreen() {
    return (
        <div className="fixed inset-0 z-[99999] bg-[#09090b] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-8 h-8 mx-auto border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
                <p className="text-[11px] font-mono text-offgray-600">Verifying environment...</p>
            </div>
        </div>
    );
}

type VpnCheckState = "checking" | "passed" | "blocked";

function useVpnCheck(): VpnCheckState {
    const [state, setState] = useState<VpnCheckState>("checking");

    useEffect(() => {
        // Always do a fresh check — no sessionStorage caching
        // This prevents stale "vpn" flags from permanently blocking users
        fetch("/api/security/check", { cache: "no-store", method: "GET" })
            .then(async (r) => {
                if (!r.ok) {
                    // If API errors, fail-open (let them through)
                    console.warn("[SECURITY] VPN check API returned non-OK, failing open");
                    setState("passed");
                    return;
                }
                const data = await r.json();

                // Check IP reputation from server
                if (data.isVpn) {
                    setState("blocked");
                    return;
                }

                setState("passed");
            })
            .catch((err) => {
                // If fetch completely fails, fail-open (don't block legit users)
                console.warn("[SECURITY] VPN check fetch failed, failing open:", err);
                setState("passed");
            });
    }, []);

    return state;
}

function VpnWall() {
    return (
        <div className="fixed inset-0 z-[99999] bg-[#09090b] flex items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-6 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-white">VPN / Proxy Detected</h2>
                    <p className="text-[13px] font-mono text-offgray-400 leading-relaxed">
                        To protect our service from abuse, we do not allow VPNs, Proxies, or Tor connections.
                        <br />Please disable your VPN and reload.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full h-11 rounded-xl font-medium text-[13px] bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] text-white transition-all flex items-center justify-center gap-2"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    I&apos;ve Disabled It - Reload
                </button>
                <p className="text-[10px] font-mono text-offgray-700 pt-4">Powered by ScriptHub.id</p>
            </div>
        </div>
    );
}

export default function GetKeyLayout({ children }: { children: React.ReactNode }) {
    const adCheck = useAdblockCheck();
    const vpnCheck = useVpnCheck();

    return (
        <div className="min-h-screen bg-[#09090b] text-offgray-300 antialiased">
            {(adCheck === "checking" || (adCheck === "passed" && vpnCheck === "checking")) && <CheckingScreen />}
            {adCheck === "blocked" && <AdblockWall />}
            {adCheck === "passed" && vpnCheck === "blocked" && <VpnWall />}
            {adCheck === "passed" && vpnCheck === "passed" && (
                <>
                    <AdsterraInjector />
                    {children}
                </>
            )}
        </div>
    );
}
