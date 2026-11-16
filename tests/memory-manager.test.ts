import { describe, expect, it } from "vitest";

import { selectTabsToSuspend, type TabLifecycle } from "../lib/browser/memory-manager";
import { PERFORMANCE_MODES } from "../lib/browser/performance-modes";

const NOW = 1_000_000;
const MIN = 60_000;
const tab = (id: string, ageMin: number, extra: Partial<TabLifecycle> = {}): TabLifecycle => ({
  id,
  hasPage: true,
  suspended: false,
  pinned: false,
  busy: false,
  lastActiveAt: NOW - ageMin * MIN,
  ...extra,
});

describe("selectTabsToSuspend", () => {
  const tabs = [tab("a", 0), tab("b", 2), tab("c", 11), tab("d", 40, { pinned: true }), tab("e", 50, { busy: true })];

  it("equilibrado suspende só abas inativas há mais de 10 min", () => {
    expect(selectTabsToSuspend(tabs, "a", PERFORMANCE_MODES.balanced.policy, NOW)).toEqual(["c"]);
  });

  it("economia de memória respeita aba ativa, fixada e ocupada", () => {
    const ids = selectTabsToSuspend(tabs, "c", PERFORMANCE_MODES["memory-saver"].policy, NOW);
    expect(ids).toEqual(expect.arrayContaining(["a", "b"]));
    expect(ids).not.toContain("c");
    expect(ids).not.toContain("d");
    expect(ids).not.toContain("e");
  });

  it('"nunca" sem limite de abas não suspende nada', () => {
    const policy = { ...PERFORMANCE_MODES.balanced.policy, suspendAfter: "never" as const, maxLiveTabs: 99 };
    expect(selectTabsToSuspend(tabs, "a", policy, NOW)).toEqual([]);
  });

  it("ignora abas já suspensas e abas sem página", () => {
    const list = [tab("a", 0), tab("b", 60, { suspended: true }), tab("c", 60, { hasPage: false })];
    expect(selectTabsToSuspend(list, "a", PERFORMANCE_MODES["memory-saver"].policy, NOW)).toEqual([]);
  });
});
