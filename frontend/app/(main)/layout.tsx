import MainProviders from "./providers";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import GlobalModals from "@/components/GlobalModals";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <MainProviders>
            <div className="min-h-screen flex flex-col md:flex-row bg-background">
                {/* Visual Identity: Premium Blue Accent Top Bar */}
                <div className="fixed top-0 left-0 right-0 h-[2px] bg-blue-600 z-[9999] pointer-events-none shadow-[0_1px_10px_rgba(37,99,235,0.3)]" />
                <Sidebar />
                <MobileNav />
                <main className="flex-1 min-w-0 transition-all duration-300 md:ml-[var(--sidebar-width,16rem)]">
                    {children}
                    <GlobalModals />
                </main>
            </div>
        </MainProviders>
    );
}
