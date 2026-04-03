import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminLoginScreen() {
  const router = useRouter();
  const { signIn } = useAdminAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onLogin = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const ok = await signIn(pin);
      if (!ok) {
        setError("Invalid PIN");
        return;
      }
      router.replace("/(admin)/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={onLogin}>
        <Text style={styles.buttonText}>{submitting ? "Checking..." : "Login"}</Text>
      </Pressable>
      <Pressable onPress={() => router.replace("/(kiosk)/locked")}>
        <Text style={styles.cancel}>Back to Kiosk</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f1f5f9"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16
  },
  input: {
    borderWidth: 1,
    borderColor: "#94a3b8",
    borderRadius: 10,
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  error: {
    marginTop: 8,
    color: "#b91c1c"
  },
  button: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: "#0f766e",
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonText: {
    color: "white",
    fontWeight: "600"
  },
  cancel: {
    marginTop: 14,
    textAlign: "center",
    color: "#334155"
  }
});
