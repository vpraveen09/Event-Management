import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api.js";
import { useAuth } from "./auth.jsx";

const SettingsContext = createContext(null);

const DEFAULTS = { logo: null, app_name: "Event Manager" };

export function SettingsProvider({ children }) {
  const { token } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);

  const refresh = useCallback(() => {
    if (!token) return;
    api
      .getSettings(token)
      .then(setSettings)
      .catch(() => {});
  }, [token]);

  useEffect(refresh, [refresh]);

  return <SettingsContext.Provider value={{ ...settings, refresh, setSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext) || DEFAULTS;
}
