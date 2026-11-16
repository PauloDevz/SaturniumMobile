import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import BrowserPage from "@/components/browser-page";
import type {
  BrowserNavigationState,
  BrowserPageHandle,
} from "@/components/browser-page.types";

const C = {
  background: "#101010",
  chrome: "#181818",
  toolbar: "#202020",
  surface: "#252525",
  surfaceRaised: "#1b1c24",
  border: "#30323b",
  text: "#f5f6fa",
  muted: "#a1a5b2",
  faint: "#737987",
  violet: "#7c5cff",
  cyan: "#79d8ff",
  green: "#82e2b0",
};

type BrowserTab = {
  id: string;
  sourceUrl: string | null;
  currentUrl: string | null;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
  loading: boolean;
  progress: number;
};

function createTab(): BrowserTab {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sourceUrl: null,
    currentUrl: null,
    title: "Nova aba",
    canGoBack: false,
    canGoForward: false,
    loading: false,
    progress: 0,
  };
}

function normalizeDestination(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const enteredUrl = new URL(value);
    if (enteredUrl.protocol === "http:" || enteredUrl.protocol === "https:") {
      return enteredUrl.toString();
    }
  } catch {
    // A entrada sem esquema poderá ser um domínio ou uma pesquisa.
  }

  const looksLikeDomain =
    !/\s/.test(value) &&
    /^(localhost|(?:[a-z0-9-]+\.)+[a-z]{2,}|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?(?:[/?#].*)?$/i.test(
      value,
    );

  if (looksLikeDomain) {
    try {
      return new URL(`https://${value}`).toString();
    } catch {
      // Entrada inválida passa a ser pesquisada.
    }
  }

  return `https://www.bing.com/search?q=${encodeURIComponent(value)}`;
}

function siteCaption(url: string | null): string {
  if (!url) return "Página inicial";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function tabCaption(tab: BrowserTab): string {
  if (tab.title && tab.title !== "Nova aba") return tab.title;
  return siteCaption(tab.currentUrl || tab.sourceUrl) || "Nova aba";
}

export default function BrowserScreen() {
  const insets = useSafeAreaInsets();
  const [tabs, setTabs] = useState<BrowserTab[]>(() => [createTab()]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id ?? "");
  const [address, setAddress] = useState("");
  const [addressFocused, setAddressFocused] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const pages = useRef<Record<string, BrowserPageHandle | null>>({});
  const addressInput = useRef<TextInput>(null);

  const activeTab = useMemo(
    () => tabs.find(tab => tab.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId],
  );
  const addressValue = addressFocused ? address : activeTab?.currentUrl ?? "";

  const updateNavigation = useCallback((tabId: string, navigation: BrowserNavigationState) => {
    setTabs(current =>
      current.map(tab =>
        tab.id === tabId
          ? {
              ...tab,
              currentUrl: navigation.url,
              title: navigation.title || siteCaption(navigation.url),
              canGoBack: navigation.canGoBack,
              canGoForward: navigation.canGoForward,
              loading: navigation.loading,
              progress: navigation.loading ? tab.progress : 1,
            }
          : tab,
      ),
    );
  }, []);

  const updateProgress = useCallback((tabId: string, progress: number) => {
    setTabs(current =>
      current.map(tab =>
        tab.id === tabId
          ? { ...tab, progress: Math.min(1, Math.max(0, progress)), loading: progress < 1 }
          : tab,
      ),
    );
  }, []);

  const openNewTab = useCallback(() => {
    const tab = createTab();
    setTabs(current => [...current, tab]);
    setActiveTabId(tab.id);
    setAddress("");
    setAddressFocused(false);
    setShowTabs(false);
  }, []);

  const closeTab = useCallback(
    (tabId: string) => {
      const index = tabs.findIndex(tab => tab.id === tabId);
      const remaining = tabs.filter(tab => tab.id !== tabId);
      const nextTabs = remaining.length > 0 ? remaining : [createTab()];
      setTabs(nextTabs);
      delete pages.current[tabId];
      if (activeTabId === tabId) {
        const nextIndex = Math.max(0, Math.min(index - 1, nextTabs.length - 1));
        setActiveTabId(nextTabs[nextIndex].id);
      }
    },
    [activeTabId, tabs],
  );

  const navigate = useCallback(
    (rawValue: string) => {
      const target = normalizeDestination(rawValue);
      if (!target || !activeTab) return;
      Keyboard.dismiss();
      setAddressFocused(false);
      setAddress(target);
      if (activeTab.currentUrl === target && activeTab.sourceUrl) {
        pages.current[activeTab.id]?.reload();
        return;
      }
      setTabs(current =>
        current.map(tab =>
          tab.id === activeTab.id
            ? {
                ...tab,
                sourceUrl: target,
                currentUrl: target,
                title: siteCaption(target),
                canGoBack: false,
                canGoForward: false,
                loading: true,
                progress: 0.04,
              }
            : tab,
        ),
      );
    },
    [activeTab],
  );

  const goHome = useCallback(() => {
    if (!activeTab) return;
    Keyboard.dismiss();
    setAddressFocused(false);
    setAddress("");
    setTabs(current =>
      current.map(tab =>
        tab.id === activeTab.id
          ? {
              ...tab,
              sourceUrl: null,
              currentUrl: null,
              title: "Nova aba",
              canGoBack: false,
              canGoForward: false,
              loading: false,
              progress: 0,
            }
          : tab,
      ),
    );
  }, [activeTab]);

  const focusAddress = useCallback(() => {
    setAddress(activeTab?.currentUrl ?? "");
    addressInput.current?.focus();
  }, [activeTab?.currentUrl]);

  const submitAddress = useCallback(() => {
    navigate(address);
  }, [address, navigate]);

  useEffect(() => {
    if (Platform.OS === "web" || !activeTab?.canGoBack) return;
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      pages.current[activeTab.id]?.goBack();
      return true;
    });
    return () => listener.remove();
  }, [activeTab?.canGoBack, activeTab?.id]);

  const secure = activeTab?.currentUrl?.startsWith("https://") ?? false;
  const addressIcon = addressFocused || !activeTab?.currentUrl
    ? "search-outline"
    : secure
      ? "lock-closed"
      : "globe-outline";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image source={require("@/assets/images/icon.png")} style={styles.brandIcon} />
            <View>
              <Text style={styles.brandName}>SATURNIUM</Text>
              <Text style={styles.brandCaption}>BROWSER</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir nova aba"
            onPress={openNewTab}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={25} color={C.text} />
          </Pressable>
        </View>

        <View style={[styles.addressBar, addressFocused && styles.addressBarFocused]}>
          <Ionicons
            name={addressIcon}
            size={17}
            color={secure ? C.green : addressFocused ? C.cyan : C.muted}
            style={styles.addressIcon}
          />
          <TextInput
            ref={addressInput}
            value={addressValue}
            onChangeText={setAddress}
            onFocus={() => setAddressFocused(true)}
            onBlur={() => setAddressFocused(false)}
            onSubmitEditing={submitAddress}
            placeholder="Pesquise ou digite um endereço"
            placeholderTextColor={C.faint}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            keyboardType="url"
            returnKeyType="go"
            selectTextOnFocus
            accessibilityLabel="Pesquisar na Web ou digitar um endereço"
            style={styles.addressInput}
          />
          {address.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Limpar endereço"
              onPress={() => {
                setAddress("");
                focusAddress();
              }}
              hitSlop={10}
              style={styles.addressAction}
            >
              <Ionicons name="close-circle" size={18} color={C.faint} />
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Pesquisar"
              onPress={submitAddress}
              hitSlop={10}
              style={styles.addressAction}
            >
              <Ionicons name="arrow-up-circle" size={20} color={C.violet} />
            </Pressable>
          )}
        </View>

        <View style={styles.progressTrack}>
          {activeTab?.loading ? (
            <View style={[styles.progressFill, { width: `${Math.max(8, activeTab.progress * 100)}%` }]} />
          ) : null}
        </View>

        <View style={styles.pageArea}>
          {!activeTab?.sourceUrl ? (
            <ScrollView
              contentContainerStyle={styles.homeContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.orbitWrap}>
                <View style={styles.orbitOuter} />
                <View style={styles.orbitInner} />
                <Image source={require("@/assets/images/icon.png")} style={styles.heroIcon} />
              </View>
              <Text style={styles.homeEyebrow}>SEU NAVEGADOR, SEU ESPAÇO</Text>
              <Text style={styles.homeTitle}>Para onde vamos?</Text>
              <Text style={styles.homeBody}>
                Pesquise na Web ou digite um endereço na barra acima para começar a explorar.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={focusAddress}
                style={({ pressed }) => [styles.homeAction, pressed && styles.pressed]}
              >
                <Ionicons name="search" size={17} color="#ffffff" />
                <Text style={styles.homeActionText}>Pesquisar na Web</Text>
                <Ionicons name="arrow-forward" size={15} color="#ffffff" />
              </Pressable>
              <View style={styles.homeTip}>
                <Ionicons name="layers-outline" size={18} color={C.cyan} />
                <Text style={styles.homeTipText}>
                  Abra novas abas pelo botão + e alterne entre elas no contador abaixo.
                </Text>
              </View>
            </ScrollView>
          ) : null}

          {tabs.map(tab => (
            <BrowserPage
              key={tab.id}
              ref={handle => {
                pages.current[tab.id] = handle;
              }}
              tabId={tab.id}
              sourceUrl={tab.sourceUrl}
              active={tab.id === activeTabId}
              onNavigationStateChange={updateNavigation}
              onLoadProgress={updateProgress}
            />
          ))}
        </View>

        <View style={styles.bottomBar}>
          <ToolButton
            label="Voltar"
            icon="arrow-back"
            disabled={!activeTab?.canGoBack}
            onPress={() => activeTab && pages.current[activeTab.id]?.goBack()}
          />
          <ToolButton
            label="Avançar"
            icon="arrow-forward"
            disabled={!activeTab?.canGoForward}
            onPress={() => activeTab && pages.current[activeTab.id]?.goForward()}
          />
          <ToolButton label="Início" icon="home-outline" onPress={goHome} />
          <ToolButton
            label={activeTab?.loading ? "Carregando" : "Recarregar"}
            icon={activeTab?.loading ? "close" : "reload"}
            onPress={() => {
              if (activeTab?.sourceUrl) pages.current[activeTab.id]?.reload();
              else focusAddress();
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${tabs.length} abas abertas`}
            onPress={() => setShowTabs(true)}
            style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
          >
            <View style={styles.tabCountBox}>
              <Text style={styles.tabCountText}>{tabs.length}</Text>
            </View>
            <Text style={styles.toolLabel}>Abas</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showTabs}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowTabs(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar lista de abas"
            onPress={() => setShowTabs(false)}
            style={styles.modalBackdrop}
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Suas abas</Text>
                <Text style={styles.sheetSubtitle}>
                  {tabs.length} {tabs.length === 1 ? "página aberta" : "páginas abertas"}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar lista de abas"
                onPress={() => setShowTabs(false)}
                style={styles.sheetClose}
              >
                <Ionicons name="close" size={21} color={C.text} />
              </Pressable>
            </View>
            <FlatList
              data={tabs}
              keyExtractor={tab => tab.id}
              contentContainerStyle={styles.tabList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selected = item.id === activeTabId;
                return (
                  <View style={[styles.tabCard, selected && styles.tabCardSelected]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Alternar para ${tabCaption(item)}`}
                      onPress={() => {
                        setActiveTabId(item.id);
                        setShowTabs(false);
                      }}
                      style={styles.tabCardMain}
                    >
                      <View style={[styles.tabFavicon, selected && styles.tabFaviconSelected]}>
                        <Ionicons
                          name={item.sourceUrl ? "globe-outline" : "planet-outline"}
                          size={18}
                          color={selected ? C.cyan : C.muted}
                        />
                      </View>
                      <View style={styles.tabCardText}>
                        <Text numberOfLines={1} style={styles.tabCardTitle}>
                          {tabCaption(item)}
                        </Text>
                        <Text numberOfLines={1} style={styles.tabCardUrl}>
                          {siteCaption(item.currentUrl || item.sourceUrl)}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Fechar aba ${tabCaption(item)}`}
                      onPress={() => closeTab(item.id)}
                      hitSlop={8}
                      style={styles.tabClose}
                    >
                      <Ionicons name="close" size={19} color={C.muted} />
                    </Pressable>
                  </View>
                );
              }}
            />
            <Pressable
              accessibilityRole="button"
              onPress={openNewTab}
              style={({ pressed }) => [styles.newTabAction, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.newTabActionText}>Nova aba</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type ToolButtonProps = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  onPress: () => void;
};

function ToolButton({ label, icon, disabled = false, onPress }: ToolButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.toolButton, disabled && styles.toolDisabled, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={disabled ? "#565b67" : C.text} />
      <Text style={[styles.toolLabel, disabled && styles.toolLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    height: 56,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.chrome,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  brandIcon: {
    width: 33,
    height: 33,
    borderRadius: 10,
  },
  brandName: {
    color: C.text,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  brandCaption: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.4,
    marginTop: 2,
  },
  headerButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  addressBar: {
    height: 46,
    marginHorizontal: 13,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    backgroundColor: C.surface,
  },
  addressBarFocused: {
    borderColor: C.violet,
    backgroundColor: "#211e2b",
  },
  addressIcon: {
    marginRight: 9,
  },
  addressInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    color: C.text,
    fontSize: 13,
  },
  addressAction: {
    width: 30,
    height: 32,
    marginLeft: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  progressTrack: {
    height: 2,
    marginTop: 7,
    marginHorizontal: 14,
    backgroundColor: "transparent",
  },
  progressFill: {
    height: 2,
    borderRadius: 2,
    backgroundColor: C.cyan,
  },
  pageArea: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: C.background,
  },
  homeContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 27,
    paddingTop: 24,
    paddingBottom: 30,
  },
  orbitWrap: {
    width: 154,
    height: 154,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  orbitOuter: {
    position: "absolute",
    width: 148,
    height: 71,
    borderWidth: 1,
    borderColor: "#79d8ff55",
    borderRadius: 99,
    transform: [{ rotate: "-27deg" }],
  },
  orbitInner: {
    position: "absolute",
    width: 125,
    height: 92,
    borderWidth: 1,
    borderColor: "#7c5cff45",
    borderRadius: 99,
    transform: [{ rotate: "34deg" }],
  },
  heroIcon: {
    width: 98,
    height: 98,
    borderRadius: 25,
  },
  homeEyebrow: {
    color: C.cyan,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    textAlign: "center",
  },
  homeTitle: {
    marginTop: 10,
    color: C.text,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  homeBody: {
    maxWidth: 310,
    marginTop: 10,
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  homeAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 24,
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.violet,
  },
  homeActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  homeTip: {
    maxWidth: 315,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 32,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    backgroundColor: C.surfaceRaised,
  },
  homeTipText: {
    flex: 1,
    color: C.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  bottomBar: {
    height: 57,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 5,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    backgroundColor: C.chrome,
  },
  toolButton: {
    minWidth: 55,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 11,
  },
  toolDisabled: {
    opacity: 0.62,
  },
  toolLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: "600",
  },
  toolLabelDisabled: {
    color: "#666b77",
  },
  tabButton: {
    minWidth: 55,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 11,
  },
  tabCountBox: {
    minWidth: 21,
    height: 20,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: C.text,
    borderRadius: 6,
  },
  tabCountText: {
    color: C.text,
    fontSize: 10,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#0009",
  },
  sheet: {
    maxHeight: "82%",
    paddingTop: 10,
    paddingHorizontal: 17,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#343747",
    backgroundColor: "#151720",
  },
  sheetHandle: {
    width: 38,
    height: 4,
    alignSelf: "center",
    marginBottom: 16,
    borderRadius: 99,
    backgroundColor: "#555a68",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: "700",
  },
  sheetSubtitle: {
    marginTop: 3,
    color: C.muted,
    fontSize: 12,
  },
  sheetClose: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: C.surface,
  },
  tabList: {
    gap: 9,
    paddingBottom: 13,
  },
  tabCard: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    backgroundColor: "#1b1e28",
  },
  tabCardSelected: {
    borderColor: "#604eaa",
    backgroundColor: "#242139",
  },
  tabCardMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  tabFavicon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#292d3a",
  },
  tabFaviconSelected: {
    backgroundColor: "#302a4d",
  },
  tabCardText: {
    flex: 1,
    minWidth: 0,
  },
  tabCardTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "600",
  },
  tabCardUrl: {
    marginTop: 4,
    color: C.muted,
    fontSize: 11,
  },
  tabClose: {
    width: 35,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  newTabAction: {
    height: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 5,
    borderRadius: 14,
    backgroundColor: C.violet,
  },
  newTabActionText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
} satisfies Record<string, ViewStyle | TextStyle | ImageStyle>;
