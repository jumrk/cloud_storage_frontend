"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  FiMic,
  FiUpload,
  FiPlus,
  FiTrash2,
  FiUser,
  FiMusic,
  FiDownload,
  FiChevronDown,
  FiPlay,
  FiPause,
  FiSettings,
  FiFileText,
  FiUsers,
  FiSave,
  FiShare2,
  FiClock,
  FiVolume2,
  FiSliders,
  FiFilter,
  FiSearch,
  FiStar,
  FiList,
  FiGrid,
  FiMaximize2,
  FiMinimize2,
  FiEdit3,
  FiCopy,
  FiRotateCw,
  FiZap,
  FiLayers,
  FiTarget,
  FiLoader,
} from "react-icons/fi";
import { useTranslations } from "next-intl";
import Popover from "@/shared/ui/Popover";
import aiVoicePublicService from "../services/aiVoicePublicService";
import voiceoverService from "../services/voiceoverService";

const LANGUAGES = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "th", name: "ไทย", flag: "🇹🇭" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Svenska", flag: "🇸🇪" },
];

const PROVIDERS = [
  { code: "all", name: "Tất cả nhà cung cấp" },
  { code: "elevenlabs", name: "ElevenLabs" },
  { code: "openai", name: "OpenAI" },
  { code: "google", name: "Google Cloud" },
  { code: "amazon", name: "Amazon Polly" },
  { code: "microsoft", name: "Microsoft Azure" },
  { code: "custom", name: "Giọng tùy chỉnh" },
];

const MODELS = [
  { code: "all", name: "Tất cả model" },
  { code: "turbo", name: "Turbo" },
  { code: "standard", name: "Standard" },
  { code: "multilingual", name: "Multilingual" },
  { code: "neural", name: "Neural" },
  { code: "classic", name: "Classic" },
];

export default function VoiceoverPage() {
  const t = useTranslations();

  // Layout states
  const [rightPanelTab, setRightPanelTab] = useState("voices"); // voices, settings, mixer
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [characterPanelCollapsed, setCharacterPanelCollapsed] = useState(false);
  const [rightPanelContentAnimate, setRightPanelContentAnimate] =
    useState(true); // Start visible if panel is open
  const [characterPanelContentAnimate, setCharacterPanelContentAnimate] =
    useState(true); // Start visible if panel is open

  // Trigger content animation after right panel opens
  useEffect(() => {
    if (!rightPanelCollapsed) {
      // Reset animation state first
      setRightPanelContentAnimate(false);
      // Wait for panel transition to complete (300ms) then animate content
      const timer = setTimeout(() => {
        setRightPanelContentAnimate(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setRightPanelContentAnimate(false);
    }
  }, [rightPanelCollapsed]);

  // Trigger content animation after character panel opens
  useEffect(() => {
    if (!characterPanelCollapsed) {
      // Reset animation state first
      setCharacterPanelContentAnimate(false);
      // Wait for panel transition to complete (300ms) then animate content
      const timer = setTimeout(() => {
        setCharacterPanelContentAnimate(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCharacterPanelContentAnimate(false);
    }
  }, [characterPanelCollapsed]);

  // Mode: "single", "character"
  const [mode, setMode] = useState("character");

  // Project state
  const [projectName, setProjectName] = useState("Dự án mới");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // seconds

  // Text editor state
  const [editorMode, setEditorMode] = useState("text"); // text, ssml
  const [mainText, setMainText] = useState("");

  // Character mode
  const [characters, setCharacters] = useState([
    {
      id: 1,
      name: "Nhân vật 1",
      voice: null,
      color: "#3b82f6",
      emotion: "neutral",
    },
    {
      id: 2,
      name: "Nhân vật 2",
      voice: null,
      color: "#10b981",
      emotion: "neutral",
    },
  ]);
  const [segments, setSegments] = useState([
    {
      id: 1,
      characterId: 1,
      text: "Xin chào, tôi là nhân vật đầu tiên trong câu chuyện này.",
      startTime: 0,
      duration: 3.5,
    },
    {
      id: 2,
      characterId: 2,
      text: "Rất vui được gặp bạn. Tôi là nhân vật thứ hai.",
      startTime: 3.5,
      duration: 3.2,
    },
    {
      id: 3,
      characterId: 1,
      text: "Hôm nay chúng ta sẽ cùng nhau khám phá những điều thú vị.",
      startTime: 6.7,
      duration: 4.1,
    },
  ]);

  // Voice library state
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceFilters, setVoiceFilters] = useState({
    language: "all",
    gender: "all",
    style: "all",
  });
  const [voiceView, setVoiceView] = useState("grid"); // grid, list

  // Provider and Model selection (not filter)
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [basicFiltersExpanded, setBasicFiltersExpanded] = useState(true);

  // Voices from API
  const [apiVoices, setApiVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [previewingVoiceId, setPreviewingVoiceId] = useState(null);

  // Popover states
  const [openCharacterSelect, setOpenCharacterSelect] = useState({}); // { segmentId: boolean }
  const [openLanguageFilter, setOpenLanguageFilter] = useState(false);
  const [openGenderFilter, setOpenGenderFilter] = useState(false);
  const [openProviderSelect, setOpenProviderSelect] = useState(false);
  const [openModelSelect, setOpenModelSelect] = useState(false);

  // Load available providers and models from backend
  useEffect(() => {
    const loadVoiceSettings = async () => {
      try {
        const response = await aiVoicePublicService.getPublicSettings();
        if (response.success && response.data?.enabled) {
          setAvailableProviders(response.data.providers || []);
          // Auto-select first provider and model if available
          if (response.data.providers.length > 0) {
            const firstProvider = response.data.providers[0];
            setSelectedProvider(firstProvider.code);
            if (firstProvider.models.length > 0) {
              setSelectedModel(firstProvider.models[0].code);
            }
          }
        }
      } catch (error) {
        console.error("Error loading voice settings:", error);
      }
    };
    loadVoiceSettings();
  }, []);

  // Load voices from API when provider/model changes
  useEffect(() => {
    const loadVoices = async () => {
      if (!selectedProvider || !selectedModel) {
        setApiVoices([]);
        return;
      }

      setVoicesLoading(true);
      try {
        const response = await voiceoverService.getVoices(
          selectedProvider,
          selectedModel
        );
        if (response.success && response.data?.voices) {
          setApiVoices(response.data.voices);
        } else {
          setApiVoices([]);
        }
      } catch (error) {
        console.error("Error loading voices:", error);
        setApiVoices([]);
      } finally {
        setVoicesLoading(false);
      }
    };

    loadVoices();
  }, [selectedProvider, selectedModel]);
  const [favoriteVoices, setFavoriteVoices] = useState([]);

  // Selected states
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Audio settings
  const [audioSettings, setAudioSettings] = useState({
    speed: 1.0,
    pitch: 0,
    volume: 100,
    stability: 50,
    clarity: 75,
  });

  // Background music
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const [musicVolume, setMusicVolume] = useState(30);

  const fileInputRef = useRef(null);

  // Generate waveform heights on client-side only (avoid hydration mismatch)
  const [waveformHeights, setWaveformHeights] = useState([]);

  useEffect(() => {
    // Only generate random heights on client-side after mount
    setWaveformHeights(Array.from({ length: 100 }, () => Math.random() * 100));
  }, []);

  // Add character
  const handleAddCharacter = () => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
    ];
    setCharacters([
      ...characters,
      {
        id: Date.now(),
        name: `Nhân vật ${characters.length + 1}`,
        voice: null,
        color: colors[characters.length % colors.length],
        emotion: "neutral",
      },
    ]);
  };

  // Remove character
  const handleRemoveCharacter = (id) => {
    if (characters.length > 1) {
      setCharacters(characters.filter((char) => char.id !== id));
    }
  };

  // Add segment
  const handleAddSegment = () => {
    const lastSegment = segments[segments.length - 1];
    const newStartTime = lastSegment
      ? lastSegment.startTime + lastSegment.duration
      : 0;

    setSegments([
      ...segments,
      {
        id: Date.now(),
        characterId: characters[0]?.id,
        text: "",
        startTime: newStartTime,
        duration: 3,
      },
    ]);
  };

  // Toggle favorite voice
  const handleToggleFavorite = (voiceId) => {
    setFavoriteVoices((prev) =>
      prev.includes(voiceId)
        ? prev.filter((id) => id !== voiceId)
        : [...prev, voiceId]
    );
  };

  // Helper function to extract gender from API voice description
  const extractGender = (voice) => {
    if (voice.gender) {
      const genderLower = voice.gender.toLowerCase();
      if (genderLower.includes("male") || genderLower === "m") return "male";
      if (genderLower.includes("female") || genderLower === "f")
        return "female";
    }
    if (voice.description) {
      const descLower = voice.description.toLowerCase();
      if (descLower.includes("male") || descLower.includes("man"))
        return "male";
      if (descLower.includes("female") || descLower.includes("woman"))
        return "female";
    }
    return null;
  };

  // Helper function to normalize language code
  const normalizeLanguage = (lang) => {
    if (!lang) return null;
    // Extract first 2 characters (e.g., "vi-VN" -> "vi", "en-US" -> "en")
    const langCode = lang.split("-")[0].toLowerCase();
    return langCode;
  };

  // Filter voices (only by language, gender - not provider/model)
  const filteredVoices = apiVoices.filter((voice) => {
    const matchSearch = voice.name
      .toLowerCase()
      .includes(voiceSearch.toLowerCase());

    if (!matchSearch) return false;

    // Language filter
    let matchLanguage = true;
    if (voiceFilters.language !== "all") {
      const voiceLang = normalizeLanguage(voice.language);
      matchLanguage = voiceLang === voiceFilters.language;
    }

    // Gender filter
    let matchGender = true;
    if (voiceFilters.gender !== "all") {
      const voiceGender = voice.gender || extractGender(voice);
      matchGender = voiceGender === voiceFilters.gender;
    }

    return matchLanguage && matchGender;
  });

  // Get selected provider and model info
  const selectedProviderInfo = availableProviders.find(
    (p) => p.code === selectedProvider
  );
  const selectedModelInfo = selectedProviderInfo?.models.find(
    (m) => m.code === selectedModel
  );

  // Handle voice preview
  const handlePreviewVoice = async (voice) => {
    if (!selectedProvider || !voice.id) return;

    setPreviewingVoiceId(voice.id);
    try {
      const previewText = "Xin chào, đây là giọng nói mẫu.";
      const response = await voiceoverService.previewVoice(
        selectedProvider,
        selectedModel,
        voice.id,
        previewText
      );

      if (response.success && response.data?.previewUrl) {
        // Play audio preview
        const audio = new Audio(response.data.previewUrl);
        audio.play();
      } else if (voice.previewUrl) {
        // Use voice's own preview URL (e.g., ElevenLabs)
        const audio = new Audio(voice.previewUrl);
        audio.play();
      }
    } catch (error) {
      console.error("Error previewing voice:", error);
    } finally {
      setTimeout(() => setPreviewingVoiceId(null), 2000);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-brand-500 p-2 rounded-lg">
              <FiMic className="text-lg text-white" />
            </div>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2"
            />
          </div>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <FiSave className="text-xs" />
            Đã lưu 2 phút trước
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-2">
            <FiRotateCw className="text-sm" />
            Lịch sử
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-2">
            <FiShare2 className="text-sm" />
            Chia sẻ
          </button>
          <button className="px-4 py-1.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition flex items-center gap-2">
            <FiDownload className="text-sm" />
            Xuất file
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mode Tabs */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
            <button
              onClick={() => setMode("single")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
                mode === "single"
                  ? "bg-brand-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FiFileText className="text-base" />
              Đơn
            </button>
            <button
              onClick={() => setMode("character")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
                mode === "character"
                  ? "bg-brand-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FiUsers className="text-base" />
              Đa
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() =>
                  setEditorMode(editorMode === "text" ? "ssml" : "text")
                }
                className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded transition flex items-center gap-1"
              >
                <FiZap className="text-xs" />
                {editorMode === "text" ? "SSML" : "Text"}
              </button>
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Text Editor - Only show in single mode */}
            {mode === "single" && (
              <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                <div className="p-4 bg-white border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {editorMode === "ssml" ? "SSML Editor" : "Text Editor"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {mainText.length} ký tự
                      </span>
                      <button className="p-1.5 hover:bg-gray-100 rounded transition">
                        <FiCopy className="text-sm text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={mainText}
                    onChange={(e) => setMainText(e.target.value)}
                    placeholder={
                      editorMode === "ssml"
                        ? '<speak>Nhập văn bản SSML... <break time="1s"/> Sử dụng các thẻ để điều chỉnh giọng nói.</speak>'
                        : "Nhập văn bản cần lồng tiếng..."
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
                    rows={20}
                  />
                </div>
              </div>
            )}

            {/* Segments List - Only show in multi and character modes */}
            {mode !== "single" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 sidebar-scrollbar">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Đoạn hội thoại ({segments.length})
                  </h3>
                  <button
                    onClick={handleAddSegment}
                    className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition flex items-center gap-1"
                  >
                    <FiPlus className="text-xs" />
                    Thêm
                  </button>
                </div>

                {segments.map((seg, index) => {
                  const char = characters.find((c) => c.id === seg.characterId);
                  const isSelected = selectedSegment === seg.id;

                  return (
                    <div
                      key={seg.id}
                      className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                        isSelected
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedSegment(seg.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                          style={{ backgroundColor: char?.color || "#gray" }}
                        >
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isCurrentlyOpen =
                                    openCharacterSelect[seg.id];
                                  // Close all other popovers and toggle current one
                                  const newState = {};
                                  Object.keys(openCharacterSelect).forEach(
                                    (id) => {
                                      newState[id] = false;
                                    }
                                  );
                                  newState[seg.id] = !isCurrentlyOpen;
                                  setOpenCharacterSelect(newState);
                                }}
                                className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white hover:bg-gray-50 transition flex items-center gap-1 min-w-[100px]"
                              >
                                <span className="flex-1 text-left">
                                  {characters.find(
                                    (c) => c.id === seg.characterId
                                  )?.name || "Chọn nhân vật"}
                                </span>
                                <FiChevronDown className="text-xs" />
                              </button>
                              <Popover
                                open={openCharacterSelect[seg.id] || false}
                                className="w-48 max-h-60 overflow-y-auto sidebar-scrollbar"
                              >
                                <div className="space-y-1">
                                  {characters.map((char) => (
                                    <button
                                      key={char.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const updated = segments.map((s) =>
                                          s.id === seg.id
                                            ? { ...s, characterId: char.id }
                                            : s
                                        );
                                        setSegments(updated);
                                        // Close all popovers
                                        const newState = {};
                                        Object.keys(
                                          openCharacterSelect
                                        ).forEach((id) => {
                                          newState[id] = false;
                                        });
                                        setOpenCharacterSelect(newState);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition ${
                                        seg.characterId === char.id
                                          ? "bg-brand-50 text-brand-700 font-medium"
                                          : "hover:bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {char.name}
                                    </button>
                                  ))}
                                </div>
                              </Popover>
                            </div>

                            <span className="text-xs text-gray-500">
                              {formatTime(seg.startTime)} ({seg.duration}s)
                            </span>

                            {char?.voice && (
                              <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                                {char.voice.name}
                              </span>
                            )}
                          </div>

                          <textarea
                            value={seg.text}
                            onChange={(e) => {
                              const updated = segments.map((s) =>
                                s.id === seg.id
                                  ? { ...s, text: e.target.value }
                                  : s
                              );
                              setSegments(updated);
                            }}
                            placeholder="Nhập nội dung..."
                            className="w-full text-sm text-gray-900 bg-transparent border-none focus:outline-none resize-none"
                            rows={2}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSegments(
                              segments.filter((s) => s.id !== seg.id)
                            );
                          }}
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Character Management Panel - Only show in character mode */}
            {mode === "character" && (
              <div
                className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 overflow-hidden ${
                  characterPanelCollapsed ? "w-14" : "w-80"
                }`}
              >
                <div
                  className={`border-b border-gray-200 flex-shrink-0 flex items-center justify-center ${
                    characterPanelCollapsed ? "py-3" : "px-4 py-3"
                  }`}
                >
                  {!characterPanelCollapsed && (
                    <div className="flex items-center justify-between flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        Nhân vật ({characters.length})
                      </h3>
                      <button
                        onClick={handleAddCharacter}
                        className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition flex items-center gap-1 flex-shrink-0 ml-2"
                      >
                        <FiPlus className="text-xs" />
                        Thêm
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() =>
                      setCharacterPanelCollapsed(!characterPanelCollapsed)
                    }
                    className={`p-1.5 hover:bg-gray-100 rounded transition flex-shrink-0 ${
                      characterPanelCollapsed ? "" : "ml-2"
                    }`}
                    title={
                      characterPanelCollapsed
                        ? "Mở panel nhân vật"
                        : "Đóng panel nhân vật"
                    }
                  >
                    {characterPanelCollapsed ? (
                      <FiUsers className="text-gray-600 text-lg" />
                    ) : (
                      <FiChevronDown className="text-gray-600 transform -rotate-90" />
                    )}
                  </button>
                </div>

                {!characterPanelCollapsed && (
                  <div
                    className={`flex-1 overflow-y-auto p-4 space-y-3 sidebar-scrollbar transition-all duration-500 ease-out ${
                      characterPanelContentAnimate
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    }`}
                  >
                    {characters.map((char) => (
                      <div
                        key={char.id}
                        className={`p-3 rounded-lg border-2 transition cursor-pointer ${
                          selectedCharacter === char.id
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedCharacter(char.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
                            style={{ backgroundColor: char.color }}
                          >
                            <FiUser className="text-lg" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <input
                              value={char.name}
                              onChange={(e) => {
                                const updated = characters.map((c) =>
                                  c.id === char.id
                                    ? { ...c, name: e.target.value }
                                    : c
                                );
                                setCharacters(updated);
                              }}
                              className="w-full text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none mb-2"
                              onClick={(e) => e.stopPropagation()}
                            />

                            {char.voice ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <FiMic className="text-xs text-brand-600" />
                                  <span className="text-xs text-gray-900">
                                    {char.voice.name}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCharacter(char.id);
                                  }}
                                  className="text-xs text-brand-600 hover:text-brand-700"
                                >
                                  Đổi giọng
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCharacter(char.id);
                                }}
                                className="text-xs text-gray-600 hover:text-brand-600 flex items-center gap-1"
                              >
                                <FiPlus className="text-xs" />
                                Chọn giọng nói
                              </button>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCharacter(char.id);
                            }}
                            disabled={characters.length === 1}
                            className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Voice Library & Settings */}
        <div
          className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 overflow-hidden ${
            rightPanelCollapsed ? "w-14" : "w-96"
          }`}
        >
          {/* Toggle Button */}
          <div
            className={`border-b border-gray-200 flex items-center flex-shrink-0 ${
              rightPanelCollapsed
                ? "justify-center py-3"
                : "justify-between px-4 py-3"
            }`}
          >
            {!rightPanelCollapsed && (
              <h3 className="text-sm font-semibold text-gray-900">Giọng nói</h3>
            )}
            <button
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="p-1.5 hover:bg-gray-100 rounded transition"
              title={rightPanelCollapsed ? "Mở panel" : "Đóng panel"}
            >
              {rightPanelCollapsed ? (
                <FiMic className="text-gray-600 text-lg" />
              ) : (
                <FiChevronDown className="text-gray-600 transform rotate-90" />
              )}
            </button>
          </div>

          {/* Right Panel Tabs */}
          {!rightPanelCollapsed && (
            <div
              className={`flex-1 flex flex-col overflow-hidden min-h-0 transition-all duration-500 ease-out ${
                rightPanelContentAnimate
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <div className="border-b border-gray-200 flex flex-shrink-0">
                <button
                  onClick={() => setRightPanelTab("voices")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    rightPanelTab === "voices"
                      ? "text-brand-600 border-b-2 border-brand-600 bg-brand-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FiMic className="inline text-base mr-2" />
                  Giọng nói
                </button>
                <button
                  onClick={() => setRightPanelTab("settings")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    rightPanelTab === "settings"
                      ? "text-brand-600 border-b-2 border-brand-600 bg-brand-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FiSliders className="inline text-base mr-2" />
                  Cài đặt
                </button>
                <button
                  onClick={() => setRightPanelTab("mixer")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    rightPanelTab === "mixer"
                      ? "text-brand-600 border-b-2 border-brand-600 bg-brand-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FiVolume2 className="inline text-base mr-2" />
                  Mixer
                </button>
              </div>

              {/* Voice Library Tab */}
              {rightPanelTab === "voices" && (
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {/* Search & Filters */}
                  <div className="p-4 space-y-3 border-b border-gray-200 flex-shrink-0">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        value={voiceSearch}
                        onChange={(e) => setVoiceSearch(e.target.value)}
                        placeholder="Tìm giọng nói..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    {/* Basic Filters - Collapsible */}
                    <div className="border-t border-gray-200 pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setBasicFiltersExpanded(!basicFiltersExpanded)
                        }
                        className="w-full flex items-center justify-between text-xs text-gray-600 hover:text-gray-900 transition mb-2"
                      >
                        <span className="flex items-center gap-2">
                          <FiFilter className="text-sm" />
                          Bộ lọc
                        </span>
                        <FiChevronDown
                          className={`text-xs transition-transform ${
                            basicFiltersExpanded ? "transform rotate-180" : ""
                          }`}
                        />
                      </button>

                      {basicFiltersExpanded && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenLanguageFilter(!openLanguageFilter)
                                }
                                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white hover:bg-gray-50 transition flex items-center justify-between"
                              >
                                <span>
                                  {voiceFilters.language === "all"
                                    ? "Tất cả ngôn ngữ"
                                    : LANGUAGES.find(
                                        (l) => l.code === voiceFilters.language
                                      )?.flag +
                                      " " +
                                      LANGUAGES.find(
                                        (l) => l.code === voiceFilters.language
                                      )?.name}
                                </span>
                                <FiChevronDown className="text-xs" />
                              </button>
                              <Popover
                                open={openLanguageFilter}
                                className="w-full max-h-60 overflow-y-auto sidebar-scrollbar"
                              >
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVoiceFilters({
                                        ...voiceFilters,
                                        language: "all",
                                      });
                                      setOpenLanguageFilter(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition ${
                                      voiceFilters.language === "all"
                                        ? "bg-brand-50 text-brand-700 font-medium"
                                        : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    Tất cả ngôn ngữ
                                  </button>
                                  {LANGUAGES.map((lang) => (
                                    <button
                                      key={lang.code}
                                      type="button"
                                      onClick={() => {
                                        setVoiceFilters({
                                          ...voiceFilters,
                                          language: lang.code,
                                        });
                                        setOpenLanguageFilter(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition ${
                                        voiceFilters.language === lang.code
                                          ? "bg-brand-50 text-brand-700 font-medium"
                                          : "hover:bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {lang.flag} {lang.name}
                                    </button>
                                  ))}
                                </div>
                              </Popover>
                            </div>

                            <div className="relative flex-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenGenderFilter(!openGenderFilter)
                                }
                                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white hover:bg-gray-50 transition flex items-center justify-between"
                              >
                                <span>
                                  {voiceFilters.gender === "all"
                                    ? "Giới tính"
                                    : voiceFilters.gender === "male"
                                    ? "Nam"
                                    : "Nữ"}
                                </span>
                                <FiChevronDown className="text-xs" />
                              </button>
                              <Popover
                                open={openGenderFilter}
                                className="w-full max-h-60 overflow-y-auto sidebar-scrollbar"
                              >
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVoiceFilters({
                                        ...voiceFilters,
                                        gender: "all",
                                      });
                                      setOpenGenderFilter(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition ${
                                      voiceFilters.gender === "all"
                                        ? "bg-brand-50 text-brand-700 font-medium"
                                        : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    Giới tính
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVoiceFilters({
                                        ...voiceFilters,
                                        gender: "male",
                                      });
                                      setOpenGenderFilter(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition ${
                                      voiceFilters.gender === "male"
                                        ? "bg-brand-50 text-brand-700 font-medium"
                                        : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    Nam
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVoiceFilters({
                                        ...voiceFilters,
                                        gender: "female",
                                      });
                                      setOpenGenderFilter(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition ${
                                      voiceFilters.gender === "female"
                                        ? "bg-brand-50 text-brand-700 font-medium"
                                        : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    Nữ
                                  </button>
                                </div>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-600">Hiển thị:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setVoiceView("grid")}
                          className={`p-1.5 rounded transition ${
                            voiceView === "grid"
                              ? "bg-brand-500 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <FiGrid className="text-sm" />
                        </button>
                        <button
                          onClick={() => setVoiceView("list")}
                          className={`p-1.5 rounded transition ${
                            voiceView === "list"
                              ? "bg-brand-500 text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <FiList className="text-sm" />
                        </button>
                      </div>
                    </div>

                    {/* Provider & Model Selection - Collapsible */}
                    <div className="border-t border-gray-200 pt-3">
                      <button
                        type="button"
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        className="w-full flex items-center justify-between text-xs text-gray-600 hover:text-gray-900 transition"
                      >
                        <span className="flex items-center gap-2">
                          <FiSettings className="text-sm" />
                          Lựa chọn nhà cung cấp
                        </span>
                        <FiChevronDown
                          className={`text-xs transition-transform ${
                            filtersExpanded ? "transform rotate-180" : ""
                          }`}
                        />
                      </button>

                      {filtersExpanded && (
                        <div className="mt-3 space-y-2 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenProviderSelect(!openProviderSelect)
                                }
                                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white hover:bg-gray-50 transition flex items-center justify-between"
                              >
                                <span>
                                  {selectedProviderInfo?.name ||
                                    "Chọn nhà cung cấp"}
                                </span>
                                <FiChevronDown className="text-xs" />
                              </button>
                              <Popover
                                open={openProviderSelect}
                                className="w-full max-h-60 overflow-y-auto sidebar-scrollbar"
                              >
                                <div className="space-y-1">
                                  {availableProviders.map((provider) => (
                                    <button
                                      key={provider.code}
                                      type="button"
                                      onClick={() => {
                                        setSelectedProvider(provider.code);
                                        // Auto-select first model of selected provider
                                        if (provider.models.length > 0) {
                                          setSelectedModel(
                                            provider.models[0].code
                                          );
                                        }
                                        setOpenProviderSelect(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition ${
                                        selectedProvider === provider.code
                                          ? "bg-brand-50 text-brand-700 font-medium"
                                          : "hover:bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {provider.name}
                                    </button>
                                  ))}
                                </div>
                              </Popover>
                            </div>

                            <div className="relative flex-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenModelSelect(!openModelSelect)
                                }
                                disabled={!selectedProvider}
                                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white hover:bg-gray-50 transition flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span>
                                  {selectedModelInfo?.name || "Chọn model"}
                                </span>
                                <FiChevronDown className="text-xs" />
                              </button>
                              <Popover
                                open={openModelSelect}
                                className="w-full max-h-60 overflow-y-auto sidebar-scrollbar"
                              >
                                <div className="space-y-1">
                                  {selectedProviderInfo?.models.map((model) => (
                                    <button
                                      key={model.code}
                                      type="button"
                                      onClick={() => {
                                        setSelectedModel(model.code);
                                        setOpenModelSelect(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs rounded-lg transition ${
                                        selectedModel === model.code
                                          ? "bg-brand-50 text-brand-700 font-medium"
                                          : "hover:bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {model.name}
                                    </button>
                                  ))}
                                </div>
                              </Popover>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Voice List */}
                  <div className="flex-1 overflow-y-auto p-4 sidebar-scrollbar min-h-0 h-0">
                    {voicesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <FiLoader className="animate-spin text-brand-500 text-xl mr-2" />
                        <span className="text-sm text-gray-600">
                          Đang tải giọng nói...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div
                          className={
                            voiceView === "grid"
                              ? "grid grid-cols-2 gap-3"
                              : "space-y-2"
                          }
                        >
                          {filteredVoices.map((voice) => {
                            const isFavorite = favoriteVoices.includes(
                              voice.id
                            );
                            const isPreviewing = previewingVoiceId === voice.id;

                            return (
                              <div
                                key={voice.id}
                                className={`p-3 rounded-lg border-2 transition cursor-pointer group ${
                                  selectedVoice?.id === voice.id
                                    ? "border-brand-500 bg-brand-50"
                                    : "border-gray-200 bg-white hover:border-brand-300"
                                }`}
                                onClick={() => {
                                  setSelectedVoice(voice);
                                  if (selectedCharacter) {
                                    const updated = characters.map((c) =>
                                      c.id === selectedCharacter
                                        ? { ...c, voice }
                                        : c
                                    );
                                    setCharacters(updated);
                                  }
                                }}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {voice.name}
                                    </h4>
                                    {voice.description && (
                                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                                        {voice.description}
                                      </p>
                                    )}
                                    {voice.rating && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <FiStar
                                          className="text-xs text-yellow-500"
                                          fill="currentColor"
                                        />
                                        <span className="text-xs text-gray-600">
                                          {voice.rating}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(voice.id);
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded transition"
                                  >
                                    <FiStar
                                      className={`text-sm ${
                                        isFavorite
                                          ? "text-yellow-500 fill-current"
                                          : "text-gray-400"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {/* Tags - Only show if available */}
                                {(voice.gender ||
                                  voice.language ||
                                  voice.style ||
                                  voice.category) && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {voice.gender && (
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded ${
                                          voice.gender === "male" ||
                                          voice.gender === "Male"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-pink-100 text-pink-700"
                                        }`}
                                      >
                                        {voice.gender === "male" ||
                                        voice.gender === "Male"
                                          ? "Nam"
                                          : "Nữ"}
                                      </span>
                                    )}
                                    {voice.language && (
                                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                        {typeof voice.language === "string"
                                          ? voice.language.toUpperCase()
                                          : voice.language}
                                      </span>
                                    )}
                                    {(voice.style || voice.category) && (
                                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                                        {voice.style || voice.category}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewVoice(voice);
                                  }}
                                  disabled={isPreviewing}
                                  className="w-full py-1.5 text-xs text-brand-600 hover:bg-brand-50 rounded transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isPreviewing ? (
                                    <>
                                      <FiLoader className="animate-spin text-xs" />
                                      Đang phát...
                                    </>
                                  ) : (
                                    <>
                                      <FiPlay className="text-xs" />
                                      Nghe thử
                                    </>
                                  )}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {filteredVoices.length === 0 && !voicesLoading && (
                          <div className="text-center py-12">
                            {!selectedProvider || !selectedModel ? (
                              <div className="space-y-2">
                                <FiMic className="mx-auto text-4xl text-gray-300" />
                                <p className="text-sm text-gray-500">
                                  Vui lòng chọn nhà cung cấp và model để xem
                                  danh sách giọng nói
                                </p>
                              </div>
                            ) : apiVoices.length === 0 ? (
                              <div className="space-y-2">
                                <FiMic className="mx-auto text-4xl text-gray-300" />
                                <p className="text-sm text-gray-500">
                                  Không có giọng nói nào từ nhà cung cấp này
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <FiFilter className="mx-auto text-4xl text-gray-300" />
                                <p className="text-sm text-gray-500">
                                  Không tìm thấy giọng nói phù hợp với bộ lọc
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {rightPanelTab === "settings" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scrollbar min-h-0 h-0">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Tốc độ:{" "}
                      <span className="text-brand-600">
                        {audioSettings.speed}x
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.25"
                      max="4"
                      step="0.25"
                      value={audioSettings.speed}
                      onChange={(e) =>
                        setAudioSettings({
                          ...audioSettings,
                          speed: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>0.25x</span>
                      <span>1x</span>
                      <span>4x</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Cao độ:{" "}
                      <span className="text-brand-600">
                        {audioSettings.pitch}
                      </span>
                    </label>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={audioSettings.pitch}
                      onChange={(e) =>
                        setAudioSettings({
                          ...audioSettings,
                          pitch: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>-12</span>
                      <span>0</span>
                      <span>+12</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Âm lượng:{" "}
                      <span className="text-brand-600">
                        {audioSettings.volume}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={audioSettings.volume}
                      onChange={(e) =>
                        setAudioSettings({
                          ...audioSettings,
                          volume: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Độ ổn định:{" "}
                      <span className="text-brand-600">
                        {audioSettings.stability}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={audioSettings.stability}
                      onChange={(e) =>
                        setAudioSettings({
                          ...audioSettings,
                          stability: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Độ ổn định cao = giọng nhất quán hơn
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Độ rõ ràng:{" "}
                      <span className="text-brand-600">
                        {audioSettings.clarity}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={audioSettings.clarity}
                      onChange={(e) =>
                        setAudioSettings({
                          ...audioSettings,
                          clarity: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">
                      Độ rõ ràng cao = giọng sắc nét hơn
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-900 mb-3">
                      Định dạng xuất
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="format" defaultChecked />
                        <span className="text-sm text-gray-700">
                          MP3 (320kbps)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="format" />
                        <span className="text-sm text-gray-700">
                          WAV (lossless)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="format" />
                        <span className="text-sm text-gray-700">
                          FLAC (lossless)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Mixer Tab */}
              {rightPanelTab === "mixer" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scrollbar min-h-0 h-0">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiVolume2 className="text-base" />
                      Voice Track
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-20">
                          Volume:
                        </span>
                        <input
                          type="range"
                          className="flex-1"
                          defaultValue="100"
                        />
                        <span className="text-xs text-gray-900 w-10 text-right">
                          100%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-20">Pan:</span>
                        <input
                          type="range"
                          className="flex-1"
                          min="-50"
                          max="50"
                          defaultValue="0"
                        />
                        <span className="text-xs text-gray-900 w-10 text-right">
                          Center
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiMusic className="text-base" />
                      Background Music
                    </h4>

                    {!backgroundMusic ? (
                      <button className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-brand-500 hover:text-brand-600 transition flex items-center justify-center gap-2">
                        <FiUpload />
                        Tải nhạc nền lên
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            Background Music.mp3
                          </p>
                          <button className="text-xs text-red-500 hover:text-red-700">
                            Xóa
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-20">
                              Volume:
                            </span>
                            <input
                              type="range"
                              className="flex-1"
                              value={musicVolume}
                              onChange={(e) =>
                                setMusicVolume(Number(e.target.value))
                              }
                            />
                            <span className="text-xs text-gray-900 w-10 text-right">
                              {musicVolume}%
                            </span>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" defaultChecked />
                            <span className="text-xs text-gray-700">
                              Auto-ducking (giảm nhạc khi có giọng)
                            </span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" />
                            <span className="text-xs text-gray-700">
                              Loop nhạc nền
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-900 mb-3">
                      Audio Effects
                    </h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" />
                        <span className="text-xs text-gray-700">
                          Reverb (Hall)
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" />
                        <span className="text-xs text-gray-700">
                          Compressor
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked />
                        <span className="text-xs text-gray-700">
                          Noise Reduction
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Playback Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 bg-brand-500 text-white rounded-full flex items-center justify-center hover:bg-brand-600 transition"
        >
          {isPlaying ? (
            <FiPause className="text-lg" />
          ) : (
            <FiPlay className="text-lg ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <div className="relative h-1.5 bg-gray-200 rounded-full cursor-pointer">
            <div
              className="absolute h-full bg-brand-500 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="h-6 w-px bg-gray-300" />

          <div className="flex items-center gap-2">
            <FiTarget className="text-base" />
            <span className="text-xs">
              {
                segments.filter((s) => {
                  const char = characters.find((c) => c.id === s.characterId);
                  return char?.voice;
                }).length
              }
              /{segments.length} đoạn đã có giọng
            </span>
          </div>

          <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition flex items-center gap-2">
            <FiZap className="text-base" />
            Tạo giọng nói
          </button>
        </div>
      </div>
    </div>
  );
}
