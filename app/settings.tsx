import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { metricsAvailable } from "@/modules/saturnium-metrics";
import { useMetrics } from "@/lib/browser/use-metrics";
import {
  PERFORMANCE_MODES,
  resolvePolicy,
  type CacheBehavior,
  type PerformanceModeId,
  type SuspendAfter,
} from "@/lib/browser/performance-modes";
import { updateCustom, updateSettings, useSettings } from "@/lib/browser/settings";
import { useTabStats } from "@/lib/browser/tab-stats";

const C = {
  bg: "#101010",
  card: "#1b1c24",
  border: "#30323b",
  text: "#f5f6fa",
  muted: "#a1a5b2",
  violet: "#7c5cff",
  cyan: "#79d8ff",
  warn: "#ffb86b",
};

const MODE_ORDER: PerformanceModeId[] = [
  "balanced",
  "high-performance",
  "memory-saver",
  "battery-saver",
  "custom",
];
const SUSPEND_OPTIONS: SuspendAfter[] = ["never", 1, 5, 10, 15, 30];
const CACHE_OPTIONS: { id: CacheBehavior; label: string }[] = [
  { id: "default", label: "Padrão" },
  { id: "prefer-cache", label: "Preferir cache" },
  { id: "minimal", label: "Limpar ao suspender" },
];

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(0)} MB`;

export default function SettingsScreen() {
  const settings = useSettings();
  const policy = resolvePolicy(settings.mode, settings.custom);
  const tabs = useTabStats();
  const metrics = useMetrics(policy.metricsIntervalMs, true);
  const snap = metrics?.snapshot;
  const usedPct = snap ? ((snap.deviceTotalBytes - snap.deviceAvailableBytes) / snap.deviceTotalBytes) * 100 : null;
  const peak = metrics ? Math.max(...metrics.history, 1) : 1;

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.title}>Desempenho</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.section}>Monitor</Text>
        <View style={s.card}>
          {!metricsAvailable ? (
            <Text style={s.note}>
              Métricas indisponíveis: o módulo nativo só existe em build Android próprio (não no Expo Go nem na
              prévia Web). Nenhum valor é estimado.
            </Text>
          ) : !snap ? (
            <Text style={s.note}>Lendo métricas…</Text>
          ) : (
            <>
              <Row label="RAM do Saturnium (PSS)" value={snap.appPssBytes != null ? mb(snap.appPssBytes) : "indisponível"} />
              <Row label="RAM disponível no aparelho" value={mb(snap.deviceAvailableBytes)} />
              <Row label="RAM total do aparelho" value={mb(snap.deviceTotalBytes)} />
              <Row label="Memória do aparelho em uso" value={usedPct != null ? `${usedPct.toFixed(0)}%` : "—"} />
              <Row
                label="CPU do processo"
                value={metrics.cpuPercent != null ? `${metrics.cpuPercent.toFixed(1)}% de um núcleo` : "medindo…"}
              />
              <Row label="Processos do app" value={String(snap.processCount)} />
              <Row label="Abas abertas / suspensas" value={`${tabs.open} / ${tabs.suspended}`} />
              <Row label="Pouca memória (sistema)" value={snap.lowMemory ? "sim" : "não"} warn={snap.lowMemory} />
              <Row label="Economia de memória" value={policy.memorySaver ? "ativa" : "desativada"} />
              <View style={s.chart} accessibilityLabel="Histórico de memória do app">
                {metrics.history.map((v, i) => (
                  <View key={i} style={[s.bar, { height: Math.max(3, (v / peak) * 56) }]} />
                ))}
              </View>
              <Text style={s.note}>
                O consumo por aba não é exibido: o WebView do Android não expõe memória individual por página.
              </Text>
            </>
          )}
        </View>

        <Text style={s.section}>Modo de desempenho</Text>
        {MODE_ORDER.map(id => {
          const selected = settings.mode === id;
          const label = id === "custom" ? "Personalizado" : PERFORMANCE_MODES[id].label;
          const desc = id === "custom" ? "Ajuste cada parâmetro individualmente." : PERFORMANCE_MODES[id].description;
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => updateSettings({ mode: id })}
              style={[s.mode, selected && s.modeSelected]}
            >
              <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? C.cyan : C.muted} />
              <View style={{ flex: 1 }}>
                <Text style={s.modeLabel}>{label}</Text>
                <Text style={s.modeDesc}>{desc}</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={s.section}>Regras em vigor</Text>
        <View style={s.card}>
          <Row label="Suspender após" value={policy.suspendAfter === "never" ? "nunca" : `${policy.suspendAfter} min`} />
          <Row label="Máx. de abas vivas" value={String(policy.maxLiveTabs)} />
          <Row label="Cache" value={CACHE_OPTIONS.find(c => c.id === policy.cache)?.label ?? ""} />
        </View>

        {settings.mode === "custom" ? (
          <>
            <Text style={s.section}>Personalizado</Text>
            <View style={s.card}>
              <Text style={s.label}>Suspender aba inativa após</Text>
              <View style={s.chips}>
                {SUSPEND_OPTIONS.map(opt => (
                  <Chip
                    key={String(opt)}
                    label={opt === "never" ? "Nunca" : `${opt} min`}
                    selected={settings.custom.suspendAfter === opt}
                    onPress={() => updateCustom({ suspendAfter: opt })}
                  />
                ))}
              </View>
              <Text style={s.label}>Limite de abas vivas</Text>
              <View style={s.chips}>
                {[1, 2, 3, 5, 8, 12].map(n => (
                  <Chip
                    key={n}
                    label={String(n)}
                    selected={settings.custom.maxLiveTabs === n}
                    onPress={() => updateCustom({ maxLiveTabs: n })}
                  />
                ))}
              </View>
              <Text style={s.label}>Comportamento de cache</Text>
              <View style={s.chips}>
                {CACHE_OPTIONS.map(opt => (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    selected={settings.custom.cache === opt.id}
                    onPress={() => updateCustom({ cache: opt.id })}
                  />
                ))}
              </View>
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modeLabel}>Economia de memória</Text>
                  <Text style={s.modeDesc}>Limpa cache ao suspender e suspende tudo (menos a aba ativa) se o Android avisar pouca memória.</Text>
                </View>
                <Switch value={settings.custom.memorySaver} onValueChange={v => updateCustom({ memorySaver: v })} />
              </View>
            </View>
          </>
        ) : null}

        <Text style={s.note}>
          Pré-carregamento de páginas/links e atividade em segundo plano não são oferecidos: o WebView não permite
          implementá-los de forma real, então não há opção que finja fazê-lo.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, warn && { color: C.warn }]}>{value}</Text>
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.chip, selected && s.chipSelected]}>
      <Text style={[s.chipText, selected && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { height: 56, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
  back: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  title: { color: C.text, fontSize: 20, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  section: { color: C.cyan, fontSize: 11, fontWeight: "800", letterSpacing: 1.8, marginTop: 10, textTransform: "uppercase" },
  card: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowLabel: { color: C.muted, fontSize: 13, flexShrink: 1 },
  rowValue: { color: C.text, fontSize: 13, fontWeight: "600" },
  note: { color: C.muted, fontSize: 11, lineHeight: 16 },
  chart: { height: 60, flexDirection: "row", alignItems: "flex-end", gap: 2, marginTop: 4 },
  bar: { flex: 1, backgroundColor: C.violet, borderRadius: 2 },
  mode: { flexDirection: "row", gap: 12, alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  modeSelected: { borderColor: C.violet },
  modeLabel: { color: C.text, fontSize: 14, fontWeight: "600" },
  modeDesc: { color: C.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  label: { color: C.text, fontSize: 13, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: C.border },
  chipSelected: { backgroundColor: C.violet, borderColor: C.violet },
  chipText: { color: C.muted, fontSize: 12, fontWeight: "600" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});
