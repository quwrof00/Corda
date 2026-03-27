import { RefObject, useEffect, useRef } from "react";

interface UseInfiniteScrollTriggerOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  rootRef?: RefObject<Element | null>;
  rootMargin?: string;
}

export function useInfiniteScrollTrigger({
  hasMore,
  isLoading,
  onLoadMore,
  rootRef,
  rootMargin = "200px",
}: UseInfiniteScrollTriggerOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      {
        root: rootRef?.current ?? null,
        rootMargin,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, rootMargin, rootRef]);

  return sentinelRef;
}
