import type { MouseEvent } from "react";

export function navigateWithTransition(href: string) {
  const doc = document as Document & {
    startViewTransition?: (update: () => void) => void;
  };
  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(() => {
      window.location.href = href;
    });
  } else {
    window.location.href = href;
  }
}

/**
 * Link `onClick` handler that upgrades navigation to a View Transition when
 * supported, otherwise falls back to the browser default. Shared by all
 * internal card/nav links so the transition behavior lives in one place.
 */
export function handleTransitionNav(e: MouseEvent<HTMLAnchorElement>) {
  if (
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function"
  ) {
    e.preventDefault();
    navigateWithTransition(e.currentTarget.href);
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}