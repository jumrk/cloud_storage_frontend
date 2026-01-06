"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  FiSave,
  FiLoader,
  FiChevronDown,
  FiUpload,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

const DEFAULT_PROVIDERS = [
  {
    code: "elevenlabs",
    name: "ElevenLabs",
    models: [
      { code: "eleven_turbo_v2_5", name: "Turbo" },
      { code: "eleven_multilingual_v2", name: "Multilingual" },
      { code: "eleven_monolingual_v1", name: "Monolingual" },
    ],
  },
  {
    code: "openai",
    name: "OpenAI",
    models: [
      { code: "tts-1", name: "TTS-1" },
      { code: "tts-1-hd", name: "TTS-1-HD" },
    ],
  },
  {
    code: "google",
    name: "Google (Gemini)",
    models: [
      { code: "gemini-2.5-flash-preview-tts", name: "Gemini 2.5 Flash Preview" },
      { code: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash" },
      { code: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { code: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ],
  },
  {
    code: "amazon",
    name: "Amazon Polly",
    models: [
      { code: "neural", name: "Neural" },
      { code: "standard", name: "Standard" },
    ],
  },
  {
    code: "microsoft",
    name: "Microsoft Azure",
    models: [
      { code: "neural", name: "Neural" },
      { code: "standard", name: "Standard" },
    ],
  },
  {
    code: "google-gemini",
    name: "Google Gemini",
    models: [
      { code: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash" },
      { code: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
      { code: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
    ],
  },
];

export default function AIVoiceSettingsTab({
  settings,
  setSettings,
  loading,
  onSave,
}) {
  const [expandedProviders, setExpandedProviders] = useState({});
  const [editingModel, setEditingModel] = useState(null); // { providerCode, modelCode }
  const [newModel, setNewModel] = useState({ code: "", name: "" });
  const fileInputRefs = useRef({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave();
  };

  const toggleProvider = (providerCode) => {
    setExpandedProviders((prev) => ({
      ...prev,
      [providerCode]: !prev[providerCode],
    }));
  };

  const toggleProviderEnabled = (providerCode) => {
    setSettings({
      ...settings,
      providers: settings.providers.map((p) =>
        p.code === providerCode ? { ...p, enabled: !p.enabled } : p
      ),
    });
  };

  const toggleModelEnabled = (providerCode, modelCode) => {
    setSettings({
      ...settings,
      providers: settings.providers.map((p) =>
        p.code === providerCode
          ? {
              ...p,
              models: p.models.map((m) =>
                m.code === modelCode ? { ...m, enabled: !m.enabled } : m
              ),
            }
          : p
      ),
    });
  };

  const handleAddModel = (providerCode) => {
    if (!newModel.code || !newModel.name) {
      alert("Vui lòng nhập đầy đủ code và name cho model");
      return;
    }

    // Check if model code already exists
    const provider = settings.providers.find((p) => p.code === providerCode);
    if (provider?.models.find((m) => m.code === newModel.code)) {
      alert("Model code đã tồn tại");
      return;
    }

    setSettings({
      ...settings,
      providers: settings.providers.map((p) =>
        p.code === providerCode
          ? {
              ...p,
              models: [
                ...(p.models || []),
                {
                  ...newModel,
                  enabled: true,
                },
              ],
            }
          : p
      ),
    });
    setNewModel({ code: "", name: "" });
  };

  const handleEditModel = (providerCode, modelCode, newData) => {
    setSettings({
      ...settings,
      providers: settings.providers.map((p) =>
        p.code === providerCode
          ? {
              ...p,
              models: p.models.map((m) =>
                m.code === modelCode ? { ...m, ...newData } : m
              ),
            }
          : p
      ),
    });
    setEditingModel(null);
  };

  const handleDeleteModel = (providerCode, modelCode) => {
    if (!confirm("Bạn có chắc muốn xóa model này?")) return;

    setSettings({
      ...settings,
      providers: settings.providers.map((p) =>
        p.code === providerCode
          ? {
              ...p,
              models: p.models.filter((m) => m.code !== modelCode),
            }
          : p
      ),
    });
  };

  const handleProviderCredentialsChange = (providerCode, field, value) => {
    setSettings({
      ...settings,
      providers: settings.providers.map((p) =>
        p.code === providerCode ? { ...p, [field]: value } : p
      ),
    });
  };

  const handleFileUpload = (providerCode, e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          handleProviderCredentialsChange(
            providerCode,
            "credentials",
            JSON.stringify(json, null, 2)
          );
        } catch (error) {
          alert("File JSON không hợp lệ");
        }
      };
      reader.readAsText(file);
    }
  };

  // Initialize providers if empty
  useEffect(() => {
    if (!settings.providers || settings.providers.length === 0) {
      setSettings({
        ...settings,
        providers: DEFAULT_PROVIDERS.map((p) => ({
          ...p,
          enabled: false,
          models: p.models.map((m) => ({
            ...m,
            enabled: true,
          })),
          credentials: "",
          apiKey: "",
          region: "",
        })),
      });
    }
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">
          AI Lồng tiếng (Text-to-Speech)
        </h2>
        <p className="text-gray-500 text-xs">
          Cấu hình công nghệ chuyển đổi văn bản thành giọng nói (TTS) để tạo
          lồng tiếng cho video. Chỉ các nhà cung cấp được bật mới hiển thị cho
          người dùng.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Enable Voiceover */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-900">
              Bật AI Lồng tiếng
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Kích hoạt tính năng chuyển đổi văn bản thành giọng nói
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled || false}
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
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Nhà cung cấp và Model
            </h3>
            {settings.providers?.map((provider) => (
              <div
                key={provider.code}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                {/* Provider Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={provider.enabled || false}
                        onChange={() => toggleProviderEnabled(provider.code)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className="text-sm font-medium text-gray-900">
                      {provider.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleProvider(provider.code)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiChevronDown
                      className={`transition-transform ${
                        expandedProviders[provider.code] ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Provider Details */}
                {expandedProviders[provider.code] && (
                  <div className="pl-12 space-y-3 border-t border-gray-200 pt-3">
                    {/* Models */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-medium text-gray-700">
                          Models
                        </label>
                      </div>
                      <div className="space-y-2">
                        {provider.models?.map((model) => (
                          <div
                            key={model.code}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                          >
                            {editingModel?.providerCode === provider.code &&
                            editingModel?.modelCode === model.code ? (
                              <>
                                <input
                                  type="text"
                                  defaultValue={model.code}
                                  onBlur={(e) =>
                                    handleEditModel(provider.code, model.code, {
                                      code: e.target.value,
                                    })
                                  }
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Model ID (e.g., eleven_turbo_v2_5)"
                                />
                                <input
                                  type="text"
                                  defaultValue={model.name}
                                  onBlur={(e) =>
                                    handleEditModel(provider.code, model.code, {
                                      name: e.target.value,
                                    })
                                  }
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                  placeholder="Name"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditingModel(null)}
                                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                                >
                                  ✓
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-gray-900">
                                    {model.name}
                                  </div>
                                  <div className="text-[10px] text-gray-500">
                                    {model.code}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingModel({
                                        providerCode: provider.code,
                                        modelCode: model.code,
                                      })
                                    }
                                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteModel(provider.code, model.code)
                                    }
                                    className="px-2 py-1 text-xs text-red-600 hover:text-red-900"
                                  >
                                    <FiTrash2 className="text-xs" />
                                  </button>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={model.enabled || false}
                                      onChange={() =>
                                        toggleModelEnabled(
                                          provider.code,
                                          model.code
                                        )
                                      }
                                      className="sr-only peer"
                                    />
                                    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                                  </label>
                                </div>
                              </>
                            )}
                          </div>
                        ))}

                        {/* Add New Model */}
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                          <input
                            type="text"
                            value={newModel.code}
                            onChange={(e) =>
                              setNewModel({ ...newModel, code: e.target.value })
                            }
                            placeholder="Model ID (e.g., eleven_turbo_v2_5)"
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="text"
                            value={newModel.name}
                            onChange={(e) =>
                              setNewModel({ ...newModel, name: e.target.value })
                            }
                            placeholder="Model name"
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddModel(provider.code)}
                            className="px-2 py-1 bg-brand-500 text-white rounded text-xs hover:bg-brand-600 transition flex items-center gap-1"
                          >
                            <FiPlus className="text-xs" />
                            Thêm
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Credentials */}
                    {provider.code === "microsoft" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Service Account JSON
                        </label>
                        <div className="flex gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() =>
                              fileInputRefs.current[provider.code]?.click()
                            }
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition flex items-center gap-1"
                          >
                            <FiUpload className="text-xs" />
                            Upload JSON
                          </button>
                        </div>
                        <input
                          ref={(el) =>
                            (fileInputRefs.current[provider.code] = el)
                          }
                          type="file"
                          accept=".json"
                          onChange={(e) => handleFileUpload(provider.code, e)}
                          className="hidden"
                        />
                        <textarea
                          value={provider.credentials || ""}
                          onChange={(e) =>
                            handleProviderCredentialsChange(
                              provider.code,
                              "credentials",
                              e.target.value
                            )
                          }
                          placeholder="Paste Service Account JSON..."
                          rows={4}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* API Key */}
                    {(provider.code === "elevenlabs" ||
                      provider.code === "openai" ||
                      provider.code === "amazon" ||
                      provider.code === "google" ||
                      provider.code === "google-gemini") && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          API Key
                        </label>
                        <input
                          type="password"
                          value={provider.apiKey || ""}
                          onChange={(e) =>
                            handleProviderCredentialsChange(
                              provider.code,
                              "apiKey",
                              e.target.value
                            )
                          }
                          placeholder="Nhập API Key..."
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Region */}
                    {provider.code === "amazon" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Region
                        </label>
                        <input
                          type="text"
                          value={provider.region || "us-east-1"}
                          onChange={(e) =>
                            handleProviderCredentialsChange(
                              provider.code,
                              "region",
                              e.target.value
                            )
                          }
                          placeholder="us-east-1"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
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
