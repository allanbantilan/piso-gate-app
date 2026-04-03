import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getActiveSession = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx: any, { deviceId }: { deviceId: any }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_deviceId_active", (q: any) =>
        q.eq("deviceId", deviceId).eq("active", true)
      )
      .order("desc")
      .first();

    if (!session) return null;
    if (session.endsAt <= Date.now()) return null;
    return session;
  }
});

export const startSession = mutation({
  args: { deviceId: v.id("devices"), durationSeconds: v.number() },
  handler: async (
    ctx: any,
    { deviceId, durationSeconds }: { deviceId: any; durationSeconds: number }
  ) => {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error("durationSeconds must be greater than 0");
    }

    const now = Date.now();
    const device = await ctx.db.get(deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    const currentActive = await ctx.db
      .query("sessions")
      .withIndex("by_deviceId_active", (q: any) =>
        q.eq("deviceId", deviceId).eq("active", true)
      )
      .collect();

    await Promise.all(
      currentActive.map((session: any) => ctx.db.patch(session._id, { active: false }))
    );

    const endsAt = now + Math.floor(durationSeconds) * 1000;
    const sessionId = await ctx.db.insert("sessions", {
      deviceId,
      startedAt: now,
      endsAt,
      active: true
    });

    return { sessionId, endsAt };
  }
});

export const extendSession = mutation({
  args: { sessionId: v.id("sessions"), addSeconds: v.number() },
  handler: async (
    ctx: any,
    { sessionId, addSeconds }: { sessionId: any; addSeconds: number }
  ) => {
    if (!Number.isFinite(addSeconds) || addSeconds <= 0) {
      throw new Error("addSeconds must be greater than 0");
    }
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (!session.active) throw new Error("Session not active");

    const baseline = Math.max(Date.now(), session.endsAt);
    const nextEndsAt = baseline + Math.floor(addSeconds) * 1000;
    await ctx.db.patch(sessionId, { endsAt: nextEndsAt });
    return { sessionId, endsAt: nextEndsAt };
  }
});
