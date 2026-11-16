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
};

export type BrowserPageProps = {
  tabId: string;
  sourceUrl: string | null;
  active: boolean;
  onNavigationStateChange: (tabId: string, state: BrowserNavigationState) => void;
  onLoadProgress: (tabId: string, progress: number) => void;
};
