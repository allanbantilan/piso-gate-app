import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useDeviceSession(deviceId?: string | null) {
  const session = useQuery(
    api.sessions.getActiveSession,
    deviceId ? { deviceId: deviceId as any } : "skip"
  );
  return session;
}
