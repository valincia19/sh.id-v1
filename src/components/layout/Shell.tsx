"use client";

import { Header } from "./Header";
import { Footer } from "./Footer";

export function Shell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-surface-root text-offgray-300">
            <Header />
            <main className="w-full max-w-[1148px] mx-auto px-4 md:px-6 py-8 min-h-[calc(100vh-14rem)]">
                {children}
            </main>
            <Footer />
        </div>
    );
}
