import { Platform } from "react-native";

export type MetricsSnapshot = {
  timestampMs: number;
  deviceTotalBytes: number;
  deviceAvailableBytes: number;
  lowMemory: boolean;
  lowMemoryThresholdBytes: number;
  appPssBytes: number | null;
  mainProcessPssBytes: number | null;
  processCount: number;
  processCpuTimeMs: number;
  heapUsedBytes: number;
};

type NativeMetrics = { getSnapshot: () => MetricsSnapshot };

let native: NativeMetrics | null = null;
if (Platform.OS === "android") {
  try {
    // Só existe em build nativo com o módulo compilado (não no Expo Go nem na web).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    native = require("expo-modules-core").requireNativeModule("SaturniumMetrics");
  } catch {
    native = null;
  }
}

export const metricsAvailable = native !== null;

export function readSnapshot(): MetricsSnapshot | null {
  try {
    return native ? native.getSnapshot() : null;
  } catch {
    return null;
  }
}
