import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { getDeviceId } from "@/services/deviceService";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const deviceId = await getDeviceId();
      if (!deviceId) {
        router.replace("/(kiosk)/pair");
        return;
      }
      router.replace("/(kiosk)/locked");
    })();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
});
