import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import type {
  BrowserNavigationState,
  BrowserPageHandle,
  BrowserPageProps,
} from "@/components/browser-page.types";

const BrowserPage = forwardRef<BrowserPageHandle, BrowserPageProps>(function BrowserPage(
  { tabId, sourceUrl, active, onNavigationStateChange, onLoadProgress },
  forwardedRef,
) {
  useImperativeHandle(forwardedRef, () => ({
    goBack: () => undefined,
    goForward: () => undefined,
    reload: () => undefined,
    releaseMemory: () => undefined,
  }));

  useEffect(() => {
    if (!sourceUrl) return;
    const navigation: BrowserNavigationState = {
      url: sourceUrl,
      title: sourceUrl,
      canGoBack: false,
      canGoForward: false,
      loading: false,
    };
    onNavigationStateChange(tabId, navigation);
    onLoadProgress(tabId, 1);
  }, [tabId, sourceUrl, onNavigationStateChange, onLoadProgress]);

  if (!sourceUrl || !active) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>◉</Text>
      </View>
      <Text style={styles.title}>Prévia de navegação</Text>
      <Text style={styles.body}>
        As páginas abrem dentro do app no Android. Na prévia Web, você pode abrir este endereço
        no navegador do dispositivo.
      </Text>
      <Text numberOfLines={2} style={styles.url}>
        {sourceUrl}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => Linking.openURL(sourceUrl).catch(() => undefined)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Abrir endereço</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#101010",
  },
  iconCircle: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#393154",
    backgroundColor: "#1b1930",
  },
  icon: {
    color: "#79d8ff",
    fontSize: 30,
  },
  title: {
    color: "#f4f5fa",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 9,
  },
  body: {
    color: "#9ca3b7",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  url: {
    maxWidth: "100%",
    marginTop: 17,
    color: "#79d8ff",
    fontSize: 12,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#7c5cff",
  },
  buttonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});

export default BrowserPage;
