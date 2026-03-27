"use client";

import { AuthSkeleton } from "@/components/shared/SkeletonLoader";
import { LoadingBars } from "@/components/shared/LoadingBars";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function LoginForm() {
    const router = useRouter();
    const { status } = useSession();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const isSessionLoading = status === "loading";

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/dashboard");
        }
    }, [status, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        setLoading(false);

        if (res?.error) {
            if (res.error === "Email not verified. Please check your inbox.") {
                toast.error("Email not verified. Please check your inbox to access the system.");
            } else {
                toast.error("Invalid credentials. Please check your email and password.");
            }
        } else {
            toast.success("Welcome back!");
            router.push("/dashboard");
        }
    };

    if (status === "authenticated") return null;

    return (
        <main className="min-h-screen flex items-center justify-center bg-background text-zinc-300 p-4 font-sans selection:bg-zinc-800">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-card border border-zinc-900 p-8 shadow-2xl relative"
            >
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500"></div>

                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6 group">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 bg-white flex items-center justify-center text-black font-bold font-mono text-xl transition-transform"
                        >
                            <ShieldCheck className="w-6 h-6" />
                        </motion.div>
                    </Link>
                    <h1 className="text-xl font-bold text-white tracking-widest uppercase font-mono">Login</h1>
                    <p className="text-zinc-500 mt-2 text-xs font-mono uppercase">Sign in to your account</p>
                </div>

                {isSessionLoading ? (
                    <div className="pt-2">
                        <AuthSkeleton />
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase font-mono ml-1" htmlFor="email">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-white transition-colors">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-white outline-none transition-all text-white placeholder:text-zinc-700 font-mono text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-zinc-500 uppercase font-mono ml-1" htmlFor="password">Password</label>
                                <Link href="/forgot-password" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white hover:underline font-mono">Forgot password?</Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-white transition-colors">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="........"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-white outline-none transition-all text-white placeholder:text-zinc-700 font-mono text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3 text-sm font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <LoadingBars className="w-4 h-4" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </motion.button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase font-mono">
                                <span className="bg-card px-2 text-zinc-500">Or continue with</span>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                            className="w-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium py-3 text-sm font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            Google
                        </motion.button>
                    </form>
                )}

                <div className="mt-8 text-center border-t border-zinc-900 pt-6">
                    <p className="text-xs text-zinc-600 font-mono uppercase">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-bold text-white hover:underline transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
