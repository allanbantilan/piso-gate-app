/// <reference types="jest" />

import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AdminDashboardScreen from "@/app/(admin)/dashboard";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSignOut = jest.fn();
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn();
const mockCreateCode = jest.fn();
const mockStartSession = jest.fn();
const mockExtendSession = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush
  })
}));

jest.mock("convex/react", () => ({
  ConvexReactClient: jest.fn(),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args)
}));

jest.mock("@/hooks/useAdminAuth", () => ({
  useAdminAuth: () => ({
    loading: false,
    isAuthenticated: true,
    signOut: mockSignOut
  })
}));

jest.mock("@/services/convexClient", () => ({
  isConvexConfigured: true,
  convexConfigErrorMessage: ""
}));

describe("Admin dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation
      .mockReturnValueOnce(mockCreateCode)
      .mockReturnValueOnce(mockStartSession)
      .mockReturnValueOnce(mockExtendSession);
  });

  it("shows paired devices on dashboard", () => {
    mockUseQuery
      .mockReturnValueOnce([
        {
          _id: "device_1",
          name: "Kiosk A",
          lastSeenAt: Date.now(),
          isOnline: true,
          activeSession: null
        }
      ])
      .mockReturnValueOnce([3600]);

    const { getByText } = render(<AdminDashboardScreen />);
    expect(getByText("Kiosk A")).toBeTruthy();
  });

  it("starts a session when adding time to a device with no active session", async () => {
    mockUseQuery
      .mockReturnValueOnce([
        {
          _id: "device_1",
          name: "Kiosk A",
          lastSeenAt: Date.now(),
          isOnline: true,
          activeSession: null
        }
      ])
      .mockReturnValueOnce([3600]);

    const { getByText } = render(<AdminDashboardScreen />);
    fireEvent.press(getByText("+1h"));

    await waitFor(() => {
      expect(mockStartSession).toHaveBeenCalledWith({
        deviceId: "device_1",
        durationSeconds: 3600
      });
    });
  });

  it("extends a session when device already has an active session", async () => {
    mockUseQuery
      .mockReturnValueOnce([
        {
          _id: "device_1",
          name: "Kiosk A",
          lastSeenAt: Date.now(),
          isOnline: true,
          activeSession: { _id: "session_1", endsAt: Date.now() + 30_000 }
        }
      ])
      .mockReturnValueOnce([3600]);

    const { getByText } = render(<AdminDashboardScreen />);
    fireEvent.press(getByText("+1h"));

    await waitFor(() => {
      expect(mockExtendSession).toHaveBeenCalledWith({
        sessionId: "session_1",
        addSeconds: 3600
      });
    });
  });
});
