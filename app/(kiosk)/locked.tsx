import { useEffect, useState } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getDeviceId } from "@/services/deviceService";
import { useDeviceSession } from "@/hooks/useDeviceSession";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { ADMIN_LONG_PRESS_MS } from "@/constants/config";

export default function LockedScreen() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const session = useDeviceSession(deviceId);
  useHeartbeat(deviceId);

  useEffect(() => {
    (async () => {
      const saved = await getDeviceId();
      if (!saved) {
        router.replace("/(kiosk)/pair");
        return;
      }
      setDeviceId(saved);
    })();
  }, [router]);

  useEffect(() => {
    if (session && session.endsAt > Date.now()) {
      router.replace("/(kiosk)/timer");
    }
  }, [router, session]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Device Locked</Text>
      <Text style={styles.body}>Waiting for admin to start your session.</Text>

      <Pressable
        style={styles.hiddenHitbox}
        delayLongPress={ADMIN_LONG_PRESS_MS}
        onLongPress={() => router.push("/(admin)/login")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    padding: 24
  },
  title: {
    color: "white",
    fontSize: 34,
    fontWeight: "700"
  },
  body: {
    color: "#d1d5db",
    marginTop: 10,
    fontSize: 16
  },
  hiddenHitbox: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 80,
    height: 80
  }
});
