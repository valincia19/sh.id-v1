import { CHANGELOG_DATA } from "@/lib/constants/changelog";

export const metadata = {
    title: "Changelogs | ScriptHub",
    description: "Latest updates and changes to ScriptHub",
};

const CATEGORY_STYLES: Record<string, { text: string }> = {
    Added: { text: "text-emerald-400" },
    Improved: { text: "text-blue-400" },
    Changed: { text: "text-indigo-400" },
    Fixed: { text: "text-amber-400" },
    Security: { text: "text-rose-400" },
    Infrastructure: { text: "text-offgray-300" },
};

export default function ChangelogsPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            {/* Header */}
            <section className="space-y-1.5 border-b border-white/[0.06] pb-6">
                <h1 className="heading-base text-2xl text-offgray-50">Changelogs</h1>
                <p className="text-sm text-offgray-500">
                    See what's new, changed, and fixed on ScriptHub.
                </p>
            </section>

            {/* Content List */}
            <div className="space-y-12 pb-12">
                {CHANGELOG_DATA.map((release) => (
                    <div key={release.version} className="relative pl-6 border-l border-white/[0.06] space-y-4">
                        {/* Timeline Dot */}
                        <div
                            className={`absolute w-3 h-3 rounded-full -left-[6.5px] top-1.5 border ${release.isLatest
                                ? "bg-emerald-500/20 border-emerald-500/50"
                                : "bg-white/[0.06] border-white/[0.1]"
                                }`}
                        ></div>

                        {/* Title Block */}
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-offgray-50">
                                    {release.version} ({release.title})
                                </h2>
                                <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-offgray-400 font-mono">
                                    {release.date}
                                </span>
                            </div>
                            <p className="text-sm text-offgray-500 mt-1">
                                {release.description}
                            </p>
                        </div>

                        {/* Change Categories (Added, Fixed, etc.) */}
                        {release.changes.map((changeBlock) => (
                            <div key={changeBlock.category} className="space-y-3">
                                <h3 className={`text-xs font-semibold uppercase tracking-wider ${CATEGORY_STYLES[changeBlock.category].text}`}>
                                    {changeBlock.category}
                                </h3>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-offgray-300">
                                    {changeBlock.items.map((item, idx) => (
                                        <li key={idx} dangerouslySetInnerHTML={{
                                            __html: item.replace(/`([^`]+)`/g, '<code class="bg-white/[0.06] px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')
                                        }} />
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
