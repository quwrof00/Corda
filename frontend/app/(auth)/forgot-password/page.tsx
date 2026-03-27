"use client";
import { LoadingBars } from "@/components/shared/LoadingBars";


import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post("/auth/forgot-password", { email });
            setIsSubmitted(true);
            toast.success("Reset link sent!");
        } catch (error: unknown) {
            console.error(error);
            // @ts-expect-error: error type is unknown but we expect axios response
            toast.error(error.response?.data?.message || "Failed to send reset link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute bottom-0 -right-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

            <div className="w-full max-w-md bg-card backdrop-blur-xl rounded-3xl shadow-sm border border-border p-8 relative z-10 transition-all duration-500">
                <Link href="/login" className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground mb-8 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Login
                </Link>

                {!isSubmitted ? (
                    <>
                        <div className="mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Forgot Password?</h1>
                            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                Enter the email associated with your account and we&apos;ll send you a link to reset your password.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1" htmlFor="email">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground placeholder-muted-foreground"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-[1px]"
                            >
                                {loading ? (
                                    <>
                                        <LoadingBars className="w-5 h-5" />
                                        Sending Link...
                                    </>
                                ) : (
                                    <>
                                        Send Reset Link
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Check your mail</h2>
                        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                            We have sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
                        </p>
                        <p className="text-xs text-muted-foreground bg-muted p-4 rounded-lg border border-border">
                            <strong>Developer Note:</strong> Since this is a demo, check the backend console logs for the reset link!
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
