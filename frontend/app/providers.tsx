"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

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
            <QueryClientProvider client={client}>
                {children}
                <Toaster theme="dark" position="bottom-right" />
            </QueryClientProvider>
        </SessionProvider>
    );
}
