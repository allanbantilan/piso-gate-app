import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { DEFAULT_ADMIN_PIN } from "@/constants/config";
import { ADMIN_SESSION_PIN_KEY } from "@/services/deviceService";

const ADMIN_PIN_KEY = "admin_pin";

export function useAdminAuth() {
  const [loading, setLoading] = useState(true);
  const [savedPin, setSavedPin] = useState(DEFAULT_ADMIN_PIN);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pin, session] = await Promise.all([
          SecureStore.getItemAsync(ADMIN_PIN_KEY),
          SecureStore.getItemAsync(ADMIN_SESSION_PIN_KEY)
        ]);
        setSavedPin(pin ?? DEFAULT_ADMIN_PIN);
        setIsAuthenticated((pin ?? DEFAULT_ADMIN_PIN) === session);
      } catch {
        setSavedPin(DEFAULT_ADMIN_PIN);
        setIsAuthenticated(false);
      }
      setLoading(false);
    })();
  }, []);

  const signIn = useCallback(
    async (pinAttempt: string) => {
      if (pinAttempt !== savedPin) return false;
      try {
        await SecureStore.setItemAsync(ADMIN_SESSION_PIN_KEY, pinAttempt);
        setIsAuthenticated(true);
        return true;
      } catch {
        setIsAuthenticated(false);
        return false;
      }
    },
    [savedPin]
  );

  const signOut = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(ADMIN_SESSION_PIN_KEY);
    } catch {
      // Keep app usable even if secure store is temporarily unavailable.
    }
    setIsAuthenticated(false);
  }, []);

  const updatePin = useCallback(
    async (nextPin: string) => {
      const normalized = nextPin.trim();
      if (!normalized) throw new Error("PIN cannot be empty");
      try {
        await Promise.all([
          SecureStore.setItemAsync(ADMIN_PIN_KEY, normalized),
          SecureStore.setItemAsync(ADMIN_SESSION_PIN_KEY, normalized)
        ]);
        setSavedPin(normalized);
        setIsAuthenticated(true);
      } catch {
        throw new Error("Unable to save PIN right now");
      }
    },
    []
  );

  return {
    loading,
    isAuthenticated,
    signIn,
    signOut,
    updatePin
  };
}
