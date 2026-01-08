import { getServerSession } from "next-auth/next";
import { getAuthOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Terminal, Shield, Cpu, Activity, ArrowRight, Lock, Users } from "lucide-react";

export default async function LandingPage() {
  const session = await getServerSession(getAuthOptions());

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-zinc-300 font-sans selection:bg-zinc-800 flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-900 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-white text-black font-bold shadow-sm border border-zinc-500">
              <Terminal className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase font-mono">CORDA</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="hidden md:inline-flex text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center bg-white text-black px-6 text-xs font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all font-mono"
            >
              Create Account
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 border-b border-zinc-900">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Operational
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-[0.9]">
                COMMAND <br />
                YOUR <span className="text-zinc-600">UNITS.</span>
              </h1>

              <p className="text-lg md:text-xl text-zinc-500 max-w-lg font-mono leading-relaxed">
                Advanced task allocation protocol for high-performance engineering squads. optimized for minimal latency and maximum throughput.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/register"
                  className="inline-flex h-14 items-center justify-center bg-white text-black px-8 text-sm font-bold uppercase tracking-wider hover:bg-zinc-200 transition-all"
                >
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center border border-zinc-800 bg-transparent text-zinc-400 px-8 text-sm font-bold uppercase tracking-wider hover:bg-zinc-900 hover:text-white transition-all"
                >
                  System Login
                </Link>
              </div>
            </div>

            {/* Abstract Graphic */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent blur-3xl opacity-20" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 translate-y-8">
                  <div className="bg-card border border-zinc-900 p-6 rounded-none h-40 flex flex-col justify-between">
                    <Cpu className="w-8 h-8 text-zinc-700" />
                    <div className="text-xs font-mono text-zinc-500 uppercase">Processing Power <br /> <span className="text-white font-bold">100%</span></div>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-none h-40 flex flex-col justify-between">
                    <Activity className="w-8 h-8 text-emerald-500" />
                    <div className="text-xs font-mono text-zinc-500 uppercase">Network Status <br /> <span className="text-emerald-500 font-bold">ONLINE</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-none h-40 flex flex-col justify-between">
                    <Shield className="w-8 h-8 text-white" />
                    <div className="text-xs font-mono text-zinc-500 uppercase">Security Protocol <br /> <span className="text-white font-bold">ACTIVE</span></div>
                  </div>
                  <div className="bg-card border border-zinc-900 p-6 rounded-none h-40 flex flex-col justify-between">
                    <Users className="w-8 h-8 text-zinc-700" />
                    <div className="text-xs font-mono text-zinc-500 uppercase">Unit Cohesion <br /> <span className="text-white font-bold">OPTIMAL</span></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Features / Metrics */}
        <section className="py-24 px-6 border-b border-zinc-900 bg-background/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-2">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase font-mono">Auto-Allocation</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  System automatically assigns directives based on unit capability parameters and current workload metrics.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500 mb-2">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase font-mono">Load Balancing</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Prevents critical failure by distributing operational weight evenly across all active units.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase font-mono">Secure Protocols</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Role-based access control ensures only designated commanders can issue high-level directives.
                </p>
              </div>
            </div>
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
