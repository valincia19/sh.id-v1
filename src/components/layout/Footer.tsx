import Link from "next/link";
import Image from "next/image";

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-white/[0.06] bg-[#0a0c0f]">
            <div className="w-full max-w-[1148px] mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
                        <Link href="/home" className="flex items-center gap-2 select-none w-fit">
                            <img
                                src="/logo.svg"
                                alt="ScriptHub Logo"
                                className="w-6 h-6"
                            />
                            <span className="text-[15px] font-semibold text-offgray-50 tracking-tight">
                                script<span className="text-emerald-400">hub</span>
                            </span>
                        </Link>
                        <p className="text-[13px] text-offgray-500 leading-relaxed max-w-xs">
                            The ultimate ecosystem for Roblox script developers and players to discover, publish, and monetize top-tier scripts.
                        </p>
                    </div>

                    {/* Resources */}
                    <div className="col-span-1">
                        <h3 className="text-[13px] font-semibold text-offgray-100 mb-4 tracking-tight">Resources</h3>
                        <ul className="flex flex-col gap-2.5">
                            <li>
                                <Link href="/trending" className="text-[13px] text-offgray-500 hover:text-emerald-400 transition-colors">
                                    Trending Scripts
                                </Link>
                            </li>
                            <li>
                                <Link href="/hubs" className="text-[13px] text-offgray-500 hover:text-emerald-400 transition-colors">
                                    Browse Hubs
                                </Link>
                            </li>
                            <li>
                                <Link href="/executors" className="text-[13px] text-offgray-500 hover:text-emerald-400 transition-colors">
                                    Supported Executors
                                </Link>
                            </li>
                            <li>
                                <Link href="/changelog" className="text-[13px] text-offgray-500 hover:text-emerald-400 transition-colors">
                                    Changelog
                                </Link>
                            </li>
                            <li>
                                <Link href="/api-docs" className="text-[13px] text-offgray-500 hover:text-emerald-400 transition-colors">
                                    API Documentation
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="col-span-1">
                        <h3 className="text-[13px] font-semibold text-offgray-100 mb-4 tracking-tight">Legal</h3>
                        <ul className="flex flex-col gap-2.5">
                            <li>
                                <Link href="/rules" className="text-[13px] text-offgray-500 hover:text-emerald-400 transition-colors">
                                    Platform Rules
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-[13px] text-offgray-500 hover:text-emerald-400 transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-[13px] text-offgray-500 hover:text-emerald-400 transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Socials */}
                    <div className="col-span-1">
                        <h3 className="text-[13px] font-semibold text-offgray-100 mb-4 tracking-tight">Community</h3>
                        <ul className="flex flex-col gap-2.5">
                            <li>
                                <a href="https://discord.gg/YvCHtxQpSZ" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-offgray-500 hover:text-[#5865F2] transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                    Discord Server
                                </a>
                            </li>
                            <li>
                                <a href="https://www.tiktok.com/@scripthub.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-offgray-500 hover:text-white transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.674c-.273.7-1.006 1.134-1.742 1.134-1.058 0-1.921-.863-1.921-1.922 0-1.059.863-1.92 1.921-1.92.195 0 .385.03.565.086V9.654a5.353 5.353 0 0 0-5.931 5.249c0 2.955 2.395 5.35 5.35 5.35s5.35-2.395 5.35-5.35V8.981a8.216 8.216 0 0 0 5.617 2.217v-3.411c-1.026-.002-1.966-.46-2.583-1.1z" />
                                    </svg>
                                    TikTok
                                </a>
                            </li>
                            <li>
                                <a href="https://www.instagram.com/scripthub.id/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-offgray-500 hover:text-[#E1306C] transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                    </svg>
                                    Instagram
                                </a>
                            </li>
                            <li>
                                <a href="https://x.com/scripthub_id?s=20" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] text-offgray-500 hover:text-white transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                    X (Twitter)
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[12px] text-offgray-600">
                        &copy; {currentYear} ScriptHub. All rights reserved. Not affiliated with Roblox Corporation.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-[12px] text-offgray-600 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
