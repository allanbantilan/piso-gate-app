import { useEffect, useMemo, useState } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDeviceId } from "@/services/deviceService";
import { useDeviceSession } from "@/hooks/useDeviceSession";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { formatSecondsToClock } from "@/utils/time";
import { ADMIN_LONG_PRESS_MS, TEN_MINUTES_SECONDS } from "@/constants/config";

export default function TimerScreen() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const session = useDeviceSession(deviceId);
  useHeartbeat(deviceId);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

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

  const remainingSeconds = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, Math.floor((session.endsAt - now) / 1000));
  }, [session, now]);

  useEffect(() => {
    if (!session || remainingSeconds <= 0) {
      router.replace("/(kiosk)/locked");
    }
  }, [router, remainingSeconds, session]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, []);

  const showWarning =
    remainingSeconds > 0 && remainingSeconds <= TEN_MINUTES_SECONDS;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {showWarning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>Only 10 minutes left. Time is almost up.</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Time Remaining</Text>
        <Text style={styles.timer}>{formatSecondsToClock(remainingSeconds)}</Text>

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
    backgroundColor: "#0f172a"
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    padding: 24
  },
  label: {
    color: "#cbd5e1",
    fontSize: 18
  },
  timer: {
    marginTop: 8,
    color: "#f8fafc",
    fontSize: 64,
    fontWeight: "700"
  },
  warningBanner: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    borderRadius: 10,
    backgroundColor: "#7c2d12",
    padding: 12
  },
  warningText: {
    color: "#ffedd5",
    textAlign: "center",
    fontWeight: "600"
  },
  hiddenHitbox: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 80,
    height: 80
  }
});
