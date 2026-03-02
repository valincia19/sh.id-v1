"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
    const [query, setQuery] = useState("");
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on CMD+K or CTRL+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative w-full max-w-xl group">
            {/* Search Icon */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-offgray-500 pointer-events-none">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
            </div>

            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search scripts, executors, hubs..."
                className="w-full h-10 pl-10 pr-4 bg-offgray-900/40 border border-border-subtle rounded-lg text-sm text-offgray-100 placeholder:text-offgray-600 focus:outline-none focus:border-offgray-600 transition-colors duration-100"
            />

            {/* Keyboard shortcut hint */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
                <kbd className="text-[10px] font-mono text-offgray-600 bg-offgray-900/80 border border-border-subtle rounded px-1.5 py-0.5 leading-none shadow-sm">
                    {/* Display differently based on OS (can use a simple generic display here) */}
                    Ctrl+K
                </kbd>
            </div>

            {/* Hidden submit button to support mobile keyboards matching Enter key */}
            <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1}>Search</button>
        </form>
    );
}
