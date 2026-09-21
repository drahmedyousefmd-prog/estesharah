"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { MODE_KEY } from "./site";

export type SiteMode = "doctor" | "patient";

/**
 * Tiny external store backing the persisted mode choice. Uses
 * `useSyncExternalStore` so the value reads synchronously on the client
 * (no hydration mismatch — the server snapshot is `null`, and React
 * re-renders with the real value right after hydration).
 */
let current: SiteMode | null = null;
const listeners = new Set<() => void>();

function readStored(): SiteMode | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(MODE_KEY);
    return v === "doctor" || v === "patient" ? v : null;
  } catch {
    return null;
  }
}

current = readStored();

const baseListeners = () => listeners;

interface ModeValue {
  /** `null` until the stored choice is read (first visit has no choice yet). */
  mode: SiteMode | null;
  setMode: (mode: SiteMode) => void;
}

const ModeContext = createContext<ModeValue>({
  mode: null,
  setMode: () => {},
});

/** Persists the Doctor/Patient mode and exposes it via `useMode()`. */
export function ModeProvider({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(
    (cb) => {
      baseListeners().add(cb);
      return () => baseListeners().delete(cb);
    },
    () => current,
    () => null
  );

  // Mirror the choice on <html data-mode="…"> so CSS can swap the patient
  // accent (`--accent`) on interactive elements only.
  useEffect(() => {
    document.documentElement.dataset.mode = mode ?? "patient";
  }, [mode]);

  const setMode = (next: SiteMode) => {
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      /* ignore storage failures */
    }
    current = next;
    baseListeners().forEach((l) => l());
  };

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeValue {
  return useContext(ModeContext);
}