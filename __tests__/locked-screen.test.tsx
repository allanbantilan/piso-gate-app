/// <reference types="jest" />

import React from "react";
import { act, render, waitFor } from "@testing-library/react-native";
import LockedScreen from "@/app/(kiosk)/locked";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockGetDeviceId = jest.fn();
const mockUseDeviceSession = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush
  })
}));

jest.mock("@/services/deviceService", () => ({
  getDeviceId: (...args: unknown[]) => mockGetDeviceId(...args)
}));

jest.mock("@/hooks/useDeviceSession", () => ({
  useDeviceSession: (...args: unknown[]) => mockUseDeviceSession(...args)
}));

jest.mock("@/hooks/useHeartbeat", () => ({
  useHeartbeat: () => undefined
}));

describe("Locked screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes to pair when there is no paired device", async () => {
    mockGetDeviceId.mockResolvedValueOnce(null);
    mockUseDeviceSession.mockReturnValue(null);

    render(<LockedScreen />);
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(kiosk)/pair");
    });
  });

  it("routes to timer when active session exists", async () => {
    mockGetDeviceId.mockResolvedValue("device_123");
    mockUseDeviceSession.mockReturnValue({ endsAt: Date.now() + 60_000 });

    render(<LockedScreen />);
    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(kiosk)/timer");
    });
  });
});
