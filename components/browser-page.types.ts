import type { CacheBehavior } from "@/lib/browser/performance-modes";

export type BrowserNavigationState = {
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
};

export type BrowserPageHandle = {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  /** Libera caches em memória do WebView antes de a aba ser suspensa. */
  releaseMemory: () => void;
};

export type BrowserPageProps = {
  tabId: string;
  sourceUrl: string | null;
  active: boolean;
  /** Aba suspensa: o WebView é desmontado e só a URL é mantida. */
  suspended: boolean;
  cache: CacheBehavior;
  onNavigationStateChange: (tabId: string, state: BrowserNavigationState) => void;
  onLoadProgress: (tabId: string, progress: number) => void;
};
