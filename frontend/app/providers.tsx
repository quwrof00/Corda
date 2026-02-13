"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { SocketProvider } from "@/components/providers/SocketProvider";

import { Session } from "next-auth";

export default function Providers({ children, session }: { children: ReactNode, session: Session | null }) {
    const [client] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <SessionProvider session={session}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                <QueryClientProvider client={client}>
                    <SocketProvider>
                        {children}
                    </SocketProvider>
                    <Toaster theme="system" position="bottom-right" />
                </QueryClientProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
