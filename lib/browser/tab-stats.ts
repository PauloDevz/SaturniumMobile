import { useSyncExternalStore } from "react";

export type TabStats = { open: number; suspended: number; live: number };

let stats: TabStats = { open: 1, suspended: 0, live: 0 };
const listeners = new Set<() => void>();

export function publishTabStats(next: TabStats) {
  if (next.open === stats.open && next.suspended === stats.suspended && next.live === stats.live) return;
  stats = next;
  listeners.forEach(l => l());
}

export function useTabStats(): TabStats {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => stats,
    () => stats,
  );
}
