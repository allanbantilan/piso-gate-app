import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL?.trim();
export const isConvexConfigured = Boolean(convexUrl);
export const convexConfigErrorMessage =
  "Missing EXPO_PUBLIC_CONVEX_URL. Configure EAS preview environment variables and rebuild the APK.";

if (!convexUrl) {
  console.warn("EXPO_PUBLIC_CONVEX_URL is not set. Convex calls will fail until configured.");
}

export const convex = new ConvexReactClient(
  convexUrl ?? "https://placeholder.convex.cloud"
);
