"use client";


import { ReactNode } from "react";

export default function MainProviders({ children }: { children: ReactNode }) {
    return (
        <>
            {children}
        </>
    );
}
