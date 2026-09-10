import { cn } from "./utils";
import { LayoutDashboard, Users, Briefcase, PenSquare, Focus, ClipboardList } from "lucide-react";

interface MobileNavTabsProps {
    isPersonal: boolean;
    mobileTab: "workload" | "unassigned" | "assigned";
    setMobileTab: (tab: "workload" | "unassigned" | "assigned") => void;
    onOpenScratchpad: () => void;
}

export function MobileNavTabs({ isPersonal, mobileTab, setMobileTab, onOpenScratchpad }: MobileNavTabsProps) {
    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-16 px-2">
                    <>
                        <button
                            onClick={() => setMobileTab("assigned")}
                            className={cn("flex flex-col items-center justify-center w-full h-full space-y-1",
                                mobileTab === "assigned" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                            )}
                        >
                            <Users className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Tasks</span>
                        </button>
                        <button
                            onClick={() => setMobileTab("workload")}
                            className={cn("flex flex-col items-center justify-center w-full h-full space-y-1",
                                mobileTab === "workload" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                            )}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Workload</span>
                        </button>
                        <button
                            onClick={() => setMobileTab("unassigned")}
                            className={cn("flex flex-col items-center justify-center w-full h-full space-y-1",
                                mobileTab === "unassigned" ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                            )}
                        >
                            <Briefcase className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Unassigned</span>
                        </button>
                        <button
                            onClick={onOpenScratchpad}
                            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                        >
                            <PenSquare className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Scratchpad</span>
                        </button>
                    </>
            </div>
        </div>
    );
}
