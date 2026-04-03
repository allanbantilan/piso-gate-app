import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { registerDevice } from "@/services/deviceService";

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
    <View style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f7fafc"
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
  error: {
    color: "#b91c1c",
    marginBottom: 8
  }
});
