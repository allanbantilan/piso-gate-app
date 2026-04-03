/// <reference types="jest" />

import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import PairScreen from "@/app/(kiosk)/pair";

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockRegisterDevice = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush
  })
}));

jest.mock("@/services/deviceService", () => ({
  registerDevice: (...args: unknown[]) => mockRegisterDevice(...args)
}));

describe("Pair screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigates to admin login when admin button is pressed", () => {
    const { getByText } = render(<PairScreen />);
    fireEvent.press(getByText("Admin Login"));
    expect(mockPush).toHaveBeenCalledWith("/(admin)/login");
  });

  it("pairs a device and routes to locked screen", async () => {
    mockRegisterDevice.mockResolvedValueOnce("device_123");
    const { getByPlaceholderText, getAllByText } = render(<PairScreen />);

    fireEvent.changeText(getByPlaceholderText("Pairing Code"), " ab12cd ");
    fireEvent.changeText(getByPlaceholderText("Device Name"), "Kiosk A");
    fireEvent.press(getAllByText("Pair Device")[1]);

    await waitFor(() => {
      expect(mockRegisterDevice).toHaveBeenCalledWith(" ab12cd ", "Kiosk A");
      expect(mockReplace).toHaveBeenCalledWith("/(kiosk)/locked");
    });
  });
});
