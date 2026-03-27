"use client";

import { useEffect, useState } from "react";
import { useThemeStore, ThemeType } from "@/store/useThemeStore";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export default function AmbientBackground() {
    const { theme: chosenTheme } = useThemeStore();
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkTime = () => {
            const hour = new Date().getHours();
            let time: TimeOfDay = "morning";

            if (hour >= 5 && hour < 12) {
                time = "morning";
            } else if (hour >= 12 && hour < 17) {
                time = "afternoon";
            } else if (hour >= 17 && hour < 21) {
                time = "evening";
            } else {
                time = "night";
            }

            setTimeOfDay(time);
            document.documentElement.setAttribute("data-time", time);
            document.documentElement.setAttribute("data-theme", chosenTheme);
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [chosenTheme]);

    if (!mounted) return null;

    const gradients: Record<ThemeType, string | Record<TimeOfDay, string>> = {
        auto: {
            morning: "from-amber-400/30 via-amber-400/5 to-transparent",
            afternoon: "from-orange-500/30 via-orange-500/5 to-transparent",
            evening: "from-green-600/30 via-green-600/5 to-transparent",
            night: "from-indigo-900/40 via-blue-900/10 to-transparent",
        },
        coffee: "from-amber-900/30 via-amber-800/10 to-transparent",
        mountains: "from-blue-400/20 via-slate-400/5 to-transparent",
        hills: "from-emerald-600/20 via-green-600/5 to-transparent",
    };

    const currentGradient = chosenTheme === 'auto' 
        ? (gradients.auto as Record<TimeOfDay, string>)[timeOfDay] 
        : gradients[chosenTheme] as string;

    return (
        <div
            className={`fixed top-0 left-0 right-0 h-48 sm:h-64 md:h-[32rem] w-full pointer-events-none z-[1] bg-gradient-to-b ${currentGradient} transition-all duration-500 opacity-60 dark:opacity-80 drop-shadow-[0_0_50px_rgba(0,0,0,0.1)]`}
            aria-hidden="true"
        />
    );
}
