"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  FiBell,
  FiVolume2,
  FiVolumeX,
  FiMoon,
  FiSun,
  FiGlobe,
  FiLock,
  FiShield,
  FiTrash2,
  FiChevronRight,
  FiCheck,
  FiInfo,
  FiRefreshCw,
  FiSave,
} from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Apply theme and font size directly
const applyTheme = (theme) => {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");

  let effectiveTheme = theme;
  if (theme === "system") {
    effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  root.classList.add(`theme-${effectiveTheme}`);
  root.setAttribute("data-theme", effectiveTheme);
};

const applyFontSize = (fontSize) => {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("font-small", "font-medium", "font-large");
  root.classList.add(`font-${fontSize}`);

  const fontSizeMap = {
    small: "14px",
    medium: "16px",
    large: "18px",
  };
  root.style.setProperty("--chat-font-size", fontSizeMap[fontSize] || "16px");
};

const SETTINGS_SECTIONS = [
  {
    id: "notifications",
    title: "Thông báo",
    icon: <FiBell />,
    items: [
      {
        id: "notification_sound",
        label: "Âm thanh thông báo",
        type: "toggle",
        defaultValue: true,
      },
      {
        id: "notification_preview",
        label: "Xem trước tin nhắn",
        type: "toggle",
        defaultValue: true,
      },
      {
        id: "notification_desktop",
        label: "Thông báo trên desktop",
        type: "toggle",
        defaultValue: true,
      },
    ],
  },
  {
    id: "appearance",
    title: "Giao diện",
    icon: <FiMoon />,
    items: [
      {
        id: "theme",
        label: "Chủ đề",
        type: "select",
        options: [
          { value: "light", label: "Sáng" },
          { value: "dark", label: "Tối" },
          { value: "system", label: "Theo hệ thống" },
        ],
        defaultValue: "light",
      },
      {
        id: "font_size",
        label: "Cỡ chữ",
        type: "select",
        options: [
          { value: "small", label: "Nhỏ" },
          { value: "medium", label: "Vừa" },
          { value: "large", label: "Lớn" },
        ],
        defaultValue: "medium",
      },
    ],
  },
  {
    id: "privacy",
    title: "Quyền riêng tư",
    icon: <FiLock />,
    items: [
      {
        id: "read_receipts",
        label: "Xác nhận đã đọc",
        type: "toggle",
        defaultValue: true,
        description: "Cho phép người khác biết khi bạn đã đọc tin nhắn",
      },
      {
        id: "online_status",
        label: "Trạng thái trực tuyến",
        type: "toggle",
        defaultValue: true,
        description: "Hiển thị khi bạn đang online",
      },
      {
        id: "typing_indicator",
        label: "Đang nhập...",
        type: "toggle",
        defaultValue: true,
        description: "Hiển thị khi bạn đang soạn tin nhắn",
      },
    ],
  },
  {
    id: "storage",
    title: "Lưu trữ",
    icon: <FiShield />,
    items: [
      {
        id: "auto_download_media",
        label: "Tự động tải media",
        type: "toggle",
        defaultValue: true,
      },
      {
        id: "media_quality",
        label: "Chất lượng media",
        type: "select",
        options: [
          { value: "low", label: "Thấp" },
          { value: "medium", label: "Trung bình" },
          { value: "high", label: "Cao" },
        ],
        defaultValue: "medium",
      },
    ],
  },
];

function SettingToggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        value ? "bg-brand" : "bg-[var(--color-surface-200)]"
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          value ? "translate-x-5.5 left-0.5" : "translate-x-0.5 left-0"
        }`}
        style={{ transform: value ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function SettingSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-surface-50)] hover:bg-[var(--color-surface-100)] transition text-sm"
      >
        <span>{options.find((o) => o.value === value)?.label}</span>
        <FiChevronRight
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-[var(--color-border)] py-1 z-20 min-w-[120px]">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-50)] flex items-center justify-between ${
                  value === option.value
                    ? "text-brand font-medium"
                    : "text-text-strong"
                }`}
              >
                {option.label}
                {value === option.value && <FiCheck size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Build default settings from sections
const buildDefaultSettings = () => {
  const defaults = {};
  SETTINGS_SECTIONS.forEach((section) => {
    section.items.forEach((item) => {
      defaults[item.id] = item.defaultValue;
    });
  });
  return defaults;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(buildDefaultSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosClient.get("/api/settings");
      if (res.data?.success) {
        const newSettings = { ...buildDefaultSettings(), ...res.data.settings };
        setSettings(newSettings);
        // Apply theme and font size immediately
        applyTheme(newSettings.theme);
        applyFontSize(newSettings.font_size);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError("Không thể tải cài đặt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [settings.theme]);

  // Save setting to API (debounced)
  const saveSettingToAPI = useCallback(async (id, value) => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      await axiosClient.patch("/api/settings", { [id]: value });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save setting:", err);
      setError("Không thể lưu cài đặt");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleSettingChange = (id, value) => {
    setSettings((prev) => ({ ...prev, [id]: value }));
    saveSettingToAPI(id, value);

    // Apply theme/font changes immediately
    if (id === "theme") {
      applyTheme(value);
    } else if (id === "font_size") {
      applyFontSize(value);
    }
  };

  const handleResetSettings = async () => {
    try {
      setSaving(true);
      const res = await axiosClient.post("/api/settings/reset");
      if (res.data?.success) {
        setSettings(res.data.settings);
        // Apply reset theme and font
        applyTheme(res.data.settings.theme);
        applyFontSize(res.data.settings.font_size);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to reset settings:", err);
      setError("Không thể đặt lại cài đặt");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white pb-20 lg:pb-0">
      {/* Header */}
      <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-text-strong">
              Cài đặt
            </h1>
            <p className="text-xs lg:text-sm text-text-muted mt-1">
              Tùy chỉnh trải nghiệm chat của bạn
            </p>
          </div>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-sm text-text-muted flex items-center gap-1">
                <FiRefreshCw size={14} className="animate-spin" />
                Đang lưu...
              </span>
            )}
            {saveSuccess && (
              <span className="text-sm text-green-500 flex items-center gap-1">
                <FiCheck size={14} />
                Đã lưu
              </span>
            )}
            <button
              onClick={fetchSettings}
              className="p-2 rounded-full hover:bg-[var(--color-surface-50)] text-text-muted"
              title="Làm mới"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {[...Array(4)].map((_, sectionIdx) => (
              <div key={sectionIdx} className="py-4">
                <div className="px-6 flex items-center gap-3 mb-4">
                  <Skeleton width={32} height={32} borderRadius={8} />
                  <Skeleton width={100} height={20} />
                </div>
                <div className="space-y-1">
                  {[...Array(3)].map((_, itemIdx) => (
                    <div key={itemIdx} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Skeleton width={150} height={16} />
                          <Skeleton
                            width={200}
                            height={12}
                            style={{ marginTop: 4 }}
                          />
                        </div>
                        <Skeleton width={44} height={24} borderRadius={12} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted">
            <p className="text-lg font-medium text-[var(--color-danger-500)]">
              {error}
            </p>
            <button
              onClick={fetchSettings}
              className="mt-4 px-4 py-2 rounded-full bg-brand text-white hover:opacity-90"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[var(--color-border)]">
              {SETTINGS_SECTIONS.map((section) => (
                <div key={section.id} className="py-4">
                  <div className="px-6 flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                      {section.icon}
                    </div>
                    <h2 className="font-semibold text-text-strong">
                      {section.title}
                    </h2>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className="px-6 py-3 hover:bg-[var(--color-surface-50)] transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-text-strong">
                              {item.label}
                            </p>
                            {item.description && (
                              <p className="text-xs text-text-muted mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {item.type === "toggle" && (
                            <SettingToggle
                              value={settings[item.id] ?? item.defaultValue}
                              onChange={(value) =>
                                handleSettingChange(item.id, value)
                              }
                            />
                          )}
                          {item.type === "select" && (
                            <SettingSelect
                              value={settings[item.id] ?? item.defaultValue}
                              options={item.options}
                              onChange={(value) =>
                                handleSettingChange(item.id, value)
                              }
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Reset button */}
            <div className="px-6 py-6 border-t border-[var(--color-border)]">
              <button
                onClick={handleResetSettings}
                disabled={saving}
                className="flex items-center gap-2 text-sm text-[var(--color-danger-500)] hover:underline disabled:opacity-50"
              >
                <FiTrash2 size={14} />
                Đặt lại cài đặt mặc định
              </button>
            </div>

            {/* Version info */}
            <div className="px-6 pb-6">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <FiInfo size={12} />
                <span>D2MBox Chat v1.0.0</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
