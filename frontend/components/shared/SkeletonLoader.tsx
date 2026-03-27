import React from "react";

function SkeletonBlock({ className = "" }: { className?: string }) {
    return <div className={`rounded-md bg-zinc-800/80 animate-pulse ${className}`} />;
}

export function SkeletonLoader({ rows = 5, className = "" }: { rows?: number; className?: string }) {
    return (
        <div className={`w-full space-y-4 ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="flex gap-4 p-4 border border-zinc-900/50 rounded-xl bg-zinc-950/20 items-center"
                >
                    <SkeletonBlock className="h-6 w-6 rounded-full" />
                    <div className="flex-1 space-y-3">
                        <SkeletonBlock className="h-3 w-3/4" />
                        <SkeletonBlock className="h-2 w-1/2 bg-zinc-900/80" />
                    </div>
                    <SkeletonBlock className="h-4 w-16 bg-zinc-800/50" />
                </div>
            ))}
        </div>
    );
}

export function AuthSkeleton({ fields = 2, showSocial = true }: { fields?: number; showSocial?: boolean }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: fields }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <SkeletonBlock className="h-3 w-24" />
                    <SkeletonBlock className="h-12 w-full rounded-xl bg-zinc-900/80" />
                </div>
            ))}

            <SkeletonBlock className="h-12 w-full rounded-xl bg-zinc-800" />

            {showSocial ? (
                <>
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-zinc-800" />
                        </div>
                        <div className="relative flex justify-center">
                            <SkeletonBlock className="h-3 w-28 bg-card px-2" />
                        </div>
                    </div>
                    <SkeletonBlock className="h-12 w-full rounded-xl bg-zinc-900/80" />
                </>
            ) : null}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <SkeletonBlock className="h-6 w-32" />
                        <SkeletonBlock className="h-4 w-20" />
                    </div>
                    <SkeletonLoader rows={6} />
                </div>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <SkeletonBlock className="h-6 w-28" />
                        <SkeletonBlock className="h-4 w-20" />
                    </div>
                    <TeamGridSkeleton count={3} compact />
                </div>
            </div>
        </div>
    );
}

export function TaskListSkeleton({ rows = 6 }: { rows?: number }) {
    return <SkeletonLoader rows={rows} className="space-y-3" />;
}

export function TeamGridSkeleton({ count = 6, compact = false }: { count?: number; compact?: boolean }) {
    return (
        <div className={`grid grid-cols-1 ${compact ? "gap-4" : "md:grid-cols-2 lg:grid-cols-3 gap-6"}`}>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-xl border border-zinc-800/70 bg-card p-6 space-y-5 animate-pulse"
                >
                    <div className="flex items-center gap-4">
                        <SkeletonBlock className="h-12 w-12 rounded-lg bg-zinc-900/80" />
                        <div className="space-y-2 flex-1">
                            <SkeletonBlock className="h-4 w-32" />
                            <SkeletonBlock className="h-3 w-24 bg-zinc-900/80" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <SkeletonBlock className="h-3 w-full bg-zinc-900/80" />
                        <SkeletonBlock className="h-3 w-4/5 bg-zinc-900/80" />
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                        <SkeletonBlock className="h-3 w-20 bg-zinc-900/80" />
                        <SkeletonBlock className="h-3 w-12 bg-zinc-900/80" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-card border border-zinc-900 p-6 shadow-xl rounded-xl space-y-6 animate-pulse">
                    <SkeletonBlock className="h-3 w-24" />
                    <SkeletonBlock className="h-8 w-3/4" />
                    <SkeletonBlock className="h-4 w-2/3 bg-zinc-900/80" />
                    <SkeletonBlock className="h-6 w-28 bg-zinc-900/80" />
                </div>
                <div className="bg-card border border-zinc-900 p-6 shadow-xl rounded-xl space-y-4 animate-pulse">
                    <SkeletonBlock className="h-3 w-16" />
                    <div className="grid grid-cols-2 gap-4">
                        <SkeletonBlock className="h-20 w-full rounded-lg bg-zinc-900/80" />
                        <SkeletonBlock className="h-20 w-full rounded-lg bg-zinc-900/80" />
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-zinc-900 p-8 shadow-xl rounded-xl space-y-5 animate-pulse">
                    <SkeletonBlock className="h-6 w-40" />
                    <SkeletonBlock className="h-28 w-full rounded-lg bg-zinc-900/80" />
                </div>
                <div className="bg-card border border-zinc-900 p-8 shadow-xl rounded-xl space-y-5 animate-pulse">
                    <div className="flex items-center justify-between">
                        <SkeletonBlock className="h-6 w-48" />
                        <SkeletonBlock className="h-9 w-28 rounded-lg" />
                    </div>
                    <SkeletonBlock className="h-14 w-full rounded-lg bg-zinc-900/80" />
                    <SkeletonLoader rows={4} />
                </div>
            </div>
        </div>
    );
}

export function TeamWorkspaceSkeleton({ personal = false }: { personal?: boolean }) {
    return (
        <div className="space-y-8">
            <div className="rounded-2xl border border-zinc-800 bg-card p-6 md:p-8 animate-pulse">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-3">
                        <SkeletonBlock className="h-8 w-56" />
                        <SkeletonBlock className="h-4 w-72 bg-zinc-900/80" />
                    </div>
                    <div className="flex gap-3">
                        <SkeletonBlock className="h-10 w-24 rounded-lg" />
                        <SkeletonBlock className="h-10 w-28 rounded-lg bg-zinc-900/80" />
                    </div>
                </div>
            </div>

            {personal ? (
                <div className="space-y-6">
                    <SkeletonLoader rows={5} />
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-1 rounded-2xl border border-zinc-800 bg-card p-6 space-y-4 animate-pulse">
                        <SkeletonBlock className="h-5 w-40" />
                        <SkeletonBlock className="h-48 w-full rounded-xl bg-zinc-900/80" />
                        <SkeletonBlock className="h-28 w-full rounded-xl bg-zinc-900/80" />
                    </div>
                    <div className="xl:col-span-2 space-y-6">
                        <SkeletonLoader rows={5} />
                    </div>
                </div>
            )}
        </div>
    );
}

export function FormSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="space-y-6">
            {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="space-y-2 animate-pulse">
                    <SkeletonBlock className="h-3 w-28" />
                    <SkeletonBlock className="h-12 w-full rounded-xl bg-zinc-900/70" />
                </div>
            ))}
        </div>
    );
}

export function StatusCardSkeleton() {
    return (
        <div className="flex flex-col items-center gap-4 py-6 animate-pulse">
            <SkeletonBlock className="h-16 w-16 rounded-full" />
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-4 w-56 bg-zinc-900/80" />
            <SkeletonBlock className="h-11 w-full rounded-xl bg-zinc-900/80" />
        </div>
    );
}
