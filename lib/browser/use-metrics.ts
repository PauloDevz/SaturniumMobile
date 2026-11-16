import { useEffect, useRef, useState } from "react";

import { readSnapshot, type MetricsSnapshot } from "@/modules/saturnium-metrics";

export type LiveMetrics = {
  snapshot: MetricsSnapshot;
  /** % de um núcleo usado pelo processo entre as duas últimas amostras; null na primeira leitura. */
  cpuPercent: number | null;
  history: number[]; // PSS do app em MB, últimas amostras
};

const MAX_POINTS = 40;

/** Amostra métricas nativas enquanto `enabled` for true. Retorna null se o módulo nativo não existir. */
export function useMetrics(intervalMs: number, enabled: boolean): LiveMetrics | null {
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const last = useRef<MetricsSnapshot | null>(null);
  const history = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const sample = () => {
      const snap = readSnapshot();
      if (!snap) return;
      let cpu: number | null = null;
      if (last.current) {
        const wall = snap.timestampMs - last.current.timestampMs;
        const used = snap.processCpuTimeMs - last.current.processCpuTimeMs;
        if (wall > 0) cpu = Math.max(0, (used / wall) * 100);
      }
      last.current = snap;
      if (snap.appPssBytes != null) {
        history.current = [...history.current, snap.appPssBytes / 1048576].slice(-MAX_POINTS);
      }
      setMetrics({ snapshot: snap, cpuPercent: cpu, history: history.current });
    };
    sample();
    const id = setInterval(sample, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);

  return metrics;
}
