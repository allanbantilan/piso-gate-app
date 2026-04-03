import { useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerDevice } from "@/services/deviceService";
import { ADMIN_LONG_PRESS_MS } from "@/constants/config";

export default function PairScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await registerDevice(code, deviceName);
      router.replace("/(kiosk)/locked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pairing failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7fafc" />
      <View style={styles.container}>
      <View style={styles.topBar}>
      <Pressable
        style={styles.adminTopButton}
        onPress={() => router.push("/(admin)/login")}
      >
        <Text style={styles.adminTopButtonText}>Admin Login</Text>
      </Pressable>
      </View>

      <View style={styles.centerContent}>
      <Text style={styles.title}>Pair Device</Text>
      <Text style={styles.subtitle}>Enter the code from Admin Dashboard</Text>

      <TextInput
        style={styles.input}
        placeholder="Pairing Code"
        value={code}
        autoCapitalize="characters"
        onChangeText={setCode}
      />
      <TextInput
        style={styles.input}
        placeholder="Device Name"
        value={deviceName}
        onChangeText={setDeviceName}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={styles.button} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "Pairing..." : "Pair Device"}</Text>
      </Pressable>
      </View>

      <Pressable
        style={styles.hiddenHitbox}
        delayLongPress={ADMIN_LONG_PRESS_MS}
        onLongPress={() => router.push("/(admin)/login")}
      />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7fafc"
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: "#f7fafc"
  },
  topBar: {
    alignItems: "flex-end",
    paddingTop: 8
  },
  centerContent: {
    flex: 1,
    justifyContent: "center"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937"
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    color: "#4b5563"
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
    marginBottom: 12
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: "#0f766e",
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonText: {
    color: "white",
    fontWeight: "600"
  },
  adminTopButton: {
    alignSelf: "flex-end",
    marginBottom: 14,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#94a3b8",
    backgroundColor: "rgba(15, 23, 42, 0.04)",
    justifyContent: "center",
    alignItems: "center"
  },
  adminTopButtonText: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 13
  },
  hiddenHitbox: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 80,
    height: 80
  },
  error: {
    color: "#b91c1c",
    marginBottom: 8
  }
});
