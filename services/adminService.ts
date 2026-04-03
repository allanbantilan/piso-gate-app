import { convex } from "@/services/convexClient";
import { api } from "@/convex/_generated/api";

export async function createPairingCode() {
  return convex.mutation(api.pairing.createPairingCode, {});
}

export async function listDevices() {
  return convex.query(api.devices.listDevices, {});
}

export async function startSession(deviceId: string, durationSeconds: number) {
  return convex.mutation(api.sessions.startSession, { deviceId: deviceId as any, durationSeconds });
}

export async function extendSession(sessionId: string, addSeconds: number) {
  return convex.mutation(api.sessions.extendSession, { sessionId: sessionId as any, addSeconds });
}
