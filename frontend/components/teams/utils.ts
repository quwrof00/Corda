import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDaysLeft(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();

    // Reset time part for accurate day calculation
    date.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
}
