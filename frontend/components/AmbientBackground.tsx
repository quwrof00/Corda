"use client";

import { useEffect, useState } from "react";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export default function AmbientBackground() {
    const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("morning");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkTime = () => {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) {
                setTimeOfDay("morning");
            } else if (hour >= 12 && hour < 17) {
                setTimeOfDay("afternoon");
            } else if (hour >= 17 && hour < 21) {
                setTimeOfDay("evening");
            } else {
                setTimeOfDay("night");
            }
        };

        checkTime();
        const interval = setInterval(checkTime, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    const gradients = {
        morning: "from-amber-500/20 via-amber-500/5 to-transparent",
        afternoon: "from-sky-500/20 via-sky-500/5 to-transparent",
        evening: "from-rose-500/20 via-purple-500/5 to-transparent",
        night: "from-indigo-900/40 via-blue-900/10 to-transparent",
    };

    return (
        <div
            className={`fixed top-0 left-0 right-0 h-48 sm:h-64 md:h-96 w-full pointer-events-none z-[1] bg-gradient-to-b ${gradients[timeOfDay]} transition-colors duration-1000 opacity-50`}
            aria-hidden="true"
        />
    );
}
