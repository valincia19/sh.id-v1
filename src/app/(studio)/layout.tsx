import { StudioSidebar } from "@/components/layout/StudioSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Studio - scripthub.id",
    description: "Manage your scripts, hubs, and settings on ScriptHub.id",
};

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-surface-root text-offgray-300 flex">
            <StudioSidebar />
            <main className="flex-1 min-w-0 w-full px-4 md:px-8 py-6 md:py-8 pt-20 md:pt-8">
                {children}
            </main>
        </div>
    );
}
