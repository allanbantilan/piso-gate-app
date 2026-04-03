import * as SecureStore from "expo-secure-store";
import { convex } from "@/services/convexClient";
import { api } from "@/convex/_generated/api";

export const DEVICE_ID_KEY = "device_id";
export const DEVICE_NAME_KEY = "device_name";
export const ADMIN_SESSION_PIN_KEY = "admin_session_pin";

export async function getDeviceId() {
  return SecureStore.getItemAsync(DEVICE_ID_KEY);
}

export async function getDeviceName() {
  return SecureStore.getItemAsync(DEVICE_NAME_KEY);
}

export async function registerDevice(code: string, deviceName: string) {
  const payload = { code: code.trim().toUpperCase(), deviceName: deviceName.trim() };
  const { deviceId } = await convex.mutation(api.pairing.registerDevice, payload);
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  await SecureStore.setItemAsync(DEVICE_NAME_KEY, payload.deviceName);
  return deviceId;
}

export async function clearDevice() {
  await Promise.all([
    SecureStore.deleteItemAsync(DEVICE_ID_KEY),
    SecureStore.deleteItemAsync(DEVICE_NAME_KEY)
  ]);
}
