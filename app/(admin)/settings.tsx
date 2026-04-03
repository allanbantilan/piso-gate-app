import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { convexConfigErrorMessage, isConvexConfigured } from "@/services/convexClient";
import { getPresets, updatePresets } from "@/services/settingsService";

function parseMinutesInput(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { loading, isAuthenticated, updatePin } = useAdminAuth();
  const [presetsMinutes, setPresetsMinutes] = useState<string[]>([]);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const presets = await getPresets();
        setPresetsMinutes((presets as number[]).map((seconds: number) => String(Math.floor(seconds / 60))));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load presets");
      }
    })();
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/(admin)/login");
    }
  }, [loading, isAuthenticated, router]);

  const setPresetAt = (index: number, value: string) => {
    setPresetsMinutes((current) => current.map((entry, i) => (i === index ? value : entry)));
  };

  const addPreset = () => {
    setPresetsMinutes((current) => [...current, "60"]);
  };

  const removePreset = (index: number) => {
    setPresetsMinutes((current) => current.filter((_, i) => i !== index));
  };

  const onSave = async () => {
    if (isSaving) return;
    if (!isConvexConfigured) {
      setError(convexConfigErrorMessage);
      return;
    }
    setIsSaving(true);
    setError(null);
    setStatus(null);
    const parsed = presetsMinutes.map(parseMinutesInput);
    if (parsed.some((x) => x === null)) {
      setError("Each preset must be a positive number of minutes");
      setIsSaving(false);
      return;
    }

    try {
      const seconds = (parsed as number[]).map((minutes) => minutes * 60);
      await updatePresets(seconds);

      if (pin.trim()) {
        await updatePin(pin.trim());
        setPin("");
      }

      setStatus("Settings saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Presets (Minutes)</Text>
        {presetsMinutes.map((value, index) => (
          <View style={styles.row} key={`preset-${index}`}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={value}
              onChangeText={(text) => setPresetAt(index, text)}
              placeholderTextColor="#64748b"
              selectionColor="#0f766e"
              cursorColor="#0f766e"
              underlineColorAndroid="transparent"
            />
            <Pressable style={styles.removeButton} onPress={() => removePreset(index)}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        ))}
        <Pressable
          style={[styles.secondaryButton, isSaving && styles.buttonDisabled]}
          onPress={addPreset}
          disabled={isSaving}
        >
          <Text style={styles.secondaryButtonText}>Add Preset</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Admin PIN</Text>
        <TextInput
          style={styles.input}
          placeholder="Leave blank to keep current PIN"
          placeholderTextColor="#64748b"
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="number-pad"
          selectionColor="#0f766e"
          cursorColor="#0f766e"
          underlineColorAndroid="transparent"
        />
      </View>

      {!isConvexConfigured ? <Text style={styles.error}>{convexConfigErrorMessage}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Pressable
        style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
        onPress={onSave}
        disabled={isSaving}
      >
        <Text style={styles.primaryButtonText}>{isSaving ? "Saving..." : "Save Settings"}</Text>
      </Pressable>
        <Pressable
          style={[styles.backButton, isSaving && styles.buttonDisabled]}
          onPress={() => router.replace("/(admin)/dashboard")}
          disabled={isSaving}
        >
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  content: {
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0f172a"
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 10,
    backgroundColor: "white",
    color: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  removeButton: {
    borderRadius: 8,
    backgroundColor: "#dc2626",
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  removeButtonText: {
    color: "white",
    fontWeight: "600"
  },
  secondaryButton: {
    borderRadius: 10,
    backgroundColor: "#334155",
    paddingVertical: 10,
    alignItems: "center"
  },
  secondaryButtonText: {
    color: "white",
    fontWeight: "600"
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: "#0f766e",
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.6
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "600"
  },
  backButton: {
    borderRadius: 10,
    backgroundColor: "#1f2937",
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 24
  },
  backButtonText: {
    color: "white",
    fontWeight: "600"
  },
  error: {
    color: "#b91c1c"
  },
  status: {
    color: "#166534"
  }
});
