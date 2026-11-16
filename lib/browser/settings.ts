import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

import {
  DEFAULT_CUSTOM_POLICY,
  resolvePolicy,
  type PerformanceModeId,
  type PerformancePolicy,
} from "./performance-modes";

export type BrowserSettings = {
  mode: PerformanceModeId;
  custom: PerformancePolicy;
};

const KEY = "saturnium.settings.v1";
const DEFAULTS: BrowserSettings = { mode: "balanced", custom: DEFAULT_CUSTOM_POLICY };

let state: BrowserSettings = DEFAULTS;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

AsyncStorage.getItem(KEY)
  .then(raw => {
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<BrowserSettings>;
    state = {
      mode: parsed.mode ?? DEFAULTS.mode,
      custom: { ...DEFAULTS.custom, ...(parsed.custom ?? {}) },
    };
    emit();
  })
  .catch(() => undefined);

export function updateSettings(patch: Partial<BrowserSettings>) {
  state = { ...state, ...patch };
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => undefined);
}

export function updateCustom(patch: Partial<PerformancePolicy>) {
  updateSettings({ custom: { ...state.custom, ...patch } });
}

export function useSettings(): BrowserSettings {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export function useEffectivePolicy(): PerformancePolicy {
  const s = useSettings();
  return resolvePolicy(s.mode, s.custom);
}
