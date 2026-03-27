"use client";
import { LoadingBars } from "@/components/shared/LoadingBars";
import { StatusCardSkeleton } from "@/components/shared/SkeletonLoader";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { api } from "@/lib/api";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

function InviteContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const { data: session, status } = useSession();

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<{ success: boolean; message: string; teamId?: string } | null>(null);

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            // Redirect to login with callback URL
            // We want them to come back here after login
            router.push(`/login?callbackUrl=${encodeURIComponent(`/invite?token=${token}`)}`);
            return;
        }

        if (!token) {
            setLoading(false);
            setResult({ success: false, message: "No invite token provided." });
            return;
        }

        const acceptInvite = async () => {
            try {
                const res = await api.post("/invites/accept", { token });
                setResult({ success: true, message: res.data.message, teamId: res.data.teamId });
            } catch (err: unknown) {
                // @ts-expect-error: err type is unknown but we expect axios response
                setResult({ success: false, message: err.response?.data?.error || "Failed to accept invite." });
            } finally {
                setLoading(false);
            }
        };

        // If we have aleady processed this token in this session, don't do it again? 
        // StrictMode might double call. But the backend handles idempotency (checks db).
        acceptInvite();
    }, [token, session, status, router]);

    return (
        <div className="w-full max-w-md bg-card dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-border p-8 text-center relative z-10">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Team Invitation</h1>
                <p className="text-sm text-muted-foreground mt-2">We&apos;re validating your invite and workspace access.</p>
            </div>
            {loading || status === "loading" ? (
                <StatusCardSkeleton />
            ) : result?.success ? (
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center text-success animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Aboard!</h2>
                        <p className="text-muted-foreground text-lg">{result.message}</p>
                    </div>
                    <Link
                        href={result.teamId ? `/teams/${result.teamId}` : "/dashboard"}
                        className="mt-6 px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 w-full flex items-center justify-center"
                    >
                        Go to Team
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center text-destructive animate-in zoom-in duration-300">
                        <XCircle className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Invite Failed</h2>
                        <p className="text-muted-foreground">{result?.message}</p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="mt-6 px-8 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-medium transition-all w-full flex items-center justify-center"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            )}
        </div>
    );
}

export default function InvitePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-8 right-20 w-72 h-72 bg-violet-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <Suspense fallback={<div className="w-full max-w-md"><StatusCardSkeleton /></div>}>
                <InviteContent />
            </Suspense>
        </div>
    );
}
