import { cn } from "./utils";

interface MobileNavTabsProps {
    isPersonal: boolean;
    mobileTab: "workload" | "unassigned" | "assigned";
    setMobileTab: (tab: "workload" | "unassigned" | "assigned") => void;
}

export function MobileNavTabs({ isPersonal, mobileTab, setMobileTab }: MobileNavTabsProps) {
    return (
        <div className="lg:hidden sticky top-40 md:top-[95px] z-20 bg-background/95 backdrop-blur border-b border-zinc-800 overflow-x-auto scrollbar-hide">
            <div className="flex px-6 gap-6 min-w-max">
                {isPersonal ? (
                    <>
                        <button
                            onClick={() => setMobileTab("unassigned")}
                            className={cn("py-4 text-xs font-bold transition-colors border-b-2",
                                mobileTab === "unassigned" ? "text-white border-emerald-500" : "text-zinc-500 border-transparent hover:text-zinc-300"
                            )}
                        >
                            Focus Overview
                        </button>
                        <button
                            onClick={() => setMobileTab("assigned")}
                            className={cn("py-4 text-xs font-bold transition-colors border-b-2",
                                mobileTab === "assigned" ? "text-white border-emerald-500" : "text-zinc-500 border-transparent hover:text-zinc-300"
                            )}
                        >
                            My Tasks
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setMobileTab("assigned")}
                            className={cn("py-4 text-xs font-bold transition-colors border-b-2",
                                mobileTab === "assigned" ? "text-white border-emerald-500" : "text-zinc-500 border-transparent hover:text-zinc-300"
                            )}
                        >
                            Member Tasks
                        </button>
                        <button
                            onClick={() => setMobileTab("workload")}
                            className={cn("py-4 text-xs font-bold transition-colors border-b-2",
                                mobileTab === "workload" ? "text-white border-emerald-500" : "text-zinc-500 border-transparent hover:text-zinc-300"
                            )}
                        >
                            Workload
                        </button>
                        <button
                            onClick={() => setMobileTab("unassigned")}
                            className={cn("py-4 text-xs font-bold transition-colors border-b-2",
                                mobileTab === "unassigned" ? "text-white border-emerald-500" : "text-zinc-500 border-transparent hover:text-zinc-300"
                            )}
                        >
                            Unassigned
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
