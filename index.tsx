import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import colors from "@/constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type SpatialPreset = "off" | "music" | "movie" | "gaming";

const PRESETS: { id: SpatialPreset; label: string; icon: string; desc: string }[] = [
  { id: "off", label: "Off", icon: "volume-mute-outline", desc: "Standard stereo" },
  { id: "music", label: "Music", icon: "musical-notes-outline", desc: "Concert hall" },
  { id: "movie", label: "Movie", icon: "film-outline", desc: "Cinematic surround" },
  { id: "gaming", label: "Gaming", icon: "game-controller-outline", desc: "360° positioning" },
];

const STORAGE_KEYS = {
  HIFI: "@klarity3_hifi",
  SPATIAL: "@klarity3_spatial",
  BATTERY_L: "@klarity3_bat_l",
  BATTERY_R: "@klarity3_bat_r",
};

function useColors() {
  const scheme = useColorScheme();
  return scheme === "dark" ? colors.dark : colors.light;
}

function EarphoneVisual({ hifi, scheme }: { hifi: boolean; scheme: "light" | "dark" }) {
  const c = scheme === "dark" ? colors.dark : colors.light;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hifi) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.stopAnimation();
      pulseAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [hifi]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["-3deg", "3deg"] });

  return (
    <View style={styles.earphoneContainer}>
      {/* Glow rings */}
      {hifi && (
        <>
          <Animated.View
            style={[
              styles.glowRing,
              styles.glowRing1,
              { borderColor: c.primary, opacity: glowAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRing,
              styles.glowRing2,
              { borderColor: c.accent, opacity: Animated.multiply(glowAnim, 0.6) as any },
            ]}
          />
        </>
      )}
      <Animated.View style={[styles.earphoneVisual, { transform: [{ rotate }, { scale: pulseAnim }] }]}>
        {/* Left bud */}
        <View style={[styles.bud, styles.budLeft, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.budInner, { backgroundColor: hifi ? c.primary : c.muted }]}>
            <MaterialCommunityIcons
              name="headphones"
              size={18}
              color={hifi ? c.primaryForeground : c.mutedForeground}
            />
          </View>
          <View style={[styles.budStem, styles.budStemLeft, { backgroundColor: c.card, borderColor: c.border }]} />
        </View>

        {/* Center BOULT logo area */}
        <View style={styles.centerBadge}>
          <View style={[styles.brandCircle, { backgroundColor: hifi ? c.primary : c.muted }]}>
            <Text style={[styles.brandText, { color: hifi ? c.primaryForeground : c.mutedForeground }]}>B</Text>
          </View>
        </View>

        {/* Right bud */}
        <View style={[styles.bud, styles.budRight, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={[styles.budInner, { backgroundColor: hifi ? c.primary : c.muted }]}>
            <MaterialCommunityIcons
              name="headphones"
              size={18}
              color={hifi ? c.primaryForeground : c.mutedForeground}
            />
          </View>
          <View style={[styles.budStem, styles.budStemRight, { backgroundColor: c.card, borderColor: c.border }]} />
        </View>
      </Animated.View>

      {hifi && (
        <Animated.View style={{ opacity: glowAnim }}>
          <Text style={[styles.hifiLabel, { color: c.primary }]}>HiFi ACTIVE</Text>
        </Animated.View>
      )}
    </View>
  );
}

function BatteryBar({ level, side, c }: { level: number; side: "L" | "R"; c: typeof colors.dark }) {
  const color = level > 50 ? c.primary : level > 20 ? "#FFB300" : "#FF4444";
  return (
    <View style={styles.batteryRow}>
      <Text style={[styles.batteryLabel, { color: c.mutedForeground }]}>{side}</Text>
      <View style={[styles.batteryTrack, { backgroundColor: c.muted }]}>
        <View style={[styles.batteryFill, { width: `${level}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.batteryPercent, { color: c.foreground }]}>{level}%</Text>
    </View>
  );
}

function HiFiToggle({ enabled, onToggle, c }: { enabled: boolean; onToggle: () => void; c: typeof colors.dark }) {
  const slideAnim = useRef(new Animated.Value(enabled ? 1 : 0)).current;
  const barAnim = useRef(new Animated.Value(enabled ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: enabled ? 1 : 0, useNativeDriver: false, tension: 80, friction: 10 }).start();
    Animated.timing(barAnim, { toValue: enabled ? 1 : 0, duration: 300, useNativeDriver: false }).start();
  }, [enabled]);

  const thumbLeft = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [3, 33] });
  const trackColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.muted, c.primary] as any,
  });

  const waveHeights = [8, 14, 20, 24, 20, 14, 8];

  return (
    <Pressable onPress={onToggle} style={styles.hifiSection}>
      <View style={styles.hifiHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>HiFi Mode</Text>
          <Text style={[styles.sectionSubtitle, { color: c.mutedForeground }]}>
            {enabled ? "High-fidelity audio — LDAC 990kbps" : "Standard audio quality"}
          </Text>
        </View>
        {/* Toggle switch */}
        <Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>
          <Animated.View style={[styles.toggleThumb, { left: thumbLeft, backgroundColor: c.primaryForeground }]} />
        </Animated.View>
      </View>

      {/* Waveform bars */}
      <View style={styles.waveformRow}>
        {waveHeights.map((h, i) => (
          <Animated.View
            key={i}
            style={[
              styles.waveBar,
              {
                height: barAnim.interpolate({ inputRange: [0, 1], outputRange: [4, h] }) as any,
                backgroundColor: enabled ? c.primary : c.muted,
                opacity: barAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) as any,
              },
            ]}
          />
        ))}
        {waveHeights.map((h, i) => (
          <Animated.View
            key={`r-${i}`}
            style={[
              styles.waveBar,
              {
                height: barAnim.interpolate({ inputRange: [0, 1], outputRange: [4, waveHeights[6 - i]] }) as any,
                backgroundColor: enabled ? c.accent : c.muted,
                opacity: barAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) as any,
              },
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

function SpatialCard({
  preset,
  active,
  onPress,
  c,
}: {
  preset: typeof PRESETS[0];
  active: boolean;
  onPress: () => void;
  c: typeof colors.dark;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <Pressable
        onPress={handlePress}
        style={[
          styles.presetCard,
          {
            backgroundColor: active ? c.primary : c.card,
            borderColor: active ? c.primary : c.border,
          },
        ]}
      >
        <Ionicons
          name={preset.icon as any}
          size={26}
          color={active ? c.primaryForeground : c.mutedForeground}
        />
        <Text style={[styles.presetLabel, { color: active ? c.primaryForeground : c.foreground }]}>
          {preset.label}
        </Text>
        <Text style={[styles.presetDesc, { color: active ? (c.primaryForeground + "CC") : c.mutedForeground }]}>
          {preset.desc}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? "dark";
  const c = scheme === "dark" ? colors.dark : colors.light;

  const [hifi, setHifi] = useState(false);
  const [spatial, setSpatial] = useState<SpatialPreset>("music");
  const [batteryL, setBatteryL] = useState(78);
  const [batteryR, setBatteryR] = useState(82);
  const [connected, setConnected] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [h, s] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.HIFI),
          AsyncStorage.getItem(STORAGE_KEYS.SPATIAL),
        ]);
        if (h !== null) setHifi(h === "true");
        if (s !== null) setSpatial(s as SpatialPreset);
      } catch {}
      setLoaded(true);
    }
    load();
  }, []);

  const toggleHifi = useCallback(async () => {
    const next = !hifi;
    setHifi(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await AsyncStorage.setItem(STORAGE_KEYS.HIFI, String(next));
  }, [hifi]);

  const selectSpatial = useCallback(async (id: SpatialPreset) => {
    setSpatial(id);
    Haptics.selectionAsync();
    await AsyncStorage.setItem(STORAGE_KEYS.SPATIAL, id);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.deviceName, { color: c.foreground }]}>Klarity 3</Text>
            <View style={styles.statusRow}>
              <View style={[styles.connDot, { backgroundColor: connected ? "#22C55E" : c.destructive }]} />
              <Text style={[styles.connText, { color: c.mutedForeground }]}>
                {connected ? "Connected" : "Disconnected"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => { setConnected(v => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.iconBtn, { backgroundColor: c.muted }]}
          >
            <Ionicons name="bluetooth" size={20} color={connected ? c.primary : c.mutedForeground} />
          </Pressable>
        </View>

        {/* Earphone visual */}
        <EarphoneVisual hifi={hifi} scheme={scheme} />

        {/* Battery */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.mutedForeground }]}>BATTERY</Text>
          <BatteryBar level={batteryL} side="L" c={c} />
          <BatteryBar level={batteryR} side="R" c={c} />
        </View>

        {/* HiFi Mode */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.mutedForeground }]}>AUDIO MODE</Text>
          <HiFiToggle enabled={hifi} onToggle={toggleHifi} c={c} />
        </View>

        {/* Spatial Audio */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.mutedForeground }]}>SPATIAL AUDIO</Text>
          <View style={styles.presetsGrid}>
            {PRESETS.map(preset => (
              <SpatialCard
                key={preset.id}
                preset={preset}
                active={spatial === preset.id}
                onPress={() => selectSpatial(preset.id)}
                c={c}
              />
            ))}
          </View>
        </View>

        {/* Touch controls hint */}
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.cardTitle, { color: c.mutedForeground }]}>TOUCH CONTROLS</Text>
          <View style={styles.controlRow}>
            <Ionicons name="hand-left-outline" size={16} color={c.mutedForeground} />
            <Text style={[styles.controlText, { color: c.mutedForeground }]}>
              Double tap — Play/Pause
            </Text>
          </View>
          <View style={styles.controlRow}>
            <Ionicons name="hand-left-outline" size={16} color={c.mutedForeground} />
            <Text style={[styles.controlText, { color: c.mutedForeground }]}>
              Triple tap — Next track
            </Text>
          </View>
          <View style={styles.controlRow}>
            <Ionicons name="hand-left-outline" size={16} color={c.mutedForeground} />
            <Text style={[styles.controlText, { color: c.mutedForeground }]}>
              Long press — Toggle HiFi
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  deviceName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  connDot: { width: 7, height: 7, borderRadius: 4 },
  connText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  // Earphone visual
  earphoneContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    marginVertical: 8,
  },
  glowRing: {
    position: "absolute",
    borderWidth: 1.5,
    borderRadius: 1000,
  },
  glowRing1: { width: 180, height: 180 },
  glowRing2: { width: 220, height: 220 },
  earphoneVisual: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  bud: {
    width: 64,
    height: 80,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  budLeft: { transform: [{ rotate: "-8deg" }] },
  budRight: { transform: [{ rotate: "8deg" }] },
  budInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  budStem: {
    position: "absolute",
    bottom: -18,
    width: 12,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  budStemLeft: { transform: [{ rotate: "-8deg" }] },
  budStemRight: { transform: [{ rotate: "8deg" }] },
  centerBadge: { alignItems: "center", justifyContent: "center" },
  brandCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontSize: 18, fontFamily: "Inter_700Bold" },
  hifiLabel: {
    marginTop: 12,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },

  // Battery
  batteryRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  batteryLabel: { width: 16, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  batteryTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  batteryFill: { height: 6, borderRadius: 3 },
  batteryPercent: { width: 36, fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "right" },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },

  // HiFi section
  hifiSection: { gap: 12 },
  hifiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  sectionSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  toggleTrack: {
    width: 62,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
  },
  toggleThumb: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  waveformRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    height: 28,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },

  // Presets
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  presetCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    alignItems: "center",
    gap: 6,
    minWidth: (SCREEN_WIDTH - 80) / 2,
  },
  presetLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  presetDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  // Touch controls
  controlRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  controlText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
});
