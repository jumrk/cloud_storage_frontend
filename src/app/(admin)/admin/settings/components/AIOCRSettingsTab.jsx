"use client";
import React, { useState, useRef, useEffect } from "react";
import { FiSave, FiLoader, FiChevronDown, FiUpload } from "react-icons/fi";
import Popover from "@/shared/ui/Popover";

const PROVIDERS = [
  { value: "tesseract", label: "Tesseract OCR" },
  { value: "google", label: "Google Cloud Vision" },
  { value: "aws", label: "AWS Textract" },
];

export default function AIOCRSettingsTab({
  settings,
  setSettings,
  loading,
  onSave,
}) {
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const providerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        providerRef.current &&
        !providerRef.current.contains(event.target)
      ) {
        setProviderDropdownOpen(false);
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
    });
    setProviderDropdownOpen(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          setSettings({
            ...settings,
            credentials: JSON.stringify(json, null, 2),
          });
        } catch (error) {
          alert("File JSON không hợp lệ");
        }
      };
      reader.readAsText(file);
    }
  };

  const currentProviderLabel =
    PROVIDERS.find((p) => p.value === settings.provider)?.label || "";

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-1.5">AI OCR</h2>
        <p className="text-gray-500 text-xs">
          Cấu hình công nghệ nhận dạng ký tự quang học (OCR) để trích xuất văn
          bản từ hình ảnh và video.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Enable OCR */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-900">
              Bật AI OCR
            </label>
            <p className="text-xs text-gray-500 mt-0.5">
              Kích hoạt tính năng nhận dạng văn bản từ hình ảnh và video
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
            {/* OCR Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhà cung cấp OCR
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

            {/* Google Cloud Credentials */}
            {settings.provider === "google" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Cloud Service Account
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 text-sm"
                    >
                      <FiUpload />
                      Upload JSON File
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCredentials(!showCredentials)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                    >
                      {showCredentials ? "Ẩn" : "Hiện"} Credentials
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {showCredentials && (
                    <textarea
                      value={settings.credentials || ""}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          credentials: e.target.value,
                        })
                      }
                      placeholder="Paste Google Cloud Service Account JSON..."
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-xs"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tải lên hoặc paste nội dung file JSON Service Account từ
                  Google Cloud Console
                </p>
              </div>
            )}

            {/* AWS API Key */}
            {settings.provider === "aws" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AWS Access Key ID
                  </label>
                  <input
                    type="password"
                    value={settings.awsAccessKeyId || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        awsAccessKeyId: e.target.value,
                      })
                    }
                    placeholder="Nhập AWS Access Key ID..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AWS Secret Access Key
                  </label>
                  <input
                    type="password"
                    value={settings.awsSecretAccessKey || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        awsSecretAccessKey: e.target.value,
                      })
                    }
                    placeholder="Nhập AWS Secret Access Key..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AWS Region
                  </label>
                  <input
                    type="text"
                    value={settings.awsRegion || "us-east-1"}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        awsRegion: e.target.value,
                      })
                    }
                    placeholder="us-east-1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </>
            )}

            {/* Accuracy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Độ chính xác: {settings.accuracy || 0.8}
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.1"
                  value={settings.accuracy || 0.8}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      accuracy: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                  style={{
                    "--range-progress": `${
                      (((settings.accuracy || 0.8) - 0.5) / 0.5) * 100
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Điều chỉnh độ chính xác của OCR (0.5 = nhanh, 1 = chính xác
                nhất)
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
