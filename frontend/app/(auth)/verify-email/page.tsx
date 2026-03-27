"use client";
import { LoadingBars } from "@/components/shared/LoadingBars";
import { StatusCardSkeleton } from "@/components/shared/SkeletonLoader";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function VerifyEmailInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch("/api/auth/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                if (res.ok) {
                    setStatus("success");
                    toast.success("Email verified successfully!");
                    setTimeout(() => router.push("/login"), 3000);
                } else {
                    setStatus("error");
                }
            } catch (error) {
                console.error(error);
                setStatus("error");
            }
        };

        verify();
    }, [token, router]);

    return (
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 shadow-2xl relative text-center">
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500"></div>

            <h1 className="text-xl font-bold text-white tracking-widest uppercase font-mono mb-4">
                Email Verification
            </h1>

            {status === "loading" && (
                <StatusCardSkeleton />
            )}

            {status === "success" && (
                <div className="flex flex-col items-center justify-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                    <p className="text-zinc-300 font-mono mb-6">Verification successful. Access granted.</p>
                    <Link
                        href="/login"
                        className="inline-block bg-white text-black px-6 py-2 font-mono uppercase font-bold text-sm tracking-widest hover:bg-zinc-200 transition-colors"
                    >
                        Proceed to Login
                    </Link>
                </div>
            )}

            {status === "error" && (
                <div className="flex flex-col items-center justify-center py-8">
                    <XCircle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-zinc-300 font-mono mb-6">Verification failed. Invalid or expired token.</p>
                    <p className="text-xs text-zinc-500 font-mono mb-6">PLEASE RE-INITIATE REGISTRATION PROTOCOL.</p>
                </div>
            )}
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-black text-zinc-300 p-4 font-sans selection:bg-zinc-800">
            <Suspense fallback={<div className="w-full max-w-md"><StatusCardSkeleton /></div>}>
                <VerifyEmailInner />
            </Suspense>
        </main>
    );
}
