import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { HEARTBEAT_INTERVAL_MS } from "@/constants/config";

export function useHeartbeat(deviceId?: string | null) {
  const heartbeat = useMutation(api.devices.heartbeat);

  useEffect(() => {
    if (!deviceId) return;

    let mounted = true;
    const ping = async () => {
      if (!mounted) return;
      try {
        await heartbeat({ deviceId: deviceId as any });
      } catch {
        // Ignore temporary network errors; next interval retries.
      }
    };

    void ping();
    const id = setInterval(() => {
      void ping();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [deviceId, heartbeat]);
}
