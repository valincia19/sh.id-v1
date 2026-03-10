"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";

function ErrorContent() {
    const searchParams = useSearchParams();
    const message = searchParams.get("message") || "Something went wrong. Please try again.";

    return (
        <div className="min-h-screen py-10 px-4 flex flex-col items-center bg-[#09090b]">
            <div className="w-full max-w-2xl space-y-6 animate-in fade-in duration-700">

                {/* Header Area */}
                <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1.5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white flex items-center gap-3">
                                Operation Failed
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
                                    Error
                                </span>
                            </h1>
                            <p className="text-[13px] font-mono text-offgray-400 mt-1 max-w-lg">
                                We ran into a problem while generating your license key.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Details Table */}
                <section className="relative bg-[#0a0c10] border border-white/[0.04] rounded-xl overflow-hidden group/table shadow-xl shadow-black/20">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                    <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/[0.04]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-offgray-500">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <h2 className="text-sm font-semibold text-offgray-100 tracking-wide">Error Details</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody>
                                <tr className="border-b border-white/[0.02]">
                                    <td className="px-5 py-4 w-1/3">
                                        <span className="text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Problem</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-[13px] font-medium text-red-400">
                                            {message}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-5 py-4 w-1/3">
                                        <span className="text-[10px] font-mono font-semibold text-offgray-500 uppercase tracking-widest whitespace-nowrap">Resolution</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[13px] font-mono text-offgray-400">
                                                Please return and restart the process.
                                            </span>
                                            <a
                                                href="https://scripthub.id"
                                                className="ml-auto h-9 px-4 rounded-md text-[12px] font-medium transition-all inline-flex items-center justify-center min-w-[90px] bg-white/[0.03] text-offgray-300 hover:text-white border border-white/[0.06] hover:bg-white/[0.08]"
                                            >
                                                Start Over
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Footer */}
                <p className="text-center text-[10px] font-mono text-offgray-700 pt-8">
                    Powered by ScriptHub.id
                </p>
            </div>
        </div>
    );
}

export default function ErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
