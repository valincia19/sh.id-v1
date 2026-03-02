import { AdminSidebar } from "@/components/layout/AdminSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Admin - scripthub.id",
    description: "Admin panel for scripthub.id",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-surface-root text-offgray-300 flex">
            <AdminSidebar />
            <main className="flex-1 min-w-0 w-full px-4 md:px-8 py-6 md:py-8 pt-20 md:pt-8">
                <div className="max-w-[1148px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
