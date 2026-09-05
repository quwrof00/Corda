"use client";

import Link from "next/link";
import { Terminal, Shield, Cpu, Activity, ArrowRight, Lock, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (session) return null;

  return (
    <div className="min-h-screen bg-background text-zinc-300 font-sans selection:bg-zinc-800 flex flex-col">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 z-50 w-full border-b border-zinc-900 bg-background/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-white text-black font-bold shadow-sm border border-zinc-500">
              <Terminal className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase font-mono">CORDA</span>
          </div>

          <div className="flex items-center gap-6">
            {status === "loading" ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="hidden md:block h-3 w-12 rounded bg-zinc-800" />
                <div className="h-10 w-32 rounded bg-zinc-800" />
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/register"
                    className="inline-flex h-10 items-center justify-center bg-white text-black px-6 text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all font-mono shadow-sm hover:shadow-md"
                  >
                    Create Account
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 border-b border-zinc-900">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >

              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-[0.9]">
                ORCHESTRATE <br />
                YOUR <span className="text-zinc-600">TEAM.</span>
              </h1>

              <p className="text-lg md:text-xl text-zinc-500 max-w-lg font-mono leading-relaxed">
                The definitive platform for engineering leadership. Gain absolute clarity on team progress, assign tasks with precision, and eliminate ambiguity.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/register"
                    className="inline-flex h-14 items-center justify-center bg-white text-black px-8 text-sm font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all shadow-md hover:shadow-lg"
                  >
                    Start Free <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/login"
                    className="inline-flex h-14 items-center justify-center border border-zinc-800 bg-transparent text-zinc-400 px-8 text-sm font-bold uppercase tracking-wider hover:bg-zinc-900 hover:text-white transition-all"
                  >
                    Log In
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Abstract Graphic */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent blur-3xl opacity-30" />
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6 translate-y-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ y: -2 }}
                    className="group relative bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 p-6 rounded-none h-48 flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-500/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-none bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Cpu className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="z-10 mt-2">
                      <h3 className="text-base font-bold text-white">Seamless Collaboration</h3>
                      <p className="text-xs text-zinc-400 mt-1">Work together without friction across teams.</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ y: -2 }}
                    className="group relative bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 p-6 rounded-none h-48 flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-500/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-none bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="z-10 mt-2">
                      <h3 className="text-base font-bold text-white">Effortless Tracking</h3>
                      <p className="text-xs text-zinc-400 mt-1">Know exactly what's happening in real-time.</p>
                    </div>
                  </motion.div>
                </div>
                
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ y: -2 }}
                    className="group relative bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 p-6 rounded-none h-48 flex flex-col justify-between cursor-pointer transition-all hover:border-zinc-500/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-none bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                      <Shield className="w-6 h-6 text-zinc-300" />
                    </div>
                    <div className="z-10 mt-2">
                      <h3 className="text-base font-bold text-white">Enterprise Security</h3>
                      <p className="text-xs text-zinc-400 mt-1">Your data is completely protected and private.</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    whileHover={{ y: -2 }}
                    className="group relative bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/50 p-6 rounded-none h-48 flex flex-col justify-between cursor-pointer transition-all hover:border-zinc-500/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-12 h-12 rounded-none bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                      <Users className="w-6 h-6 text-zinc-300" />
                    </div>
                    <div className="z-10 mt-2">
                      <h3 className="text-base font-bold text-white">Team Alignment</h3>
                      <p className="text-xs text-zinc-400 mt-1">Keep everyone perfectly in sync, always.</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* How it Works & Who it's for */}
        <section className="py-24 px-6 border-b border-zinc-900 bg-zinc-950/50">
          <div className="w-full">
            <div className="max-w-7xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4 uppercase font-mono">BUILT FOR CLARITY.</h2>
              <p className="text-zinc-400 text-lg max-w-2xl">Everything you need to orchestrate your teams, elegantly packaged into one platform.</p>
            </div>

            {/* Content Area */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-16 relative max-w-7xl mx-auto"
            >
              {/* How it works */}
              <div className="space-y-10">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                  <Activity className="w-5 h-5 text-emerald-500" /> 
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300 font-mono">How It Works</h3>
                </div>
                
                <div className="space-y-8">
                  <div className="flex gap-6 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-zinc-900 flex items-center justify-center font-mono font-bold text-white border border-zinc-800 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-colors">01</div>
                    <div>
                      <h4 className="text-white font-bold text-lg uppercase font-mono tracking-tight">Create Workspace</h4>
                      <p className="text-zinc-500 text-sm mt-2 leading-relaxed">Set up your company, invite leaders, and map out your organizational structure effortlessly.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-zinc-900 flex items-center justify-center font-mono font-bold text-white border border-zinc-800 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-colors">02</div>
                    <div>
                      <h4 className="text-white font-bold text-lg uppercase font-mono tracking-tight">Define Goals</h4>
                      <p className="text-zinc-500 text-sm mt-2 leading-relaxed">Break down large objectives into assignable, trackable tasks for specific teams and members.</p>
                    </div>
                  </div>
                  <div className="flex gap-6 group">
                    <div className="flex-shrink-0 w-12 h-12 bg-zinc-900 flex items-center justify-center font-mono font-bold text-emerald-500 border border-emerald-500/30 transition-colors">03</div>
                    <div>
                      <h4 className="text-white font-bold text-lg uppercase font-mono tracking-tight">Orchestrate</h4>
                      <p className="text-zinc-500 text-sm mt-2 leading-relaxed">Watch real-time progress. Identify blockers instantly. Ship faster with absolute clarity.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Who is it for */}
              <div className="space-y-10">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                  <Users className="w-5 h-5 text-zinc-500" /> 
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300 font-mono">Target Audience</h3>
                </div>
                
                <div className="grid gap-4">
                  <div className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-none hover:border-zinc-700 hover:bg-zinc-900 transition-all">
                    <h4 className="text-white font-bold flex items-center gap-3 uppercase font-mono tracking-tight">
                      <Terminal className="w-5 h-5 text-emerald-500" /> Engineering Leaders
                    </h4>
                    <p className="text-zinc-500 text-sm mt-3 leading-relaxed">CTOs and VPs who need a bird's-eye view of all engineering operations without micromanaging.</p>
                  </div>
                  <div className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-none hover:border-zinc-700 hover:bg-zinc-900 transition-all">
                    <h4 className="text-white font-bold flex items-center gap-3 uppercase font-mono tracking-tight">
                      <Lock className="w-5 h-5 text-emerald-500" /> Product Managers
                    </h4>
                    <p className="text-zinc-500 text-sm mt-3 leading-relaxed">PMs ensuring features ship on time by perfectly aligning resources and tracking daily velocity.</p>
                  </div>
                  <div className="bg-zinc-950/50 border border-zinc-800 p-6 rounded-none hover:border-zinc-700 hover:bg-zinc-900 transition-all">
                    <h4 className="text-white font-bold flex items-center gap-3 uppercase font-mono tracking-tight">
                      <Cpu className="w-5 h-5 text-emerald-500" /> Development Teams
                    </h4>
                    <p className="text-zinc-500 text-sm mt-3 leading-relaxed">Engineers who want clear requirements, less noise, and obvious priorities every single sprint.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 bg-zinc-950 border-t border-zinc-900 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-zinc-800 text-white flex items-center justify-center text-[10px] font-bold">C</div>
              <span className="text-xs font-bold text-zinc-500 uppercase font-mono">CORDA SYSTEMS &copy; {new Date().getFullYear()}</span>
            </div>

            <div className="flex gap-8">
              <Link href="#" className="text-xs font-bold text-zinc-600 hover:text-white uppercase transition-colors">Documentation</Link>
              <Link href="#" className="text-xs font-bold text-zinc-600 hover:text-white uppercase transition-colors">Status</Link>
              <Link href="#" className="text-xs font-bold text-zinc-600 hover:text-white uppercase transition-colors">Privacy</Link>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
