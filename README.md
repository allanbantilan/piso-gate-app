# Piso Gate App

Expo + Convex app for managing kiosk device sessions.

Works as a piso wifi but for phones.

## What This App Does

- Pair kiosk devices using short-lived pairing codes.
- Keep paired devices in a locked waiting state.
- Let admin start or extend time for each paired device.
- Show real-time countdown on kiosk devices.
- Show 10-minute warning before session ends.

## Tech Stack

- Frontend: Expo (React Native + Expo Router)
- Backend: Convex (queries, mutations, real-time subscriptions)
- Language: TypeScript
- Device persistence: `expo-secure-store`
- State/data flow: React hooks + Convex React client
- Testing: Jest + React Native Testing Library

## Architecture

- Client app:
  - Kiosk routes (`/(kiosk)/*`) for pair, locked, and timer states.
  - Admin routes (`/(admin)/*`) for login, dashboard, and settings.
- Backend (Convex):
  - `pairingCodes` table for short-lived pairing tokens.
  - `devices` table for registered devices and heartbeat timestamps.
  - `sessions` table for active/inactive timed sessions per device.
  - `adminSettings` table for quick-time presets and admin settings.
- Data flow:
  - Admin generates pairing code -> kiosk registers device.
  - Kiosk sends heartbeat periodically.
  - Admin starts/extends sessions.
  - Kiosk subscribes to active session and renders countdown in real time.

## App Roles

- Kiosk device:
  - Pair once with admin-generated code.
  - Stay locked when no active session.
  - Show timer when session is active.
- Admin:
  - Generate pairing codes.
  - View paired devices and online status.
  - Add time using presets or custom minutes.
  - Edit quick presets and admin PIN in settings.

## Workflow

### 1. Startup

- App checks local `device_id` in secure storage.
- If no `device_id`: route to `/(kiosk)/pair`.
- If paired: route to `/(kiosk)/locked`.

### 2. Pairing

- Admin opens dashboard and generates a pairing code.
- On kiosk Pair screen:
  - Enter pairing code + device name.
  - Tap **Pair Device**.
- On success:
  - Device is registered in Convex.
  - `device_id` and `device_name` are saved locally.
  - Kiosk moves to `/(kiosk)/locked`.

### 3. Locked State

- Kiosk shows “Device Locked”.
- It waits for an active session from admin.
- If admin starts session, kiosk moves to `/(kiosk)/timer`.

### 4. Timer State

- Kiosk shows countdown based on session `endsAt`.
- Admin can extend time; countdown updates accordingly.
- At 600 seconds remaining, warning banner appears.
- When time reaches 0, kiosk returns to locked state.

### 5. Admin Access

- From kiosk screens, admin can open login.
- Pair screen has a visible **Admin Login** button at top-right.
- Default PIN is `1234` (unless changed in settings).

## Main Screens

- `app/(kiosk)/pair.tsx`
- `app/(kiosk)/locked.tsx`
- `app/(kiosk)/timer.tsx`
- `app/(admin)/login.tsx`
- `app/(admin)/dashboard.tsx`
- `app/(admin)/settings.tsx`

## Backend (Convex)

- `convex/pairing.ts`: pairing code creation and device registration.
- `convex/devices.ts`: heartbeat and device list with online/session info.
- `convex/sessions.ts`: start, extend, and fetch active session.
- `convex/settings.ts`: admin quick presets.
- `convex/schema.ts`: tables and indexes.

## Local Development

1. Install deps:

```bash
npm install
```

2. Set env:

- Copy `.env.example` to `.env.local`.
- Set `EXPO_PUBLIC_CONVEX_URL` and related Convex values.

3. Start Convex:

```bash
npm run convex:dev
```

4. Start Expo:

```bash
npm run start
```

## Testing

Run automated tests:

```bash
npm test
```

Current coverage includes:

- Pair screen admin access and pairing action.
- Locked-screen routing behavior.
- Admin dashboard device rendering and add-time behavior.
- Device registration payload/storage behavior.

Also run type checks:

```bash
npm run typecheck
```

## Notes

- This project currently has mocked flow tests (component/service level), not full device E2E.
- For production hardening, add auth/authorization for admin endpoints.
