import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  devices: defineTable({
    name: v.string(),
    registeredAt: v.number(),
    lastSeenAt: v.number()
  }).index("by_lastSeenAt", ["lastSeenAt"]),
  sessions: defineTable({
    deviceId: v.id("devices"),
    startedAt: v.number(),
    endsAt: v.number(),
    active: v.boolean()
  })
    .index("by_deviceId", ["deviceId"])
    .index("by_deviceId_active", ["deviceId", "active"]),
  pairingCodes: defineTable({
    code: v.string(),
    expiresAt: v.number()
  }).index("by_code", ["code"]),
  adminSettings: defineTable({
    key: v.string(),
    value: v.any()
  }).index("by_key", ["key"])
});
