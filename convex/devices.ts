import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ONLINE_THRESHOLD_MS = 60 * 1000;

export const heartbeat = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx: any, { deviceId }: { deviceId: any }) => {
    await ctx.db.patch(deviceId, { lastSeenAt: Date.now() });
  }
});

export const listDevices = query({
  args: {},
  handler: async (ctx: any) => {
    const now = Date.now();
    const devices = await ctx.db.query("devices").collect();

    const enriched = await Promise.all(
      devices.map(async (device: any) => {
        const activeSession = await ctx.db
          .query("sessions")
          .withIndex("by_deviceId_active", (q: any) =>
            q.eq("deviceId", device._id).eq("active", true)
          )
          .order("desc")
          .first();

        const hasActiveSession =
          !!activeSession && activeSession.endsAt > now;

        return {
          ...device,
          isOnline: now - device.lastSeenAt <= ONLINE_THRESHOLD_MS,
          activeSession: hasActiveSession ? activeSession : null
        };
      })
    );

    return enriched.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  }
});
