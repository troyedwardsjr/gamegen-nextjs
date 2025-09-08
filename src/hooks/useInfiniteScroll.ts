"use client";

import { useRef, useEffect, useCallback } from "react";

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  threshold = 100,
  rootMargin = "0px",
}: UseInfiniteScrollOptions) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  const sentinelRef = useRef<HTMLDivElement>();

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;

      if (entry.isIntersecting && hasMore) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore],
  );

  useEffect(() => {
    if (!scrollRef.current) return;

    // Create sentinel element if it doesn't exist
    if (!sentinelRef.current) {
      sentinelRef.current = document.createElement("div");
      sentinelRef.current.style.height = "1px";
      sentinelRef.current.style.visibility = "hidden";
      sentinelRef.current.setAttribute("data-infinite-scroll-sentinel", "true");
    }

    const scrollContainer = scrollRef.current;
    const sentinel = sentinelRef.current;

    // Add sentinel to the bottom of scroll container
    if (!scrollContainer.contains(sentinel)) {
      scrollContainer.appendChild(sentinel);
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: scrollContainer,
      rootMargin,
      threshold: 0.1,
    });

    if (sentinel) {
      observerRef.current.observe(sentinel);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (sentinel && scrollContainer.contains(sentinel)) {
        scrollContainer.removeChild(sentinel);
      }
    };
  }, [handleIntersection, rootMargin]);

  // Alternative scroll-based approach for better control
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceToBottom < threshold) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, threshold]);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return {
    scrollRef,
  };
}

// Simpler hook for scroll-to-load-more functionality
export function useScrollToBottom(callback: () => void, threshold = 100) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceToBottom < threshold) {
        callback();
      }
    };

    const scrollElement = scrollRef.current;

    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, [callback, threshold]);

  return scrollRef;
}

// Hook for detecting scroll direction
export function useScrollDirection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const scrollDirection = useRef<"up" | "down" | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const scrollTop = scrollRef.current.scrollTop;

      if (scrollTop > lastScrollTop.current) {
        scrollDirection.current = "down";
      } else if (scrollTop < lastScrollTop.current) {
        scrollDirection.current = "up";
      }

      lastScrollTop.current = scrollTop;
    };

    const scrollElement = scrollRef.current;

    if (!scrollElement) return;

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return {
    scrollRef,
    getScrollDirection: () => scrollDirection.current,
  };
}
