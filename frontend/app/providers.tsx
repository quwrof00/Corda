"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ReactNode, useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: ReactNode }) {
    const [client] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                // Avoid refetching immediately if we just hydrated from server
                refetchOnMount: false,
                refetchOnWindowFocus: false
            }
        }
    }));
    const pathname = usePathname();
    const isPublicPage = ["/", "/login", "/register", "/verify-email"].includes(pathname);

    return (
        <SessionProvider>
            <QueryClientProvider client={client}>
                <div className="min-h-screen flex flex-col md:flex-row">
                    {!isPublicPage && (
                        <>
                            <Sidebar />
                            <MobileNav />
                        </>
                    )}
                    <main className={`flex-1 min-w-0 transition-all duration-300 ${!isPublicPage ? 'md:ml-64' : ''}`}>
                        {children}
                    </main>
                </div>
                <Toaster theme="dark" position="bottom-right" />
            </QueryClientProvider>
        </SessionProvider>
    );
}
