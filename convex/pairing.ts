import { mutation } from "./_generated/server";
import { v } from "convex/values";

const CODE_TTL_MS = 5 * 60 * 1000;
const CODE_LENGTH = 6;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode() {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

async function generateUniqueCode(ctx: any) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = makeCode();
    const existing = await ctx.db
      .query("pairingCodes")
      .withIndex("by_code", (q: any) => q.eq("code", code))
      .first();
    if (!existing) return code;
  }
  throw new Error("Unable to generate a unique pairing code");
}

export const createPairingCode = mutation({
  args: {},
  handler: async (ctx: any) => {
    const code = await generateUniqueCode(ctx);
    const expiresAt = Date.now() + CODE_TTL_MS;
    await ctx.db.insert("pairingCodes", { code, expiresAt });
    return { code, expiresAt };
  }
});

export const registerDevice = mutation({
  args: { code: v.string(), deviceName: v.string() },
  handler: async (ctx: any, { code, deviceName }: { code: string; deviceName: string }) => {
    const normalizedCode = code.trim().toUpperCase();
    const safeName = deviceName.trim();
    if (!safeName) {
      throw new Error("Device name is required");
    }

    const row = await ctx.db
      .query("pairingCodes")
      .withIndex("by_code", (q: any) => q.eq("code", normalizedCode))
      .first();

    if (!row || row.expiresAt < Date.now()) {
      throw new Error("Invalid or expired pairing code");
    }

    await ctx.db.delete(row._id);
    const now = Date.now();
    const deviceId = await ctx.db.insert("devices", {
      name: safeName,
      registeredAt: now,
      lastSeenAt: now
    });
    return { deviceId };
  }
});
