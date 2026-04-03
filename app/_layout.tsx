import { Stack } from "expo-router";
import { ConvexProvider } from "convex/react";
import { convex } from "@/services/convexClient";

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <Stack screenOptions={{ headerShown: false }} />
    </ConvexProvider>
  );
}
