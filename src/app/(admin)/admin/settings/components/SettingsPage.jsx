"use client";

import React, { useState } from "react";
import { FiSettings, FiLoader, FiMessageCircle, FiEye, FiMic, FiVolume2 } from "react-icons/fi";
import useSettingsPage from "../hooks/useSettingsPage";
import AISettingsTab from "./AISettingsTab";
import AIOCRSettingsTab from "./AIOCRSettingsTab";
import AIASRSettingsTab from "./AIASRSettingsTab";
import AIVoiceSettingsTab from "./AIVoiceSettingsTab";

const TABS = [
  { id: "chat", label: "AI Chat", icon: FiMessageCircle },
  { id: "ocr", label: "AI OCR", icon: FiEye },
  { id: "asr", label: "AI ASR", icon: FiVolume2 },
  { id: "voice", label: "AI Lồng tiếng", icon: FiMic },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("chat");
  const {
    aiSettings,
    setAiSettings,
    aiSettingsLoading,
    loadingSettings,
    handleSaveAiSettings,
    ocrSettings,
    setOcrSettings,
    ocrSettingsLoading,
    handleSaveOcrSettings,
    asrSettings,
    setAsrSettings,
    asrSettingsLoading,
    handleSaveAsrSettings,
    voiceSettings,
    setVoiceSettings,
    voiceSettingsLoading,
    handleSaveVoiceSettings,
  } = useSettingsPage();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <div className="mb-5">
        <div className="flex items-center gap-2.5 mb-1.5">
          <FiSettings className="text-2xl text-gray-700" />
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Cài đặt hệ thống
          </h1>
        </div>
        <p className="text-gray-500 text-xs">
          Quản lý và cấu hình các thiết lập của hệ thống D2MBox.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Icon className="text-base" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        {loadingSettings ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="animate-spin text-primary text-2xl" />
            <span className="ml-3 text-gray-600">Đang tải cài đặt...</span>
          </div>
        ) : (
          <>
            {activeTab === "chat" && (
              <AISettingsTab
                settings={aiSettings}
                setSettings={setAiSettings}
                loading={aiSettingsLoading}
                onSave={handleSaveAiSettings}
              />
            )}
            {activeTab === "ocr" && (
              <AIOCRSettingsTab
                settings={ocrSettings}
                setSettings={setOcrSettings}
                loading={ocrSettingsLoading}
                onSave={handleSaveOcrSettings}
              />
            )}
            {activeTab === "asr" && (
              <AIASRSettingsTab
                settings={asrSettings}
                setSettings={setAsrSettings}
                loading={asrSettingsLoading}
                onSave={handleSaveAsrSettings}
              />
            )}
            {activeTab === "voice" && (
              <AIVoiceSettingsTab
                settings={voiceSettings}
                setSettings={setVoiceSettings}
                loading={voiceSettingsLoading}
                onSave={handleSaveVoiceSettings}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

