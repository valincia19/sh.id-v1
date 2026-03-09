"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { KeyIcon, Box, Terminal, Server, Copy, Check, ChevronRight, Menu, X, Code } from "lucide-react";

// --- Helper Components ---

const Badge = ({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "emerald" | "gray" }) => {
    const colors = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        gray: "bg-white/5 text-offgray-400 border-white/10"
    };
    return (
        <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase tracking-wider ${colors[color]}`}>
            {children}
        </span>
    );
};

const CodeBlock = ({ code, language = "lua" }: { code: string; language?: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group relative mt-3 mb-6">
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-offgray-400 hover:text-white"
                >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
            </div>
            <div className="bg-[#0c0e12] border border-white/[0.04] rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.04]">
                    <span className="text-[10px] font-mono text-offgray-500 uppercase tracking-widest">{language}</span>
                </div>
                <pre className="p-4 text-[13px] font-mono leading-relaxed text-offgray-300 overflow-x-auto custom-scrollbar">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
};

// --- Main Page ---

export default function ApiDocsPage() {
    const [activeTab, setActiveTab] = useState("intro");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const tabs = [
        { id: "intro", label: "Getting Started", icon: ChevronRight, isReady: true },
        { id: "keys", label: "License Keys", icon: KeyIcon, isReady: true },
        { id: "deployments", label: "CDN Deployments", icon: Box, isReady: true },
        { id: "public-scripts", label: "Public Scripts", icon: Code, isReady: true },
        { id: "scripts", label: "Obfuscation", icon: Terminal, isReady: false },
        { id: "webhooks", label: "Webhooks", icon: Server, isReady: false }
    ];

    // Read initial tab from URL hash
    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        if (hash && tabs.some(t => t.id === hash)) {
            setActiveTab(hash);
        }
    }, [tabs]);

    // Handle changing a tab and pushing to URL hash
    const handleTabChange = (id: string) => {
        setActiveTab(id);
        window.history.replaceState(null, '', '#' + id);
    };

    // Close mobile menu on tab change & Body scroll lock
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [activeTab]);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileMenuOpen]);

    return (
        <div className="min-h-screen bg-[#07090c] text-offgray-200 selection:bg-emerald-500/30">
            <div className="flex flex-col lg:flex-row max-w-[1400px] mx-auto w-full">

                {/* Mobile Header / Navigation */}
                <div className="lg:hidden sticky top-0 z-40 bg-[#07090c]/80 backdrop-blur-xl border-b border-white/[0.04] px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center font-bold text-black text-xs shadow-lg shadow-emerald-500/20">SH</div>
                        <span className="font-semibold text-sm text-white tracking-tight">API Docs</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -mr-2 text-offgray-400 hover:text-white transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Mobile Drawer (Full Screen Overlay) */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-[#07090c] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Inside Header */}
                        <div className="border-b border-white/[0.04] px-4 py-3 flex items-center justify-between shrink-0 bg-[#07090c]">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center font-bold text-black text-xs shadow-lg shadow-emerald-500/20">SH</div>
                                <span className="font-semibold text-sm text-white tracking-tight">API Docs</span>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 -mr-2 text-offgray-400 hover:text-white transition-colors bg-white/5 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const active = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        disabled={!tab.isReady}
                                        onClick={() => {
                                            handleTabChange(tab.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${active
                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                            : "bg-[#0c0e12] border-white/[0.04] text-offgray-400 hover:bg-white/[0.04]"
                                            } ${!tab.isReady ? "opacity-30 grayscale" : ""}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} />
                                            <span className="font-medium text-[14px]">{tab.label}</span>
                                        </div>
                                        {tab.isReady && <ChevronRight size={16} className={active ? "text-emerald-400" : "text-offgray-600"} />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-4 pt-4 border-t border-white/[0.04] flex gap-3 bg-[#07090c] shrink-0 pb-safe">
                            <Link href="/studio" className="flex-1 text-center py-3 rounded-xl bg-[#0c0e12] hover:bg-white/[0.05] text-sm text-offgray-300 font-medium border border-white/[0.04] transition-colors">Studio</Link>
                            <Link href="/home" className="flex-1 text-center py-3 rounded-xl bg-[#0c0e12] hover:bg-white/[0.05] text-sm text-offgray-300 font-medium border border-white/[0.04] transition-colors">Home</Link>
                        </div>
                    </div>
                )}

                {/* Sidebar (Desktop) */}
                <aside className="hidden lg:flex flex-col w-[260px] shrink-0 sticky top-0 h-screen border-r border-white/[0.04] p-6 overflow-y-auto custom-scrollbar">
                    <div className="mb-8 flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center font-bold text-black text-xs shadow-lg shadow-emerald-500/20">SH</div>
                        <h2 className="font-bold text-base text-white tracking-tight">API Docs</h2>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div>
                            <p className="text-[10px] font-bold text-offgray-500 uppercase tracking-widest mb-3 px-2">Core Platform</p>
                            <nav className="space-y-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const active = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            disabled={!tab.isReady}
                                            onClick={() => handleTabChange(tab.id)}
                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-[13px] group ${active ? "bg-white/5 text-white font-medium shadow-sm" : "text-offgray-400 hover:text-offgray-200 hover:bg-white/[0.02]"
                                                } ${!tab.isReady ? "opacity-30 cursor-not-allowed" : ""}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon size={15} className={active ? "text-emerald-400" : "text-offgray-500 group-hover:text-offgray-400"} />
                                                <span>{tab.label}</span>
                                            </div>
                                            {!tab.isReady && <span className="text-[9px] text-offgray-600 font-mono">SOON</span>}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-offgray-500 uppercase tracking-widest mb-3 px-2">Support</p>
                            <nav className="space-y-1">
                                <Link href="/studio/api" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] text-offgray-400 hover:text-white hover:bg-white/[0.02] transition-all">
                                    <KeyIcon size={15} className="text-offgray-500" />
                                    <span>API Key Management</span>
                                </Link>
                                <Link href="/studio" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] text-offgray-400 hover:text-white hover:bg-white/[0.02] transition-all">
                                    <Box size={15} className="text-offgray-500" />
                                    <span>ScriptHub Studio</span>
                                </Link>
                            </nav>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/[0.04]">
                        <p className="text-[10px] text-offgray-600 font-mono px-2">v2.1.0-stable</p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0 py-6 lg:py-16 px-4 md:px-12 lg:px-16">
                    <div className="w-full max-w-[800px]">

                        {/* Tab Switcher (Tablet/iPad - Center aligned horizontal bar) */}
                        <div className="hidden sm:flex lg:hidden items-center gap-2 p-1 bg-white/[0.02] border border-white/[0.04] rounded-lg mb-8 overflow-x-auto custom-scrollbar whitespace-nowrap">
                            {tabs.filter(t => t.isReady).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`shrink-0 flex-1 py-1.5 px-4 rounded text-[11px] font-medium transition-all ${activeTab === tab.id ? "bg-white/5 text-white shadow-sm" : "text-offgray-500 hover:text-offgray-300"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="mb-8">
                            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-2">
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h1>
                            <p className="text-[13px] text-offgray-400 leading-relaxed max-w-2xl">
                                {activeTab === "intro" && "Learn how to use ScriptHub to protect, distribute, and monetize your Roblox scripts."}
                                {activeTab === "keys" && "Robust license management for your script ecosystem."}
                                {activeTab === "deployments" && "High-performance script delivery across a global edge network."}
                                {activeTab === "public-scripts" && "Fetch highly cached, essential script metadata optimized for anonymous loaders."}
                            </p>
                        </div>

                        {activeTab === "intro" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <section className="space-y-4">
                                    <h2 className="text-base font-semibold text-white">1. Create a New Script</h2>
                                    <p className="text-[13px] text-offgray-400 leading-relaxed">
                                        Go to the <Link href="/studio" className="text-emerald-400 hover:underline">Studio Dashboard</Link> and create a new script entry. You will receive a unique **Script ID** (UUID) which is required for all API calls.
                                    </p>
                                </section>

                                <section className="space-y-4">
                                    <h2 className="text-base font-semibold text-white">2. Set Up a Deployment</h2>
                                    <p className="text-[13px] text-offgray-400 leading-relaxed">
                                        Upload your script content or use the Online Editor. Once satisfied, create a **Deployment**. This generates a secure CDN link protected by our multi-layer security.
                                    </p>
                                    <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.03] space-y-2">
                                        <p className="text-[11px] font-bold text-offgray-500 uppercase tracking-widest">Your CDN Link Pattern</p>
                                        <code className="text-[12px] font-mono text-emerald-400">https://api.scripthub.id/v1/{"{deploy_id}"}.lua</code>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h2 className="text-base font-semibold text-white">3. Choose Verification Method</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                            <h3 className="text-[13px] font-bold text-white">Simple Key System</h3>
                                            <p className="text-[12px] text-offgray-500 leading-tight">Use our built-in one-liner at the top of your script. Fast & secure.</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                            <h3 className="text-[13px] font-bold text-white">Custom UI / Hybrid</h3>
                                            <p className="text-[12px] text-offgray-500 leading-tight">Use our API endpoints to build your own custom loader UI.</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h2 className="text-base font-semibold text-white">4. Quick Start Loader</h2>
                                    <p className="text-[13px] text-offgray-400 leading-relaxed">
                                        Simply copy this code to the top of your script profile on ScriptHub to activate the key system.
                                    </p>
                                    <CodeBlock language="lua" code={`_G.script_key = "SH-xxxx-xxxx" -- Define user key here
loadstring(game:HttpGet("https://api.scripthub.id/v1/your-deploy-id.lua"))()`} />
                                </section>
                            </div>
                        )}

                        {activeTab === "keys" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Quick Start Section */}
                                <section className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-wider mb-2">
                                        <Terminal size={12} />
                                        <span>Quick Integration (One-Line)</span>
                                    </div>
                                    <p className="text-[12px] text-offgray-400 leading-relaxed mb-3">
                                        Paste this at the top of your script file.
                                    </p>
                                    <CodeBlock language="lua" code={`_G.script_key = "SH-xxxx-xxxx"
loadstring(game:HttpGet("https://api.scripthub.id/v1/your-deploy-id.lua"))()`} />
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Badge color="blue">ADVANCED</Badge>
                                        <h2 className="text-base font-semibold text-white">Production-Ready Validation</h2>
                                    </div>
                                    <p className="text-[13px] text-offgray-400 leading-relaxed mb-4">
                                        For developers building custom loaders, use this patterns to ensure proper HWID detection and multi-executor compatibility.
                                    </p>
                                    <CodeBlock language="lua" code={`local HttpService = game:GetService("HttpService")

-- Ensure the user provided a key before running
local user_key = _G.script_key or ""
if user_key == "" then return game.Players.LocalPlayer:Kick("Key is missing! Please use _G.script_key") end

-- 1. Get HWID & Executor Info
local function GetSystemInfo()
    local hwid, executor = "Unknown", "Unknown"
    pcall(function() hwid = gethwid and gethwid() or game:GetService("RbxAnalyticsService"):GetClientId() end)
    pcall(function() executor = identify and identify() or getexecutorname and getexecutorname() or "Unknown" end)
    return hwid, executor
end

-- 2. Multi-Executor HTTP Request
local function DoRequest(url, method, body)
    local req = request or http_request or (syn and syn.request) or (fluxus and fluxus.request)
    return req({
        Url = url,
        Method = method,
        Headers = { ["Content-Type"] = "application/json" },
        Body = HttpService:JSONEncode(body)
    })
end

-- 3. Core Validation Logic
local function ValidateKey(key)
    local hwid, executor = GetSystemInfo()
    local response = DoRequest("https://api.scripthub.id/api/v2/keys/validate", "POST", {
        key = key,
        scriptId = "YOUR_SCRIPT_ID",
        hwid = hwid,
        executor = executor
    })
    
    local data = HttpService:JSONDecode(response.Body)
    return data.valid, data.message
end

-- 4. Initiate Validation
local isValid, msg = ValidateKey(user_key)
if not isValid then
    game.Players.LocalPlayer:Kick("Verification Failed: " .. msg)
    return
end

print("Validation Successful! Loading script...")
-- Your protected script code here`} />
                                </section>

                                <section>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Badge color="blue">POST</Badge>
                                        <h2 className="text-base font-semibold text-white">Validate Key Endpoint</h2>
                                    </div>
                                    <p className="text-[13px] text-offgray-400 leading-relaxed mb-4">
                                        The core endpoint for key-gating your scripts. It handles activation, HWID binding, and status checks in a single call.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-[110px_1fr] gap-x-6 gap-y-3 items-center p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                                        <div className="text-[9px] font-bold text-offgray-500 uppercase tracking-widest">Endpoint</div>
                                        <code className="text-[12px] font-mono text-emerald-400 break-all select-all">https://api.scripthub.id/api/v2/keys/validate</code>

                                        <div className="text-[9px] font-bold text-offgray-500 uppercase tracking-widest">Auth</div>
                                        <span className="text-[11px] text-offgray-400 flex items-center gap-1.5"><X size={11} className="text-red-500/80" /> None <span className="text-offgray-600">(Public)</span></span>
                                    </div>

                                    <div className="mt-8">
                                        <h3 className="text-xs font-semibold text-white mb-3">Payload Example</h3>
                                        <CodeBlock language="json" code={`{
  "key": "SH-id581889ce6357438e82daf430c5c",
  "scriptId": "your-script-uuid",
  "hwid": "unique-device-hardware-id"
}`} />
                                    </div>

                                    <div className="mt-8">
                                        <h3 className="text-xs font-semibold text-white mb-3">Success Response</h3>
                                        <CodeBlock language="json" code={`{
  "success": true,
  "valid": true,
  "data": {
    "type": "lifetime",
    "status": "active",
    "max_devices": 3
  }
}`} />
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === "deployments" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Quick Start Section */}
                                <section className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-wider mb-2">
                                        <Server size={12} />
                                        <span>One-Line Loader</span>
                                    </div>
                                    <p className="text-[12px] text-offgray-400 leading-relaxed mb-3">
                                        Standard loader for protected assets.
                                    </p>
                                    <CodeBlock language="lua" code={`loadstring(game:HttpGet("https://api.scripthub.id/v1/your-deploy-id.lua"))()`} />
                                </section>

                                <section>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Badge color="emerald">GET</Badge>
                                        <h2 className="text-base font-semibold text-white">CDN Architecture</h2>
                                    </div>
                                    <p className="text-[13px] text-offgray-400 leading-relaxed mb-6">
                                        Access your protected script assets via our worldwide CDN. All endpoints are secured with browser-blocking and HWID verification logic.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                                        {[
                                            { title: "Browser Block", desc: "Redirects non-executor clients to a protected page." },
                                            { title: "Encrypted Stub", desc: "Executors receive an obfuscated protected stub." },
                                            { title: "S3 Isolation", desc: "Private origin storage with timed presigned access." },
                                            { title: "HWID Lock", desc: "Immutable link between execution and hardware identity." }
                                        ].map(feat => (
                                            <div key={feat.title} className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.04] transition-colors">
                                                <h4 className="text-[11px] font-bold text-white mb-1">{feat.title}</h4>
                                                <p className="text-[10px] text-offgray-500 leading-tight">{feat.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === "public-scripts" && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <section>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Badge color="emerald">GET</Badge>
                                        <h2 className="text-base font-semibold text-white">Get Script Details</h2>
                                    </div>
                                    <p className="text-[13px] text-offgray-400 leading-relaxed mb-4">
                                        This high-performance endpoint is built specifically for executor loaders. It returns a stripped-down, essential metadata object for a published script based on its unique slug. To prevent database bottlenecking during high concurrent executions, responses are served directly from a Redis memory cache with a Time-To-Live (TTL) of 30 minutes.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-[110px_1fr] gap-x-6 gap-y-3 items-center p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                                        <div className="text-[9px] font-bold text-offgray-500 uppercase tracking-widest">Endpoint</div>
                                        <code className="text-[12px] font-mono text-emerald-400 break-all select-all">https://api.scripthub.id/v1/scripts/public/:slug</code>

                                        <div className="text-[9px] font-bold text-offgray-500 uppercase tracking-widest">Auth</div>
                                        <span className="text-[11px] text-offgray-400 flex items-center gap-1.5"><X size={11} className="text-red-500/80" /> None <span className="text-offgray-600">(Public)</span></span>
                                    </div>

                                    <div className="mt-8">
                                        <h3 className="text-xs font-semibold text-white mb-3">Response Example</h3>
                                        <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "id": "b08f868d-8a56-4b8c-8c34-eb1637c34b1a",
    "title": "Redz Hub | Blox Fruits",
    "slug": "redz-hub-blox-fruits",
    "owner": "valinciaeunha",
    "thumbnail_url": "https://cdn.scripthub.id/scripts/thumbnail-xyz.jpg",
    "loader_url": "loadstring(game:HttpGet('https://api.scripthub.id/v1/loader/...'))()"
  }
}`} />
                                    </div>

                                    <div className="w-full h-px bg-white/[0.04] my-10" />

                                    <div className="flex items-center gap-3 mb-3">
                                        <Badge color="emerald">GET</Badge>
                                        <h2 className="text-base font-semibold text-white">Fetch Scripts</h2>
                                    </div>
                                    <p className="text-[13px] text-offgray-400 leading-relaxed mb-4">
                                        Retrieve a paginated, sortable list of the most essential script metadata. Perfect for building custom executor script-hubs or catalogs. Cached heavily for 5 minutes.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-[110px_1fr] gap-x-6 gap-y-3 items-center p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                                        <div className="text-[9px] font-bold text-offgray-500 uppercase tracking-widest">Endpoint</div>
                                        <code className="text-[12px] font-mono text-emerald-400 break-all select-all">https://api.scripthub.id/v1/scripts/public</code>

                                        <div className="text-[9px] font-bold text-offgray-500 uppercase tracking-widest">Query Params</div>
                                        <span className="text-[11px] text-offgray-400 font-mono">page=1&limit=30&sortBy=trending</span>

                                        <div className="text-[9px] font-bold text-offgray-500 uppercase tracking-widest">Auth</div>
                                        <span className="text-[11px] text-offgray-400 flex items-center gap-1.5"><X size={11} className="text-red-500/80" /> None <span className="text-offgray-600">(Public)</span></span>
                                    </div>

                                    <div className="mt-8">
                                        <h3 className="text-xs font-semibold text-white mb-3">Response Example</h3>
                                        <CodeBlock language="json" code={`{
  "success": true,
  "data": [
    {
      "id": "b08f868d-8a56-4b8c-8c34-eb1637c34b1a",
      "title": "Redz Hub | Blox Fruits",
      "slug": "redz-hub-blox-fruits",
      "owner": "valinciaeunha",
      "thumbnail_url": "https://cdn.scripthub.id/scripts/thumbnail-xyz.jpg",
      "loader_url": "loadstring(game:HttpGet('https://api.scripthub.id/v1/loader/...'))()"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 30,
    "totalPages": 1,
    "hasMore": false
  }
}`} />
                                    </div>
                                </section>
                            </div>
                        )}

                    </div>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    height: 6px;
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}} />
        </div>
    );
}
