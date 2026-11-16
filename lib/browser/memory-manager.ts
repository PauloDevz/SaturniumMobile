import { suspendAfterMs, type PerformancePolicy } from "./performance-modes";

export type TabLifecycle = {
  id: string;
  /** Tem URL carregada (abas vazias não consomem WebView). */
  hasPage: boolean;
  suspended: boolean;
  pinned: boolean;
  /** Última vez que a aba esteve em primeiro plano (ms epoch). */
  lastActiveAt: number;
  /** Download ou carregamento em andamento: não suspender. */
  busy: boolean;
};

/**
 * Decide quais abas devem ser suspensas. Função pura: não toca em WebViews.
 * Regras: nunca suspende a aba ativa, abas fixadas ocupadas ou carregando;
 * aplica o tempo de inatividade e depois o limite de abas vivas (mais antigas primeiro).
 */
export function selectTabsToSuspend(
  tabs: TabLifecycle[],
  activeId: string,
  policy: PerformancePolicy,
  now: number,
): string[] {
  const candidates = tabs.filter(t => t.hasPage && !t.suspended && t.id !== activeId && !t.busy);
  const result = new Set<string>();

  const limit = suspendAfterMs(policy.suspendAfter);
  if (limit !== null) {
    for (const t of candidates) {
      if (!t.pinned && now - t.lastActiveAt >= limit) result.add(t.id);
    }
  }

  const live = tabs.filter(t => t.hasPage && !t.suspended && !result.has(t.id));
  let excess = live.length - Math.max(1, policy.maxLiveTabs);
  if (excess > 0) {
    const byAge = candidates
      .filter(t => !result.has(t.id) && !t.pinned)
      .sort((a, b) => a.lastActiveAt - b.lastActiveAt);
    for (const t of byAge) {
      if (excess <= 0) break;
      result.add(t.id);
      excess -= 1;
    }
  }
  return [...result];
}
