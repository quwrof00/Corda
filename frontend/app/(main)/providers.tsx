"use client";


import { Toaster } from "sonner";
import { ReactNode } from "react";

export default function MainProviders({ children }: { children: ReactNode }) {
    return (
        <>
            {children}
            <Toaster theme="dark" position="bottom-right" />
        </>
    );
}
