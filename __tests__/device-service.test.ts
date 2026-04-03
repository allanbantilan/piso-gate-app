/// <reference types="jest" />

import { registerDevice } from "@/services/deviceService";

const mockMutation = jest.fn();
const mockSetItemAsync = jest.fn();

jest.mock("@/services/convexClient", () => ({
  convex: {
    mutation: (...args: unknown[]) => mockMutation(...args)
  }
}));

jest.mock("expo-secure-store", () => ({
  setItemAsync: (...args: unknown[]) => mockSetItemAsync(...args),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn()
}));

describe("deviceService.registerDevice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes pairing code and stores device identity locally", async () => {
    mockMutation.mockResolvedValueOnce({ deviceId: "device_123" });

    const deviceId = await registerDevice(" ab12cd ", " Kiosk A ");

    expect(deviceId).toBe("device_123");
    expect(mockMutation).toHaveBeenCalledWith(expect.anything(), {
      code: "AB12CD",
      deviceName: "Kiosk A"
    });
    expect(mockSetItemAsync).toHaveBeenCalledWith("device_id", "device_123");
    expect(mockSetItemAsync).toHaveBeenCalledWith("device_name", "Kiosk A");
  });
});
