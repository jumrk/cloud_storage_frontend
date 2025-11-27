"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosClient from "@/shared/lib/axiosClient";

const DEFAULT_SETTINGS = {
  notification_sound: true,
  notification_preview: true,
  notification_desktop: true,
  theme: "light",
  font_size: "medium",
  read_receipts: true,
  online_status: true,
  typing_indicator: true,
  auto_download_media: true,
  media_quality: "medium",
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  updateSetting: () => {},
  loading: true,
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axiosClient.get("/api/settings");
        if (res.data?.success) {
          setSettings((prev) => ({ ...prev, ...res.data.settings }));
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("theme-light", "theme-dark");
    
    let effectiveTheme = settings.theme;
    if (settings.theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    
    root.classList.add(`theme-${effectiveTheme}`);
    root.setAttribute("data-theme", effectiveTheme);
    
    // Listen for system theme changes
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e) => {
        root.classList.remove("theme-light", "theme-dark");
        root.classList.add(`theme-${e.matches ? "dark" : "light"}`);
        root.setAttribute("data-theme", e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.theme]);

  // Apply font size
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing font size classes
    root.classList.remove("font-small", "font-medium", "font-large");
    root.classList.add(`font-${settings.font_size}`);
    
    // Set CSS variable for font size
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
    };
    root.style.setProperty("--chat-font-size", fontSizeMap[settings.font_size] || "16px");
  }, [settings.font_size]);

  const updateSetting = useCallback(async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    
    try {
      await axiosClient.patch("/api/settings", { [key]: value });
    } catch (err) {
      console.error("Failed to save setting:", err);
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export default SettingsContext;

