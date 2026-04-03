# Piso Gate

## Admin-Controlled Multi-Device Timer (Convex) Implementation Plan

Goal: Let admins directly start/extend time on connected client devices with a Convex backend; clients show a 10-minute warning and can finish a session offline.

Architecture: Convex stores devices, pairing codes, sessions, and admin settings. Admin screens create pairing codes and start/extend sessions for a selected device. Client registers once via pairing, subscribes to its active session, and renders a local countdown based on `endsAt`.

Tech Stack: Expo Router (React Native), Convex backend, `expo-secure-store`, existing native kiosk module.

## Summary

- Add Convex backend with device + session + settings collections and pairing code flow.
- Replace voucher flow with admin-direct session control and device list.
- Add client session subscription + local countdown + 10-minute banner.
- Add editable quick-time presets in admin settings (stored in Convex).

## Public Interfaces / API Changes

- New Convex mutations/queries:
  - `createPairingCode()` -> returns `{ code, expiresAt }`
  - `registerDevice({ code, deviceName })` -> returns `{ deviceId }`
  - `heartbeat({ deviceId })` -> updates `lastSeenAt`
  - `listDevices()` -> admin device list with status
  - `startSession({ deviceId, durationSeconds })`
  - `extendSession({ sessionId, addSeconds })`
  - `getActiveSession({ deviceId })`
  - `getAdminSettings()` and `updateQuickPresets({ presets })`
- New client storage keys:
  - `DEVICE_ID_KEY`, `DEVICE_NAME_KEY`, `ADMIN_SESSION_PIN_KEY` (if needed for admin auth gate)
- Voucher DB flow deprecated in UI (SQLite remains unused for sessions).

## Task 1: Add Convex Backend Structure

Files: Create `convex/schema.ts`, `convex/devices.ts`, `convex/sessions.ts`, `convex/pairing.ts`, `convex/settings.ts`.

- [ ] Step 1: Write schema

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  devices: defineTable({
    name: v.string(),
    registeredAt: v.number(),
    lastSeenAt: v.number(),
  }).index("by_lastSeenAt", ["lastSeenAt"]),
  sessions: defineTable({
    deviceId: v.id("devices"),
    startedAt: v.number(),
    endsAt: v.number(),
    active: v.boolean(),
  }).index("by_deviceId", ["deviceId"]),
  pairingCodes: defineTable({
    code: v.string(),
    expiresAt: v.number(),
  }).index("by_code", ["code"]),
  adminSettings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
```

- [ ] Step 2: Pairing code flow

```ts
// convex/pairing.ts
import { v } from "convex/values";
import { mutation } from "./_generated/server";

const CODE_TTL_MS = 5 * 60 * 1000;

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export const createPairingCode = mutation({
  args: {},
  handler: async (ctx) => {
    const code = makeCode();
    const expiresAt = Date.now() + CODE_TTL_MS;
    await ctx.db.insert("pairingCodes", { code, expiresAt });
    return { code, expiresAt };
  },
});

export const registerDevice = mutation({
  args: { code: v.string(), deviceName: v.string() },
  handler: async (ctx, { code, deviceName }) => {
    const row = await ctx.db
      .query("pairingCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!row || row.expiresAt < Date.now()) {
      throw new Error("Invalid or expired pairing code");
    }
    await ctx.db.delete(row._id);
    const deviceId = await ctx.db.insert("devices", {
      name: deviceName,
      registeredAt: Date.now(),
      lastSeenAt: Date.now(),
    });
    return { deviceId };
  },
});
```

- [ ] Step 3: Device list + heartbeat

```ts
// convex/devices.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const heartbeat = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, { deviceId }) => {
    await ctx.db.patch(deviceId, { lastSeenAt: Date.now() });
  },
});

export const listDevices = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("devices").collect();
  },
});
```

- [ ] Step 4: Sessions

```ts
// convex/sessions.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getActiveSession = query({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, { deviceId }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", deviceId))
      .filter((q) => q.eq(q.field("active"), true))
      .first();
    if (!session) return null;
    if (session.endsAt <= Date.now()) {
      return null;
    }
    return session;
  },
});

export const startSession = mutation({
  args: { deviceId: v.id("devices"), durationSeconds: v.number() },
  handler: async (ctx, { deviceId, durationSeconds }) => {
    const now = Date.now();
    const endsAt = now + durationSeconds * 1000;
    return ctx.db.insert("sessions", {
      deviceId,
      startedAt: now,
      endsAt,
      active: true,
    });
  },
});

export const extendSession = mutation({
  args: { sessionId: v.id("sessions"), addSeconds: v.number() },
  handler: async (ctx, { sessionId, addSeconds }) => {
    const session = await ctx.db.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (!session.active) throw new Error("Session not active");
    await ctx.db.patch(sessionId, { endsAt: session.endsAt + addSeconds * 1000 });
  },
});
```

- [ ] Step 5: Admin settings for presets

```ts
// convex/settings.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const PRESETS_KEY = "quick_presets";

export const getAdminSettings = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", PRESETS_KEY))
      .first();
    return row?.value ?? [3600, 10800, 18000];
  },
});

export const updateQuickPresets = mutation({
  args: { presets: v.array(v.number()) },
  handler: async (ctx, { presets }) => {
    const row = await ctx.db
      .query("adminSettings")
      .withIndex("by_key", (q) => q.eq("key", PRESETS_KEY))
      .first();
    if (row) {
      await ctx.db.patch(row._id, { value: presets });
    } else {
      await ctx.db.insert("adminSettings", { key: PRESETS_KEY, value: presets });
    }
  },
});
```

## Task 2: Add Convex Client to Expo App

Files: Modify `app/_layout.tsx`, create `services/convexClient.ts`.

- [ ] Step 1: Convex client

```ts
// services/convexClient.ts
import { ConvexReactClient } from "convex/react";

export const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);
```

- [ ] Step 2: Provider

```tsx
// app/_layout.tsx
import { ConvexProvider } from "convex/react";
import { convex } from "@/services/convexClient";

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      {/* existing Stack */}
    </ConvexProvider>
  );
}
```

## Task 3: Device Pairing Flow in Kiosk

Files: Create `app/(kiosk)/pair.tsx`, modify `app/index.tsx`, add `services/deviceService.ts`.

- [ ] Step 1: Device service

```ts
// services/deviceService.ts
import * as SecureStore from "expo-secure-store";
import { convex } from "@/services/convexClient";
import { api } from "@/convex/_generated/api";

const DEVICE_ID_KEY = "device_id";

export async function getDeviceId() {
  return SecureStore.getItemAsync(DEVICE_ID_KEY);
}

export async function registerDevice(code: string, name: string) {
  const { deviceId } = await convex.mutation(api.pairing.registerDevice, {
    code,
    deviceName: name,
  });
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}
```

- [ ] Step 2: Pair screen

```tsx
// app/(kiosk)/pair.tsx
export default function PairScreen() {
  /* input code + device name, call registerDevice */
}
```

- [ ] Step 3: Route gating

```ts
// app/index.tsx
// if no deviceId -> /(kiosk)/pair
// else -> /(kiosk)/timer or /(kiosk)/locked
```

## Task 4: Client Session Subscription + 10-Minute Warning

Files: Create `hooks/useDeviceSession.ts`, update `app/(kiosk)/timer.tsx`, `app/(kiosk)/locked.tsx`.

- [ ] Step 1: Session hook

```ts
// hooks/useDeviceSession.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useDeviceSession(deviceId: string) {
  const session = useQuery(api.sessions.getActiveSession, { deviceId });
  return session;
}
```

- [ ] Step 2: Timer screen

```tsx
// app/(kiosk)/timer.tsx
// compute remainingSeconds = Math.max(0, Math.floor((session.endsAt - Date.now()) / 1000))
```

- [ ] Step 3: 10-minute banner

```ts
const showWarning = remainingSeconds > 0 && remainingSeconds <= 600;
// render banner when showWarning true
```

- [ ] Step 4: Lock when no session

```ts
// if no session or remainingSeconds <= 0 -> /(kiosk)/locked
```

## Task 5: Admin Device List + Start/Extend

Files: Modify `app/(admin)/dashboard.tsx`, create `services/adminService.ts`.

- [ ] Step 1: Admin service

```ts
// services/adminService.ts
import { convex } from "@/services/convexClient";
import { api } from "@/convex/_generated/api";

export async function listDevices() {
  return convex.query(api.devices.listDevices, {});
}

export async function startSession(deviceId: string, seconds: number) {
  return convex.mutation(api.sessions.startSession, { deviceId, durationSeconds: seconds });
}

export async function extendSession(sessionId: string, addSeconds: number) {
  return convex.mutation(api.sessions.extendSession, { sessionId, addSeconds });
}
```

- [ ] Step 2: Dashboard UI

```tsx
// app/(admin)/dashboard.tsx
// show device list with lastSeenAt, active session, start/extend buttons
```

## Task 6: Quick Time Presets Editable

Files: Modify `app/(admin)/settings.tsx`, add `services/settingsService.ts`.

- [ ] Step 1: Settings service

```ts
// services/settingsService.ts
import { convex } from "@/services/convexClient";
import { api } from "@/convex/_generated/api";

export async function getPresets() {
  return convex.query(api.settings.getAdminSettings, {});
}

export async function updatePresets(presets: number[]) {
  return convex.mutation(api.settings.updateQuickPresets, { presets });
}
```

- [ ] Step 2: Settings UI

```tsx
// app/(admin)/settings.tsx
// list presets, allow add/remove/edit, save to Convex
```

- [ ] Step 3: Generate pairing code

```ts
// call api.pairing.createPairingCode and show code + expiry
```

## Test Plan

- Manual:
  1. Admin generates pairing code; client registers and appears in admin list.
  2. Admin starts 1h session; client timer starts immediately.
  3. Client goes offline mid-session; countdown continues and locks at 0.
  4. Admin extends session while client online; client updates remaining time.
  5. 10-minute banner appears at 600 seconds.
  6. Quick presets edited in settings; reflected on dashboard.
- Automated (if adding tests later):
  - Unit tests for time calculations and preset validation.

## Assumptions

- Convex project will be initialized and `EXPO_PUBLIC_CONVEX_URL` available at runtime.
- No strict auth beyond pairing code in v1; proper admin auth can be added later if needed.

## Workflow

Startup

1. `app/index.tsx` checks if the device is paired (stored `device_id`).
2. If not paired -> `/(kiosk)/pair`.
3. If paired -> `/(kiosk)/locked`.

Pairing (Client/Kiosk)

- Screen: `app/(kiosk)/pair.tsx`
- Client enters admin pairing code + device name.
- On success, device ID is stored in SecureStore and the client goes to `/(kiosk)/locked`.

Locked State (Client/Kiosk)

- Screen: `app/(kiosk)/locked.tsx`
- Kiosk mode ON, back button blocked.
- Subscribes to Convex session for this device.
- When a session becomes active -> auto-redirect to `/(kiosk)/timer`.

Active Timer (Client/Kiosk)

- Screen: `app/(kiosk)/timer.tsx`
- Shows countdown from Convex session `endsAt`.
- 10-minute warning banner at `<= 600` seconds.
- When session expires -> auto-redirect to `/(kiosk)/locked`.
- Admin access is hidden: long-press top-right for 5 seconds -> `/(admin)/login`.

Admin Login

- Screen: `app/(admin)/login.tsx`
- PIN check via `hooks/useAdminAuth.ts` (default PIN `1234` in `constants/config.ts`).

Admin Dashboard

- Screen: `app/(admin)/dashboard.tsx`
- Generate pairing code for new client.
- View devices + last seen + active session status.
- Start or extend time using quick presets or custom minutes.

Admin Settings

- Screen: `app/(admin)/settings.tsx`
- Edit quick time presets (stored in Convex).
- Change admin PIN.

Backend (Convex)

- Pairing: `convex/pairing.ts`
- Devices: `convex/devices.ts`
- Sessions: `convex/sessions.ts`
- Presets: `convex/settings.ts`
- Schema: `convex/schema.ts`
