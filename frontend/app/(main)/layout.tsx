import MainProviders from "./providers";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { ReactNode } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <MainProviders>
            <div className="min-h-screen flex flex-col md:flex-row bg-background">
                <Sidebar />
                <MobileNav />
                <main className="flex-1 min-w-0 transition-all duration-300 md:ml-[var(--sidebar-width,16rem)]">
                    {children}
                </main>
            </div>
        </MainProviders>
    );
}
