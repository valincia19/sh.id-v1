"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// ─── Adsterra Ad Injector ────────────────────────────────────────
function AdsterraInjector() {
    const pathname = usePathname();

    useEffect(() => {
        const scriptId = "adsterra-popunder";
        const existing = document.getElementById(scriptId);
        if (existing) existing.remove();

        const script = document.createElement("script");
        script.id = scriptId;
        script.type = "text/javascript";
        script.src = `https://pl28851177.effectivegatecpm.com/f4/e9/2c/f4e92cd0a2f35267373313d721378beb.js`;
        script.async = true;
        document.body.appendChild(script);

        return () => {
            const el = document.getElementById(scriptId);
            if (el) el.remove();
        };
    }, [pathname]);

    return null;
}

// ─── Linkvertise Injector ────────────────────────────────────────
function LinkvertiseInjector() {
    useEffect(() => {
        const scriptId = "linkvertise-sdk";
        if (document.getElementById(scriptId)) return;

        // Load Linkvertise SDK
        const sdk = document.createElement("script");
        sdk.id = scriptId;
        sdk.src = "https://publisher.linkvertise.com/cdn/linkvertise.js";
        sdk.async = true;
        sdk.onload = () => {
            // Initialize Linkvertise full-page monetization
            const initScript = document.createElement("script");
            initScript.id = "linkvertise-init";
            initScript.textContent = `linkvertise(3869838, {whitelist: [], blacklist: [""]});`;
            document.body.appendChild(initScript);
        };
        document.body.appendChild(sdk);

        return () => {
            const el = document.getElementById(scriptId);
            if (el) el.remove();
            const init = document.getElementById("linkvertise-init");
            if (init) init.remove();
        };
    }, []);

    return null;
}

// ─── AdBlock Detection (2-of-3 Voting) ──────────────────────────
// Only blocks if 2+ of 3 independent checks detect an ad blocker.
// This prevents false positives from Brave shields, DNS filters, etc.
type AdCheckState = "checking" | "passed" | "blocked";

function useAdblockCheck(): AdCheckState {
    const [state, setState] = useState<AdCheckState>("checking");

    useEffect(() => {
        const checks: Promise<boolean>[] = [];

        // Check 1: Bait element — CSS-based ad blockers hide ad-class elements
        checks.push(new Promise((resolve) => {
            const bait = document.createElement("div");
            bait.className = "ad-banner adsbox textads banner-ads";
            bait.style.cssText = "position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;";
            bait.innerHTML = "&nbsp;";
            document.body.appendChild(bait);
            setTimeout(() => {
                const hidden = bait.offsetHeight === 0
                    || getComputedStyle(bait).display === "none"
                    || getComputedStyle(bait).visibility === "hidden";
                bait.remove();
                resolve(hidden);
            }, 300);
        }));

        // Check 2: Our actual ad script load test
        checks.push(new Promise((resolve) => {
            const s = document.createElement("script");
            s.src = `https://pl28851177.effectivegatecpm.com/f4/e9/2c/f4e92cd0a2f35267373313d721378beb.js`;
            s.async = true;
            let ok = false;
            s.onload = () => { ok = true; };
            s.onerror = () => { ok = false; };
            document.head.appendChild(s);
            setTimeout(() => { s.remove(); resolve(!ok); }, 2000);
        }));

        // Check 3: Google Ad network fetch (catches network-level blockers)
        checks.push(
            fetch("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", {
                method: "HEAD", mode: "no-cors", cache: "no-store",
            }).then(() => false).catch(() => true)
        );

        // VOTE: block only if 2+ of 3 checks detect ad blocker
        Promise.all(checks).then((results) => {
            const failCount = results.filter(Boolean).length;
            setState(failCount >= 2 ? "blocked" : "passed");
        });
    }, []);

    return state;
}

// ─── UI Components ──────────────────────────────────────────────
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

// ─── Layout ─────────────────────────────────────────────────────
// VPN detection is now handled server-side in start-session.
// If the user is on a VPN, the API returns a 403 with IP_BLOCKED code.
// The frontend only handles AdBlock detection (client-side concern).
export default function GetKeyLayout({ children }: { children: React.ReactNode }) {
    const adCheck = useAdblockCheck();

    return (
        <div className="min-h-screen bg-[#09090b] text-offgray-300 antialiased">
            {adCheck === "checking" && <CheckingScreen />}
            {adCheck === "blocked" && <AdblockWall />}
            {adCheck === "passed" && (
                <>
                    <AdsterraInjector />
                    <LinkvertiseInjector />
                    {children}
                </>
            )}
        </div>
    );
}
