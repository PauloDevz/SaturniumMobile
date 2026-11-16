export type PerformanceModeId =
  | "balanced"
  | "high-performance"
  | "memory-saver"
  | "battery-saver"
  | "custom";

export type SuspendAfter = "never" | 1 | 5 | 10 | 15 | 30;
/**
 * default: cache padrão do WebView (LOAD_DEFAULT).
 * prefer-cache: usa cache mesmo expirado quando existir (LOAD_CACHE_ELSE_NETWORK).
 * minimal: cache padrão, mas limpa o cache em memória ao suspender uma aba.
 */
export type CacheBehavior = "default" | "prefer-cache" | "minimal";

export type PerformancePolicy = {
  /** Máximo de abas com WebView viva ao mesmo tempo (a aba ativa sempre conta). */
  maxLiveTabs: number;
  /** Minutos de inatividade até suspender; "never" desativa a suspensão por tempo. */
  suspendAfter: SuspendAfter;
  /** Quando true: limpa o cache em memória ao suspender e, se o Android sinalizar pouca memória, suspende todas as abas exceto a ativa. */
  memorySaver: boolean;
  /** Intervalo de atualização do painel de desempenho, em ms. */
  metricsIntervalMs: number;
  cache: CacheBehavior;
};

export const PERFORMANCE_MODES: Record<
  Exclude<PerformanceModeId, "custom">,
  { label: string; description: string; policy: PerformancePolicy }
> = {
  balanced: {
    label: "Equilibrado",
    description: "Equilíbrio entre velocidade e consumo. Recomendado.",
    policy: {
      maxLiveTabs: 5,
      suspendAfter: 10,
      memorySaver: false,
      metricsIntervalMs: 3000,
      cache: "default",
    },
  },
  "high-performance": {
    label: "Alto desempenho",
    description: "Prioriza velocidade e evita suspensões desnecessárias.",
    policy: {
      maxLiveTabs: 12,
      suspendAfter: 30,
      memorySaver: false,
      metricsIntervalMs: 2000,
      cache: "prefer-cache",
    },
  },
  "memory-saver": {
    label: "Economia de memória",
    description: "Suspende abas inativas rapidamente e mantém poucas páginas vivas.",
    policy: {
      maxLiveTabs: 2,
      suspendAfter: 1,
      memorySaver: true,
      metricsIntervalMs: 5000,
      cache: "minimal",
    },
  },
  "battery-saver": {
    label: "Economia de bateria",
    description: "Reduz atividade em segundo plano e operações periódicas.",
    policy: {
      maxLiveTabs: 3,
      suspendAfter: 5,
      memorySaver: true,
      metricsIntervalMs: 10000,
      cache: "prefer-cache",
    },
  },
};

export const DEFAULT_CUSTOM_POLICY: PerformancePolicy = PERFORMANCE_MODES.balanced.policy;

export function resolvePolicy(
  mode: PerformanceModeId,
  custom: PerformancePolicy,
): PerformancePolicy {
  return mode === "custom" ? custom : PERFORMANCE_MODES[mode].policy;
}

export function suspendAfterMs(value: SuspendAfter): number | null {
  return value === "never" ? null : value * 60_000;
}
