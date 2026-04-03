import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { api } from "@/convex/_generated/api";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { convexConfigErrorMessage, isConvexConfigured } from "@/services/convexClient";
import { formatTimestamp } from "@/utils/time";

function secondsToLabel(seconds: number) {
  const hours = seconds / 3600;
  if (Number.isInteger(hours)) return `${hours}h`;
  return `${Math.floor(seconds / 60)}m`;
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { loading, isAuthenticated, signOut } = useAdminAuth();

  const devices = useQuery(
    api.devices.listDevices,
    isConvexConfigured ? {} : "skip"
  );
  const presets = useQuery(
    api.settings.getAdminSettings,
    isConvexConfigured ? {} : "skip"
  ) ?? [3600, 10800, 18000];
  const safeDevices = Array.isArray(devices) ? devices : [];
  const safePresets = Array.isArray(presets) ? presets : [3600, 10800, 18000];
  const createCode = useMutation(api.pairing.createPairingCode);
  const startSession = useMutation(api.sessions.startSession);
  const extendSession = useMutation(api.sessions.extendSession);

  const [pairingCode, setPairingCode] = useState<{ code: string; expiresAt: number } | null>(null);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isGeneratingPairCode, setIsGeneratingPairCode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("60");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/(admin)/login");
    }
  }, [loading, isAuthenticated, router]);

  const minutesInSeconds = useMemo(() => {
    const value = Number(customMinutes);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.floor(value * 60);
  }, [customMinutes]);

  const onGeneratePairCode = async () => {
    if (isGeneratingPairCode) return;
    if (!isConvexConfigured) {
      setPairingError(convexConfigErrorMessage);
      return;
    }
    setIsGeneratingPairCode(true);
    try {
      setPairingError(null);
      const result = await createCode({});
      setPairingCode(result);
    } catch (err) {
      setPairingError(err instanceof Error ? err.message : "Failed to generate code");
    } finally {
      setIsGeneratingPairCode(false);
    }
  };

  const onApplyTime = async (args: {
    deviceId: string;
    sessionId?: string;
    seconds: number;
  }) => {
    if (!isConvexConfigured) {
      setActionError(convexConfigErrorMessage);
      return;
    }
    try {
      setActionError(null);
      if (args.sessionId) {
        await extendSession({ sessionId: args.sessionId as any, addSeconds: args.seconds });
      } else {
        await startSession({ deviceId: args.deviceId as any, durationSeconds: args.seconds });
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to apply time");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pair New Device</Text>
        {!isConvexConfigured ? <Text style={styles.error}>{convexConfigErrorMessage}</Text> : null}
        <Pressable
          style={[styles.primaryButton, isGeneratingPairCode && styles.buttonDisabled]}
          onPress={onGeneratePairCode}
          disabled={isGeneratingPairCode}
        >
          <Text style={styles.primaryButtonText}>
            {isGeneratingPairCode ? "Generating..." : "Generate Pairing Code"}
          </Text>
        </Pressable>
        {pairingCode ? (
          <Text style={styles.meta}>
            Code: {pairingCode.code} (expires {formatTimestamp(pairingCode.expiresAt)})
          </Text>
        ) : null}
        {pairingError ? <Text style={styles.error}>{pairingError}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Custom Minutes</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={customMinutes}
          onChangeText={setCustomMinutes}
          placeholder="minutes"
          placeholderTextColor="#64748b"
          selectionColor="#0f766e"
          cursorColor="#0f766e"
          underlineColorAndroid="transparent"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Devices</Text>
        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        {!Array.isArray(devices) ? <Text style={styles.meta}>Loading devices...</Text> : null}
        {safeDevices.map((device: any) => (
          <View style={styles.deviceRow} key={device._id}>
            <Text style={styles.deviceName}>{device.name}</Text>
            <Text style={styles.meta}>
              Last seen: {formatTimestamp(device.lastSeenAt)} | {device.isOnline ? "Online" : "Offline"}
            </Text>
            <Text style={styles.meta}>
              Active session:{" "}
              {device.activeSession
                ? `ends ${formatTimestamp(device.activeSession.endsAt)}`
                : "none"}
            </Text>

            <View style={styles.actions}>
              {safePresets.map((seconds: number) => (
                <Pressable
                  key={`${device._id}-${seconds}`}
                  style={styles.quickButton}
                  onPress={() =>
                    onApplyTime({
                      deviceId: device._id,
                      sessionId: device.activeSession?._id,
                      seconds
                    })
                  }
                >
                  <Text style={styles.quickButtonText}>+{secondsToLabel(seconds)}</Text>
                </Pressable>
              ))}
              <Pressable
                style={styles.quickButton}
                disabled={!minutesInSeconds}
                onPress={() =>
                  minutesInSeconds &&
                  onApplyTime({
                    deviceId: device._id,
                    sessionId: device.activeSession?._id,
                    seconds: minutesInSeconds
                  })
                }
              >
                <Text style={styles.quickButtonText}>+Custom</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footerActions}>
        <Pressable style={styles.linkButton} onPress={() => router.push("/(admin)/settings")}>
          <Text style={styles.linkText}>Settings</Text>
        </Pressable>
        <Pressable
          style={styles.linkButton}
          onPress={async () => {
            await signOut();
            router.replace("/(kiosk)/locked");
          }}
        >
          <Text style={styles.linkText}>Logout</Text>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef2ff"
  },
  container: {
    flex: 1,
    backgroundColor: "#eef2ff"
  },
  content: {
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1e1b4b"
  },
  card: {
    borderRadius: 12,
    backgroundColor: "white",
    padding: 14,
    gap: 10
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827"
  },
  meta: {
    color: "#475569"
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: "#3730a3",
    paddingVertical: 10,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600"
  },
  error: {
    color: "#b91c1c"
  },
  input: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 10,
    backgroundColor: "white",
    color: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  deviceRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 6
  },
  deviceName: {
    fontSize: 17,
    fontWeight: "700"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  quickButton: {
    borderRadius: 8,
    backgroundColor: "#0f766e",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  quickButtonText: {
    color: "white",
    fontWeight: "600"
  },
  footerActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24
  },
  linkButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#1f2937",
    paddingVertical: 10,
    alignItems: "center"
  },
  linkText: {
    color: "white",
    fontWeight: "600"
  }
});
