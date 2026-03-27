import { RefObject, useEffect, useMemo, useRef, useState } from "react";

export function useBatchedItems<T>(
    items: T[],
    batchSize = 12,
    rootRef?: RefObject<Element | null>
) {
    const [visibleCount, setVisibleCount] = useState(batchSize);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setVisibleCount(batchSize);
    }, [items, batchSize]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || visibleCount >= items.length) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisibleCount((current) => Math.min(current + batchSize, items.length));
                }
            },
            {
                root: rootRef?.current ?? null,
                rootMargin: "200px 0px",
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [visibleCount, items.length, batchSize, rootRef]);

    const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

    return {
        visibleItems,
        hasMore: visibleCount < items.length,
        sentinelRef,
        totalCount: items.length,
        visibleCount,
    };
}
