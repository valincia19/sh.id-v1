"use client";

import { useState, useEffect } from "react";
import { Settings, ShieldCheck, Zap, Code2, AlertCircle, Copy, Check, Activity } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { StreamLanguage } from '@codemirror/language';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { plansApi } from "@/lib/api/plans";
import apiClient from "@/lib/api/client";

export default function StudioObfuscatePage() {
    const [scriptInput, setScriptInput] = useState("");
    const [originalScript, setOriginalScript] = useState<string | null>(null); // preserved for re-obfuscation
    const [fileName, setFileName] = useState("main.lua");
    const [isObfuscating, setIsObfuscating] = useState(false);
    const [isProtected, setIsProtected] = useState(false); // true once protected output is showing
    const [copied, setCopied] = useState(false);

    // Quota State
    const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);
    const [quotaLimit, setQuotaLimit] = useState<number | null>(null);

    const fetchQuota = async () => {
        try {
            const data = await plansApi.getMyPlan();
            setQuotaRemaining(data.maximums.maximum_obfuscation);
            setQuotaLimit(data.limits?.maximum_obfuscation ?? data.maximums.maximum_obfuscation);
        } catch { }
    };

    useEffect(() => {
        fetchQuota();
    }, []);


    const handleObfuscate = async () => {
        // Always obfuscate the original script (not the loader output)
        const sourceScript = originalScript ?? scriptInput;
        if (!sourceScript.trim()) return;
        setIsObfuscating(true);

        try {
            const res = await apiClient.post("/deployments/obfuscate", {
                title: fileName === "main.lua" ? "Obfuscated Script" : fileName,
                content: sourceScript  // <-- always send original
            });

            if (res.data?.success && res.data?.data?.loaderText) {
                // First obfuscation: save the original
                if (!originalScript) setOriginalScript(scriptInput);
                setScriptInput(res.data.data.loaderText);
                setFileName(res.data.data.deployment.title + " (Protected)");
                setIsProtected(true);
                fetchQuota();
            }
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to obfuscate script. Please check your network or quota.");
        } finally {
            setIsObfuscating(false);
        }
    };

    const handleReset = () => {
        if (originalScript) {
            setScriptInput(originalScript);
            setOriginalScript(null);
            setIsProtected(false);
            setFileName("main.lua");
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(scriptInput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white">ScriptHub Obfuscator</h1>
                    <p className="text-sm font-mono text-offgray-500 max-w-lg mt-2 hidden sm:block">
                        Secure your Lua code using industry-leading protection.
                    </p>
                </div>

                {/* Quota Indicator */}
                {quotaLimit !== null && quotaRemaining !== null && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className={`p-1.5 rounded-md ${quotaRemaining === 0 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                            <Activity size={14} className={quotaRemaining === 0 ? 'text-red-500' : 'text-emerald-500'} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-offgray-500 uppercase tracking-widest">Monthly Quota</span>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-sm font-mono ${quotaRemaining === 0 ? 'text-red-400' : 'text-white'}`}>{quotaRemaining}</span>
                                <span className="text-[11px] font-mono text-offgray-600">/ {quotaLimit === -1 ? '∞' : quotaLimit} remaining</span>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6">

                {/* Left Column: Code Editor */}
                <div className="space-y-4 flex flex-col h-[600px] lg:h-[700px]">
                    <div className="flex items-center justify-between p-3 px-4 rounded-t-2xl bg-white/[0.02] border border-b-0 border-white/[0.04]">
                        <div className="flex items-center gap-2">
                            <Code2 size={16} className="text-offgray-500" />
                            <span className="text-sm font-mono text-white px-1">
                                {fileName}
                            </span>
                            {isProtected && (
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                    <ShieldCheck size={10} /> PROTECTED
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {isProtected && (
                                <button
                                    onClick={handleReset}
                                    title="Reset to original script"
                                    className="text-[10px] font-mono text-offgray-500 hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 px-2 py-1 rounded transition-colors"
                                >
                                    Reset
                                </button>
                            )}
                            <span className="text-[10px] text-offgray-500 font-mono hidden sm:inline-block">
                                {scriptInput.length} bytes
                            </span>
                            <button
                                onClick={copyToClipboard}
                                className="p-1.5 rounded-md hover:bg-white/5 text-offgray-400 hover:text-white transition-colors"
                            >
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative rounded-b-2xl border border-white/[0.04] bg-[#282c34] overflow-hidden group focus-within:border-emerald-500/30 transition-colors">
                        <CodeMirror
                            value={scriptInput}
                            height="100%"
                            theme={oneDark}
                            extensions={[StreamLanguage.define(lua)]}
                            onChange={(value) => setScriptInput(value)}
                            placeholder="print('Hello, ScriptHub!')"
                            className="absolute inset-0 w-full h-full text-[13px] sm:text-sm custom-codemirror"
                            basicSetup={{
                                lineNumbers: true,
                                foldGutter: true,
                                dropCursor: true,
                                allowMultipleSelections: true,
                                indentOnInput: true,
                                syntaxHighlighting: true,
                                bracketMatching: true,
                                closeBrackets: true,
                                autocompletion: true,
                                rectangularSelection: true,
                                crosshairCursor: true,
                                highlightActiveLine: true,
                                highlightSelectionMatches: true,
                                closeBracketsKeymap: true,
                                defaultKeymap: true,
                                searchKeymap: true,
                                historyKeymap: true,
                                foldKeymap: true,
                                completionKeymap: true,
                                lintKeymap: true,
                            }}
                        />
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-6">
                    {/* Settings Panel */}
                    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-white/[0.04] bg-white/[0.02] flex items-center gap-2">
                            <Settings size={16} className="text-offgray-400" />
                            <h2 className="text-sm font-semibold text-white">Protection Engine</h2>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Target Version Info */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-offgray-500 uppercase tracking-widest">Target Environment</label>
                                <div className="w-full bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-offgray-200 font-mono flex items-center justify-between">
                                    <span>Luau (Roblox)</span>
                                    <Check size={16} className="text-emerald-500/50" />
                                </div>
                            </div>

                            {/* Static Flags Info */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-offgray-500 uppercase tracking-widest">Security Flags</label>

                                {[
                                    "INTENSE OBFUSCATION",
                                    "DISABLE LINE INFORMATION",
                                    "ENABLE GC FIXES",
                                    "CONSTANT FOLDING",
                                    "CONTROL FLOW FLATTEN"
                                ].map((flag) => (
                                    <div key={flag} className="flex items-center justify-between">
                                        <div className="text-[13px] font-medium text-emerald-400/90 transition-colors">
                                            {flag}
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Check size={16} className="text-emerald-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Deployment Info */}
                        <div className="p-4 bg-emerald-500/5 text-emerald-400/80 border-t border-emerald-500/10 flex gap-3">
                            <AlertCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed space-y-1.5 font-mono">
                                <p>Once obfuscated, the protected script will be automatically deployed to your <a href="/studio/deployments" className="text-emerald-400 underline hover:text-emerald-300 transition-colors">Deployments</a> tab.</p>
                                <p className="text-emerald-500/60 ">(Setelah diobfuskasi, script perlindungan akan secara otomatis di-deploy ke tab Deployments Anda.)</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleObfuscate}
                        disabled={!scriptInput.trim() || isObfuscating}
                        className={`w-full relative overflow-hidden group flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all
                            ${!scriptInput.trim()
                                ? 'bg-white/5 text-offgray-600 cursor-not-allowed border border-white/5'
                                : isObfuscating
                                    ? 'bg-emerald-500/20 text-emerald-500 cursor-wait'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                            }
                        `}
                    >
                        {isObfuscating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                                <span>Securing Script...</span>
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={18} className={!scriptInput.trim() ? "opacity-30" : ""} />
                                <span>Obfuscate Script</span>
                            </>
                        )}

                        {/* Shimmer Effect */}
                        {!isObfuscating && scriptInput.trim() && (
                            <div className="absolute inset-0 -translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_2s_infinite]" />
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-offgray-600 font-mono">
                        <Zap size={10} className="text-emerald-500/50" />
                        <span>Powered by ScriptHub Engine</span>
                    </div>

                    {/* View Deployment CTA — appears after successful obfuscation */}
                    {isProtected && (
                        <a
                            href="/studio/deployments"
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-sm font-semibold transition-all animate-in fade-in duration-300"
                        >
                            <Check size={16} />
                            Obfuscation Successful — View Deployment
                        </a>
                    )}
                </div>
            </div>

            {/* Custom Scrollbar Styles for Textarea */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-codemirror .cm-editor {
                    height: 100% !important;
                }
                .custom-codemirror .cm-scroller {
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
                    overflow: auto;
                }
                .custom-codemirror .cm-scroller::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-codemirror .cm-scroller::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-codemirror .cm-scroller::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                }
                .custom-codemirror .cm-scroller::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                @keyframes shimmer {
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}} />
        </div>
    );
}
