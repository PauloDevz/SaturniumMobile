import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { WebView, type WebViewNavigation } from "react-native-webview";

import type {
  BrowserNavigationState,
  BrowserPageHandle,
  BrowserPageProps,
} from "@/components/browser-page.types";

const COLORS = {
  background: "#101010",
  text: "#f4f5fa",
  muted: "#9ca3b7",
  cyan: "#79d8ff",
};

const BrowserPage = forwardRef<BrowserPageHandle, BrowserPageProps>(function BrowserPage(
  { tabId, sourceUrl, active, suspended, cache, onNavigationStateChange, onLoadProgress },
  forwardedRef,
) {
  const webView = useRef<WebView>(null);

  useImperativeHandle(forwardedRef, () => ({
    goBack: () => webView.current?.goBack(),
    goForward: () => webView.current?.goForward(),
    reload: () => webView.current?.reload(),
    releaseMemory: () => webView.current?.clearCache?.(false),
  }));

  const navigationChanged = useCallback(
    (navigation: WebViewNavigation) => {
      const state: BrowserNavigationState = {
        url: navigation.url,
        title: navigation.title || "",
        canGoBack: navigation.canGoBack,
        canGoForward: navigation.canGoForward,
        loading: navigation.loading,
      };
      onNavigationStateChange(tabId, state);
    },
    [onNavigationStateChange, tabId],
  );

  const allowNavigation = useCallback((request: WebViewNavigation) => {
    const requestedUrl = request.url || "";
    if (/^https?:\/\//i.test(requestedUrl)) return true;

    if (/^(mailto|tel):/i.test(requestedUrl)) {
      Linking.openURL(requestedUrl).catch(() => undefined);
    }
    return false;
  }, []);

  if (!sourceUrl || suspended) return null;

  return (
    <View
      pointerEvents={active ? "auto" : "none"}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      style={[styles.container, !active && styles.hidden]}
    >
      <WebView
        ref={webView}
        source={{ uri: sourceUrl }}
        originWhitelist={["http://*", "https://*"]}
        onShouldStartLoadWithRequest={allowNavigation}
        onNavigationStateChange={navigationChanged}
        onLoadProgress={({ nativeEvent }) => onLoadProgress(tabId, nativeEvent.progress)}
        onLoadStart={() => onLoadProgress(tabId, 0.08)}
        onLoadEnd={() => onLoadProgress(tabId, 1)}
        onError={() => onLoadProgress(tabId, 1)}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        cacheMode={cache === "prefer-cache" ? "LOAD_CACHE_ELSE_NETWORK" : "LOAD_DEFAULT"}
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.message}>
            <ActivityIndicator color={COLORS.cyan} size="large" />
            <Text style={styles.messageText}>Abrindo a página…</Text>
          </View>
        )}
        renderError={() => (
          <View style={styles.message}>
            <Text style={styles.errorTitle}>Não foi possível abrir esta página</Text>
            <Text style={styles.messageText}>Confira sua conexão ou tente novamente.</Text>
          </View>
        )}
        style={styles.webView}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hidden: {
    display: "none",
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  message: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 28,
    backgroundColor: COLORS.background,
  },
  messageText: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default BrowserPage;
