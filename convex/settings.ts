import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const PRESETS_KEY = "quick_presets";
const DEFAULT_PRESETS = [3600, 10800, 18000];

function sanitizePresets(presets: number[]) {
  const cleaned = presets
    .map((x) => Math.floor(x))
    .filter((x) => Number.isFinite(x) && x > 0);
  const unique = [...new Set(cleaned)];
  return unique.sort((a, b) => a - b);
}

export const getAdminSettings = query({
  args: {},
  handler: async (ctx: any) => {
    const row = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q: any) => q.eq("key", PRESETS_KEY))
      .first();
    if (!row) return DEFAULT_PRESETS;
    if (!Array.isArray(row.value)) return DEFAULT_PRESETS;
    const sanitized = sanitizePresets(row.value as number[]);
    return sanitized.length ? sanitized : DEFAULT_PRESETS;
  }
});

export const updateQuickPresets = mutation({
  args: { presets: v.array(v.number()) },
  handler: async (ctx: any, { presets }: { presets: number[] }) => {
    const sanitized = sanitizePresets(presets);
    if (!sanitized.length) {
      throw new Error("At least one positive preset is required");
    }

    const row = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q: any) => q.eq("key", PRESETS_KEY))
      .first();
    if (row) {
      await ctx.db.patch(row._id, { value: sanitized });
    } else {
      await ctx.db.insert("adminSettings", { key: PRESETS_KEY, value: sanitized });
    }
    return sanitized;
  }
});
