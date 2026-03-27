"use client";
import { LoadingBars } from "@/components/shared/LoadingBars";



import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { ArrowLeft, Hexagon } from "lucide-react";
import { toast } from "sonner"; // Added import for toast

export default function CreateTeamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/teams", {
        name,
        description,
        members: session?.user?.id ? [session.user.id] : [],
        leaderId: session?.user?.id,
      });
      toast.success("Team created successfully!"); // Added success toast
      router.push("/teams");
    } catch (err: unknown) { // Added type for err
      console.error(err);
      // @ts-expect-error: err type is unknown but we expect axios response
      toast.error(err.response?.data?.message || "Failed to create team"); // Replaced alert with error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex justify-center p-6 md:p-12 font-sans selection:bg-zinc-800">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 transition-colors font-mono text-xs uppercase tracking-wide"
        >
          <ArrowLeft className="w-3 h-3" />
          Abort / Return
        </button>

        <div className="bg-card border border-zinc-900 p-8 shadow-2xl relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-600"></div>
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-600"></div>

          <div className="flex items-center gap-5 mb-8 border-b border-zinc-900 pb-6">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Hexagon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-mono uppercase tracking-widest">Establish Unit</h1>
              <p className="text-zinc-600 text-xs font-mono uppercase mt-1">Configure new operational parameters</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-xs font-medium text-zinc-500 font-mono uppercase mb-3">
                Unit Designation
              </label>
              <input
                type="text"
                placeholder="E.G. ENGINEERING, RECON, SQUAD ALPHA"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-white outline-none transition-all text-white font-mono text-sm placeholder:text-zinc-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 font-mono uppercase mb-3">
                Mission Profile (Description)
              </label>
              <textarea
                placeholder="DEFINE OPERATIONAL OBJECTIVES..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-white outline-none transition-all text-white font-mono text-sm placeholder:text-zinc-800 resize-none"
              />
            </div>

            <div className="pt-6 flex items-center justify-end gap-3 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 bg-transparent border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 text-xs font-mono uppercase transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <LoadingBars className="w-3 h-3" />
                    Initializing...
                  </>
                ) : "Create Unit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
