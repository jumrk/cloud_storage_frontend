"use client";
import React, { useState, useRef, useEffect } from "react";
import { FiSave, FiLoader, FiChevronDown } from "react-icons/fi";
import Popover from "@/shared/ui/Popover";

// Model lists for each provider
const MODELS = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
  anthropic: [
    {
      value: "claude-3-5-sonnet-20241022",
      label: "Claude 3.5 Sonnet (Latest)",
    },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
    { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  ],
  google: [
    {
      value: "gemini-3-flash-preview",
      label: "Gemini 3 Flash (Preview) - Mới nhất",
    },
    { value: "gemini-3-pro", label: "Gemini 3 Pro - Thông minh nhất" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  ],
};

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "google", label: "Google (Gemini)" },
];

export default function AISettingsTab({
  settings,
  setSettings,
  loading,
  onSave,
}) {
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const providerRef = useRef(null);
  const modelRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        providerRef.current &&
        !providerRef.current.contains(event.target)
      ) {
        setProviderDropdownOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(event.target)) {
        setModelDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave();
  };

  const handleProviderChange = (provider) => {
    setSettings({
      ...settings,
      provider,
      model: MODELS[provider]?.[0]?.value || settings.model, // Reset to first model of new provider
    });
    setProviderDropdownOpen(false);
  };

  const handleModelSelect = (model) => {
    setSettings({
      ...settings,
      model,
    });
    setModelDropdownOpen(false);
  };

  const currentProviderLabel =
    PROVIDERS.find((p) => p.value === settings.provider)?.label || "";
  const availableModels = MODELS[settings.provider] || [];

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
          AI Chat
        </h2>
        <p className="text-gray-500 text-xs">
          Cấu hình trợ lý AI để hỗ trợ người dùng quản lý file thông qua chat.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Enable AI */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-900">
              Bật trợ lý AI
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Kích hoạt tính năng chat AI cho file management
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  enabled: e.target.checked,
                })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {settings.enabled && (
          <>
            {/* AI Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhà cung cấp AI
              </label>
              <div className="relative" ref={providerRef}>
                <button
                  type="button"
                  onClick={() =>
                    setProviderDropdownOpen(!providerDropdownOpen)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white flex items-center justify-between"
                >
                  <span>{currentProviderLabel}</span>
                  <FiChevronDown
                    className={`text-gray-500 transition-transform ${
                      providerDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {providerDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProviderDropdownOpen(false)}
                  />
                )}
                <Popover
                  open={providerDropdownOpen}
                  className="w-full min-w-[200px] mt-1"
                >
                  <div className="py-1">
                    {PROVIDERS.map((provider) => (
                      <button
                        key={provider.value}
                        type="button"
                        onClick={() => handleProviderChange(provider.value)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
                          settings.provider === provider.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {provider.label}
                      </button>
                    ))}
                  </div>
                </Popover>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    apiKey: e.target.value,
                  })
                }
                placeholder="Nhập API key..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                API key sẽ được mã hóa và lưu trữ an toàn
              </p>
            </div>

            {/* Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <div className="relative" ref={modelRef}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.model}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        model: e.target.value,
                      })
                    }
                    onFocus={() => setModelDropdownOpen(true)}
                    placeholder="Nhập tên model hoặc chọn từ danh sách..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setModelDropdownOpen(!modelDropdownOpen)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center"
                  >
                    <FiChevronDown
                      className={`text-gray-500 transition-transform ${
                        modelDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
                {modelDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setModelDropdownOpen(false)}
                  />
                )}
                <Popover
                  open={modelDropdownOpen}
                  className="w-full min-w-[300px] mt-1 max-h-60 overflow-y-auto sidebar-scrollbar"
                >
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-200">
                      Gợi ý ({availableModels.length})
                    </div>
                    {availableModels.map((model) => (
                      <button
                        key={model.value}
                        type="button"
                        onClick={() => handleModelSelect(model.value)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
                          settings.model === model.value
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{model.label}</div>
                        <div className="text-xs text-gray-500">
                          {model.value}
                        </div>
                      </button>
                    ))}
                    {availableModels.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Không có model gợi ý
                      </div>
                    )}
                  </div>
                </Popover>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Bạn có thể nhập tên model tùy chỉnh hoặc chọn từ danh sách gợi
                ý
              </p>
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature: {settings.temperature}
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                  style={{
                    "--range-progress": `${settings.temperature * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Điều chỉnh độ sáng tạo của AI (0 = chính xác, 1 = sáng tạo)
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="4000"
                step="100"
                value={settings.maxTokens}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTokens: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Giới hạn độ dài phản hồi của AI
              </p>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || !settings.enabled}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <FiSave />
                <span>Lưu cài đặt</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
