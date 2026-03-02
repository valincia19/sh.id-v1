export default function GetKeyStubPage() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                </div>
                <h1 className="text-2xl font-serif text-white">Development Stub</h1>
                <p className="text-offgray-500 font-mono text-sm leading-relaxed">
                    The full GetKey monetization engine has been aggressively purged from this codebase for enterprise distribution.<br /><br />
                    This is a localhost stub allowing testing routes without database dependencies or Cloudflare integrations.
                </p>
                <div className="pt-4">
                    <code className="px-4 py-2 rounded-lg bg-neutral-900 border border-white/10 text-xs text-sky-400 font-mono">
                        status: purged
                    </code>
                </div>
            </div>
        </div>
    );
}
