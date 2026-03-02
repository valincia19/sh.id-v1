"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ScriptCard } from "@/components/home/ScriptCard";
import { scriptsApi, Script } from "@/lib/api/scripts";
import { getAllHubs, Hub } from "@/lib/api/hubs";
import { getAllExecutors, Executor } from "@/lib/api/executors";
import { formatRelativeTime } from "@/lib/utils/date";
import { getStorageUrl } from "@/lib/utils/image";
import Link from "next/link";
import Image from "next/image";

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const tag = searchParams.get("tag") || "";

    const [scripts, setScripts] = useState<Script[]>([]);
    const [fallbackScripts, setFallbackScripts] = useState<Script[]>([]);
    const [hubs, setHubs] = useState<Hub[]>([]);
    const [executors, setExecutors] = useState<Executor[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch scripts based on search query
                const scriptRes = await scriptsApi.getAllScripts({
                    query: query || undefined,
                    tag: tag || query || undefined
                });

                const foundScripts = scriptRes.scripts || scriptRes;
                setScripts(foundScripts);

                // If no scripts found, fetch trending as fallback
                if (foundScripts.length === 0) {
                    try {
                        const trendingRes = await scriptsApi.getTrendingScripts({ period: 'all' });
                        setFallbackScripts(trendingRes.slice(0, 10)); // Top 10 fallback
                    } catch (e) {
                        // Ignore fallback error
                    }
                }

                // If there's a keyword, fetch and filter Hubs and Executors
                if (query) {
                    const lowerQuery = query.toLowerCase();

                    try {
                        const allHubs = await getAllHubs();
                        setHubs(allHubs.filter(h => h.name.toLowerCase().includes(lowerQuery) || h.description?.toLowerCase().includes(lowerQuery)));
                    } catch (e) { /* ignore */ }

                    try {
                        const allExecutors = await getAllExecutors();
                        setExecutors(allExecutors.filter(e => e.name.toLowerCase().includes(lowerQuery) || e.description?.toLowerCase().includes(lowerQuery)));
                    } catch (e) { /* ignore */ }
                } else {
                    setHubs([]);
                    setExecutors([]);
                }

            } catch (err: any) {
                setError("Failed to fetch search results. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [query, tag]);

    const title = tag ? `Tag: ${tag}` : query ? `Search: ${query}` : "All Scripts";
    const totalResults = scripts.length + hubs.length + executors.length;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <section className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    Discovery
                </div>
                <h1 className="heading-base text-2xl md:text-3xl flex items-center gap-3">
                    {title}
                    <span className="text-sm font-normal text-offgray-600 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.05]">
                        {totalResults} results
                    </span>
                </h1>
            </section>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-video rounded-xl bg-white/[0.02] animate-pulse border border-white/[0.05]" />
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-red-500/20 bg-red-500/[0.02]">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            ) : (
                <div className="space-y-10">

                    {/* Hubs Results */}
                    {hubs.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-offgray-100 flex items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                Hubs
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {hubs.map(hub => (
                                    <Link key={hub.id} href={`/h/${hub.slug}`} className="flex items-center gap-3 p-3 bg-surface-panel border border-border-subtle hover:border-emerald-500/40 rounded-xl transition-all h-20">
                                        <div className="w-12 h-12 rounded-lg bg-[#0e1116] border border-white/[0.05] overflow-hidden relative shrink-0">
                                            {hub.logoUrl ? (
                                                <Image src={getStorageUrl(hub.logoUrl)} alt="" fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-emerald-500/50">{hub.name.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-offgray-50 truncate">{hub.name}</p>
                                            <p className="text-xs text-offgray-500 truncate">{hub.description || "Community Hub"}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Executors Results */}
                    {executors.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="text-lg font-semibold text-offgray-100 flex items-center gap-2">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                Executors
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {executors.map(exec => (
                                    <Link key={exec.id} href={`/executors/${exec.slug}`} className="flex items-center gap-3 p-3 bg-surface-panel border border-border-subtle hover:border-blue-500/40 rounded-xl transition-all h-20">
                                        <div className="w-12 h-12 rounded-lg bg-[#0e1116] border border-white/[0.05] overflow-hidden relative shrink-0">
                                            {exec.logoUrl ? (
                                                <Image src={getStorageUrl(exec.logoUrl)} alt="" fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-blue-500/50">{exec.name.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-offgray-50 truncate">{exec.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-offgray-500 truncate">{exec.platforms?.join(", ") || "Multi-platform"}</span>
                                                <span className="w-1 h-1 rounded-full bg-offgray-700"></span>
                                                <span className="text-[10px] text-blue-400 font-mono">{exec.priceModel || "Free"}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Scripts Results */}
                    <section className="space-y-3">
                        {scripts.length > 0 ? (
                            <>
                                <h2 className="text-lg font-semibold text-offgray-100 flex items-center gap-2">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 3v5h5" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                                    Scripts
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {scripts.map((script) => (
                                        <ScriptCard
                                            key={script.id}
                                            id={script.id}
                                            title={script.title}
                                            game={script.gameName || "Unknown Game"}
                                            stars={script.views}
                                            statType="views"
                                            timeAgo={formatRelativeTime(script.createdAt)}
                                            color="#14291e"
                                            href={`/s/${script.slug}`}
                                            gameSlug={script.gameSlug}
                                            thumbnailUrl={script.thumbnailUrl}
                                            gameLogoUrl={script.gameLogoUrl}
                                            fallbackType="icon"
                                            isPaid={script.isPaid}
                                            hasKeySystem={script.hasKeySystem}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-8">
                                <div className="text-center py-10 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] space-y-4">
                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.03] text-offgray-600">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-offgray-300 font-medium">No scripts found</p>
                                        <p className="text-offgray-500 text-xs">We couldn't find any scripts matching your search.</p>
                                    </div>
                                </div>

                                {/* Fallback Recommendations */}
                                {fallbackScripts.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                                        <div>
                                            <h3 className="text-base font-medium text-offgray-100 flex items-center gap-2">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                                Trending Scripts You Might Like
                                            </h3>
                                            <p className="text-xs text-offgray-500 mt-1">Based on popular community activity</p>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {fallbackScripts.map((script) => (
                                                <ScriptCard
                                                    key={script.id}
                                                    id={script.id}
                                                    title={script.title}
                                                    game={script.gameName || "Unknown Game"}
                                                    stars={script.views}
                                                    statType="views"
                                                    timeAgo={formatRelativeTime(script.createdAt)}
                                                    color="#14291e"
                                                    href={`/s/${script.slug}`}
                                                    gameSlug={script.gameSlug}
                                                    thumbnailUrl={script.thumbnailUrl}
                                                    gameLogoUrl={script.gameLogoUrl}
                                                    fallbackType="icon"
                                                    isPaid={script.isPaid}
                                                    hasKeySystem={script.hasKeySystem}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
