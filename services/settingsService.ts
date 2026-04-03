import { convex } from "@/services/convexClient";
import { api } from "@/convex/_generated/api";

export async function getPresets() {
  return convex.query(api.settings.getAdminSettings, {});
}

export async function updatePresets(presets: number[]) {
  return convex.mutation(api.settings.updateQuickPresets, { presets });
}
