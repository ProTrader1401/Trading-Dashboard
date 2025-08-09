import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Settings } from "@shared/schema";

interface AppContextType {
  settings: Settings | null;
  updateSettings: (settings: Partial<Settings>) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem("tradingDashboard_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    } else {
      // Default settings
      setSettings({
        id: 1,
        googleSheetId: import.meta.env.VITE_GOOGLE_SHEET_ID || "",
        googleScriptUrl: import.meta.env.VITE_GOOGLE_SCRIPT_URL || "",
        updatedAt: new Date(),
      });
    }
    setIsLoading(false);
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings } as Settings;
    setSettings(updated);
    localStorage.setItem("tradingDashboard_settings", JSON.stringify(updated));
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
