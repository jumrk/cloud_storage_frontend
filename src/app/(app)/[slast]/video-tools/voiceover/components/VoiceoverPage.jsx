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
import toast from "react-hot-toast";
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
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true);
  const [characterPanelCollapsed, setCharacterPanelCollapsed] = useState(true);
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
  const [mode, setMode] = useState("single");

  // Project state
  const [projectName, setProjectName] = useState("Lồng tiếng đơn");

  // Auto-update project name when mode changes
  useEffect(() => {
    if (mode === "single") {
      setProjectName("Lồng tiếng đơn");
    } else if (mode === "character") {
      setProjectName("Lồng tiếng đa");
    }
  }, [mode]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120); // seconds

  // Text editor state
  const [editorMode, setEditorMode] = useState("text"); // text, ssml
  const [mainText, setMainText] = useState("");

  // Character mode
  const [characters, setCharacters] = useState([]);
  const [segments, setSegments] = useState([]);

  // Generated audio for each segment (multi-character mode)
  const [segmentAudios, setSegmentAudios] = useState({}); // { segmentId: { url, duration, voiceId } }
  const [generatingSegments, setGeneratingSegments] = useState(new Set()); // Track which segments are generating

  // Settings for each segment
  const [segmentSettings, setSegmentSettings] = useState({}); // { segmentId: { speed, pitch, volume } }

  // Merged audio for all segments (for stable playback)
  const [mergedAudio, setMergedAudio] = useState(null); // { url, duration }
  const [mergingAudio, setMergingAudio] = useState(false);

  // Multi-segment audio player state
  const [multiPlayerState, setMultiPlayerState] = useState({
    isPlaying: false,
    currentSegmentIndex: -1, // -1 means not playing
    currentTime: 0,
    totalDuration: 0,
    pausedSegmentTime: 0, // Track paused time within current segment for resume
  });
  const currentSegmentAudioRef = useRef(null); // For playing current segment in multi mode
  const mergedAudioRef = useRef(null); // For playing merged audio

  // Voice library state
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceFilters, setVoiceFilters] = useState({
    language: "all",
    gender: "all",
    style: "all",
  });
  const [voiceView, setVoiceView] = useState("grid"); // grid, list

  // Custom prompt for Gemini
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  // Provider and Model selection (not filter)
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [basicFiltersExpanded, setBasicFiltersExpanded] = useState(true);
  const [promptExpanded, setPromptExpanded] = useState(false);

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
        toast.error("Không thể tải cài đặt giọng nói");
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
        toast.error("Không thể tải danh sách giọng nói");
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

  // Generated audio state (for single mode)
  const [generatedAudio, setGeneratedAudio] = useState(null); // { url, duration, voiceId, text }
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioPlayerState, setAudioPlayerState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

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
  const [musicAutoDuck, setMusicAutoDuck] = useState(true);
  const [musicLoop, setMusicLoop] = useState(false);
  const musicPlayerRef = useRef(null);
  const [exportFormat, setExportFormat] = useState("mp3");
  const fileInputRef = useRef(null);
  const srtFileInputRef = useRef(null);

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

  // Parse SRT file content
  const parseSRT = (srtContent) => {
    const segments = [];
    const blocks = srtContent.trim().split(/\n\s*\n/); // Split by double newlines
    blocks.forEach((block, index) => {
      const lines = block.trim().split(/\n/);
      if (lines.length < 3) return; // Skip invalid blocks
      // Skip sequence number (first line)
      const timeLine = lines[1];
      const textLines = lines.slice(2);
      // Parse time:"00:00:00,000 --> 00:00:05,000"
      const timeMatch = timeLine.match(
        /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
      );
      if (!timeMatch) return;
      // Convert time to seconds
      const startHours = parseInt(timeMatch[1]);
      const startMinutes = parseInt(timeMatch[2]);
      const startSeconds = parseInt(timeMatch[3]);
      const startMs = parseInt(timeMatch[4]);
      const startTime =
        startHours * 3600 + startMinutes * 60 + startSeconds + startMs / 1000;
      const endHours = parseInt(timeMatch[5]);
      const endMinutes = parseInt(timeMatch[6]);
      const endSeconds = parseInt(timeMatch[7]);
      const endMs = parseInt(timeMatch[8]);
      const endTime =
        endHours * 3600 + endMinutes * 60 + endSeconds + endMs / 1000;
      const duration = endTime - startTime;
      const text = textLines.join("").trim();
      if (text) {
        segments.push({
          id: Date.now() + index,
          characterId: characters[0]?.id || null,
          text: text,
          startTime: startTime,
          duration: Math.max(0.5, duration), // Minimum 0.5 seconds
        });
      }
    });
    return segments;
  };

  // Handle SRT file import
  const handleImportSRT = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Check file extension
    if (!file.name.toLowerCase().endsWith(".srt")) {
      toast.error("Vui lòng chọn file SRT (.srt)");
      return;
    }
    try {
      const text = await file.text();
      const parsedSegments = parseSRT(text);
      if (parsedSegments.length === 0) {
        toast.error("Không tìm thấy đoạn hội thoại trong file SRT");
        return;
      }
      // Replace existing segments with imported ones
      setSegments(parsedSegments);
      toast.success(`Đã import ${parsedSegments.length} đoạn hội thoại từ SRT`);
    } catch (error) {
      console.error("SRT import error:", error);
      toast.error("Lỗi khi đọc file SRT");
    }
    // Reset file input
    event.target.value = "";
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
    if (!selectedProvider || !voice.id) {
      toast.error("Thiếu thông tin provider hoặc voice ID");
      return;
    }
    setPreviewingVoiceId(voice.id);
    try {
      const previewText = "Xin chào, đây là giọng nói mẫu.";
      // Get preview from API
      let audioUrl = null;
      try {
        const response = await voiceoverService.previewVoice(
          selectedProvider,
          selectedModel,
          voice.id,
          previewText
        );
        if (response?.success && response?.data?.previewUrl) {
          audioUrl = response.data.previewUrl;
        } else if (response?.data?.url) {
          audioUrl = response.data.url;
        } else if (response?.previewUrl) {
          audioUrl = response.previewUrl;
        }
      } catch (apiError) {
        // If API fails, try fallback to voice's own preview URL
        if (voice.previewUrl) {
          audioUrl = voice.previewUrl;
        }
      }
      // Fallback to voice's own preview URL if API didn't return one
      if (!audioUrl && voice.previewUrl) {
        audioUrl = voice.previewUrl;
      }
      // If still no URL, try voice.url or voice.audioUrl
      if (!audioUrl) {
        audioUrl = voice.url || voice.audioUrl;
      }
      if (!audioUrl) {
        throw new Error("Không tìm thấy URL preview cho giọng nói này");
      }
      // Validate and normalize URL
      let finalUrl = audioUrl.trim();
      // If URL is relative, make it absolute
      if (
        !finalUrl.startsWith("http://") &&
        !finalUrl.startsWith("https://") &&
        !finalUrl.startsWith("data:")
      ) {
        // Check if it's a relative path
        if (finalUrl.startsWith("/")) {
          // Get base URL from environment or current origin
          const baseUrl =
            process.env.NEXT_PUBLIC_API_BASE || window.location.origin;
          finalUrl = `${baseUrl}${finalUrl}`;
        } else {
          // Invalid URL format
          throw new Error(`Định dạng URL không hợp lệ: ${finalUrl}`);
        }
      }
      // Debug: log URL (only in development)
      if (process.env.NODE_ENV === "development") {
        console.log("Playing audio from:", finalUrl);
      }
      // Create audio element
      const audio = new Audio();
      // For external URLs (like Google Cloud Storage), set crossOrigin
      if (finalUrl.startsWith("http://") || finalUrl.startsWith("https://")) {
        audio.crossOrigin = "anonymous";
      }
      // Track if audio started playing
      let hasStartedPlaying = false;
      // Set up event listeners before setting src
      audio.addEventListener("error", (e) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Audio error:", e, audio.error);
        }
        // If CORS error, try without crossOrigin
        if (!hasStartedPlaying && audio.crossOrigin) {
          audio.crossOrigin = null;
          audio.src = finalUrl;
          audio.load();
          return;
        }
        toast.error("Không thể tải audio. Vui lòng thử lại sau.");
        setPreviewingVoiceId(null);
      });
      audio.addEventListener("canplay", () => {
        hasStartedPlaying = true;
        // Audio can be played
        audio.play().catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.error("Play error:", err);
          }
          toast.error(
            "Không thể phát audio. Vui lòng kiểm tra quyền trình duyệt."
          );
          setPreviewingVoiceId(null);
        });
      });
      audio.addEventListener("ended", () => {
        setPreviewingVoiceId(null);
      });
      // Set source and load
      audio.src = finalUrl;
      audio.load();
    } catch (error) {
      toast.error(error.message || "Không thể tải preview. Vui lòng thử lại.");
      setPreviewingVoiceId(null);
    }
  };

  // Format time
  // Audio player ref
  const audioPlayerRef = useRef(null);

  // Check if can generate voice
  const canGenerateVoice = useMemo(() => {
    if (mode === "single") {
      return (
        mainText.trim().length > 0 &&
        selectedVoice &&
        selectedProvider &&
        selectedModel
      );
    } else {
      // Multi mode: check if there are segments without audio that are ready
      const readySegments = segments.filter((seg) => {
        const hasText = seg.text.trim();
        const char = characters.find((c) => c.id === seg.characterId);
        const hasVoice = char && char.voice;
        const noAudio = !segmentAudios[seg.id];
        return hasText && hasVoice && noAudio;
      });
      return readySegments.length > 0 && selectedProvider && selectedModel;
    }
  }, [
    mode,
    mainText,
    selectedVoice,
    selectedProvider,
    selectedModel,
    segments,
    characters,
    segmentAudios,
  ]);

  // Check if has generated audio
  const hasGeneratedAudio = generatedAudio !== null;

  // Handle generate voice (both single and multi mode)
  const handleGenerateVoice = async () => {
    if (mode === "single") {
      // Single mode logic
      if (!canGenerateVoice) return;
      setIsGenerating(true);
      try {
        // Add language and custom prompt from voice if available (for Gemini)
        const settingsWithLanguage = {
          ...audioSettings,
          language: selectedVoice.language || null,
          // Use custom prompt if enabled, otherwise use default based on language
          customPrompt:
            useCustomPrompt && customPrompt.trim()
              ? customPrompt.trim()
              : selectedVoice.language
              ? getDefaultPrompt(selectedVoice.language)
              : null,
        };
        const response = await voiceoverService.generateVoice(
          selectedProvider,
          selectedModel,
          selectedVoice.id,
          mainText,
          settingsWithLanguage
        );
        if (response.success && response.data?.url) {
          setGeneratedAudio({
            url: response.data.url,
            duration: response.data.duration || 0,
            voiceId: selectedVoice.id,
            text: mainText,
          });
          setAudioPlayerState((prev) => ({
            ...prev,
            duration: response.data.duration || 0,
          }));
          toast.success("Đã tạo giọng nói thành công!");
          // Refresh user data to update credits
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("refreshUserData"));
          }
        } else {
          toast.error(response.error || "Không thể tạo giọng nói");
        }
      } catch (error) {
        console.error("Generate voice error:", error);
        const errorMessage = error.response?.data?.error || error.message || "Lỗi khi tạo giọng nói";
        toast.error(errorMessage);
      } finally {
        setIsGenerating(false);
      }
    } else {
      // Multi mode logic - generate only segments without audio
      const segmentsToGenerate = segments.filter((seg) => {
        const hasText = seg.text.trim();
        const char = characters.find((c) => c.id === seg.characterId);
        const hasVoice = char && char.voice;
        const noAudio = !segmentAudios[seg.id];
        return hasText && hasVoice && noAudio;
      });
      if (segmentsToGenerate.length === 0) {
        toast.error("Tất cả đoạn đã có giọng nói hoặc chưa sẵn sàng");
        return;
      }
      setIsGenerating(true);
      toast.loading(
        `Đang tạo giọng nói cho ${segmentsToGenerate.length} đoạn...`,
        { id: "generate-multi" }
      );
      let successCount = 0;
      // Generate sequentially to avoid rate limiting
      for (let i = 0; i < segmentsToGenerate.length; i++) {
        const segment = segmentsToGenerate[i];
        try {
          await handleGenerateSegmentVoice(segment.id);
          successCount++;
        } catch (error) {
          console.error(`Failed to generate segment ${segment.id}:`, error);
        }
        // Small delay between requests
        if (i < segmentsToGenerate.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
      setIsGenerating(false);
      toast.success(
        `Đã tạo giọng nói cho ${successCount}/${segmentsToGenerate.length} đoạn!`,
        { id: "generate-multi" }
      );
    }
  };

  // Handle generate voice for a segment (multi-character mode)
  const handleGenerateSegmentVoice = async (segmentId) => {
    const segment = segments.find((s) => s.id === segmentId);
    if (!segment || !segment.text.trim()) {
      toast.error("Đoạn hội thoại không có nội dung");
      return;
    }
    const char = characters.find((c) => c.id === segment.characterId);
    if (!char || !char.voice) {
      toast.error("Chưa chọn giọng nói cho nhân vật");
      return;
    }
    if (!selectedProvider || !selectedModel) {
      toast.error("Chưa chọn provider hoặc model");
      return;
    }
    // Add to generating set
    setGeneratingSegments((prev) => new Set([...prev, segmentId]));
    try {
      // Get settings for this segment (or use defaults)
      const segSettings = {
        ...(segmentSettings[segmentId] || {
          speed: audioSettings.speed || 1.0,
          pitch: audioSettings.pitch || 0,
          volume: audioSettings.volume || 100,
        }),
        // Add language and custom prompt from voice if available (for Gemini)
        language: char.voice.language || null,
        // Use custom prompt if enabled, otherwise use default based on language
        customPrompt:
          useCustomPrompt && customPrompt.trim()
            ? customPrompt.trim()
            : char.voice.language
            ? getDefaultPrompt(char.voice.language)
            : null,
      };
      const response = await voiceoverService.generateVoice(
        selectedProvider,
        selectedModel,
        char.voice.id,
        segment.text,
        segSettings
      );
      if (response.success && response.data?.url) {
        setSegmentAudios((prev) => ({
          ...prev,
          [segmentId]: {
            url: response.data.url,
            duration: response.data.duration || 0,
            voiceId: char.voice.id,
            text: segment.text,
          },
        }));
        toast.success(
          `Đã tạo giọng nói cho đoạn ${
            segments.findIndex((s) => s.id === segmentId) + 1
          }!`
        );
        // Refresh user data to update credits
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("refreshUserData"));
        }
      } else {
        toast.error(response.error || "Không thể tạo giọng nói");
      }
    } catch (error) {
      console.error("Generate segment voice error:", error);
      const errorMessage = error.response?.data?.error || error.message || "Lỗi khi tạo giọng nói";
      toast.error(errorMessage);
    } finally {
      setGeneratingSegments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(segmentId);
        return newSet;
      });
    }
  };

  // Get sorted segments (by startTime if available, otherwise by order)
  const getSortedSegments = useMemo(() => {
    return [...segments].sort((a, b) => {
      if (a.startTime !== undefined && b.startTime !== undefined) {
        return a.startTime - b.startTime;
      }
      // If no startTime, maintain original order
      return segments.indexOf(a) - segments.indexOf(b);
    });
  }, [segments]);

  // Get segments with audio (sorted)
  const segmentsWithAudio = useMemo(() => {
    return getSortedSegments.filter((seg) => segmentAudios[seg.id]);
  }, [getSortedSegments, segmentAudios]);

  // Calculate total duration for multi mode
  const totalMultiDuration = useMemo(() => {
    return segmentsWithAudio.reduce((total, seg) => {
      return total + (segmentAudios[seg.id]?.duration || 0);
    }, 0);
  }, [segmentsWithAudio, segmentAudios]);

  // Count segments with audio
  const segmentsWithAudioCount = Object.keys(segmentAudios).length;

  // Auto-merge audio when all segments have audio
  useEffect(() => {
    const shouldMerge =
      mode !== "single" &&
      segmentsWithAudio.length > 0 &&
      segmentsWithAudio.length === segments.length &&
      !mergingAudio &&
      !mergedAudio;
    if (shouldMerge) {
      const mergeAudio = async () => {
        setMergingAudio(true);
        try {
          const segmentsToMerge = segmentsWithAudio.map((seg, index) => ({
            url: segmentAudios[seg.id].url,
            duration: segmentAudios[seg.id].duration || 0,
            order: index,
          }));
          const response = await voiceoverService.mergeSegments(
            segmentsToMerge
          );
          if (response.success && response.data?.url) {
            setMergedAudio({
              url: response.data.url,
              duration: response.data.duration || totalMultiDuration,
            });
            toast.success("Đã ghép audio thành công!");
          } else {
            console.error("Merge failed:", response.error);
            // Don't show error toast, just fallback to segment-by-segment playback
          }
        } catch (error) {
          console.error("Merge audio error:", error);
          // Don't show error toast, just fallback to segment-by-segment playback
        } finally {
          setMergingAudio(false);
        }
      };
      mergeAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    segmentsWithAudio.length,
    segments.length,
    mergingAudio,
    mergedAudio,
  ]);

  // Reset merged audio when segments change (but not when segmentAudios update - that's handled by merge logic)
  useEffect(() => {
    if (mode !== "single") {
      // Only reset when segments array itself changes (added/removed segments)
      setMergedAudio(null);
      // Stop any playing audio
      if (mergedAudioRef.current) {
        mergedAudioRef.current.pause();
        mergedAudioRef.current.src = "";
      }
      if (currentSegmentAudioRef.current) {
        currentSegmentAudioRef.current.pause();
        currentSegmentAudioRef.current.src = "";
      }
      setMultiPlayerState({
        isPlaying: false,
        currentSegmentIndex: -1,
        currentTime: 0,
        totalDuration: 0,
        pausedSegmentTime: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments.length, mode]); // Only depend on segments.length, not segmentAudios

  // Handle play/pause for multi mode
  const handleTogglePlayMulti = () => {
    if (segmentsWithAudio.length === 0) {
      toast.error("Chưa có đoạn nào có giọng nói");
      return;
    }
    // Use merged audio if available, otherwise use segment-by-segment
    if (mergedAudio && mergedAudioRef.current) {
      // Use merged audio playback
      const audio = mergedAudioRef.current;
      if (multiPlayerState.isPlaying) {
        audio.pause();
        setMultiPlayerState((prev) => ({ ...prev, isPlaying: false }));
      } else {
        audio.play();
        setMultiPlayerState((prev) => ({ ...prev, isPlaying: true }));
      }
      return;
    }
    // Fallback to segment-by-segment playback
    if (multiPlayerState.isPlaying) {
      // Pause
      if (currentSegmentAudioRef.current) {
        currentSegmentAudioRef.current.pause();
        // Save the paused time within current segment
        setMultiPlayerState((prev) => ({
          ...prev,
          isPlaying: false,
          pausedSegmentTime: currentSegmentAudioRef.current.currentTime,
        }));
      } else {
        setMultiPlayerState((prev) => ({ ...prev, isPlaying: false }));
      }
    } else {
      // Play or resume
      if (multiPlayerState.currentSegmentIndex === -1) {
        // Start from beginning
        playSegmentAtIndex(0);
      } else {
        // Resume current segment
        if (currentSegmentAudioRef.current) {
          currentSegmentAudioRef.current.play();
          setMultiPlayerState((prev) => ({ ...prev, isPlaying: true }));
        } else {
          // Audio element lost, restart from same segment
          playSegmentAtIndex(
            multiPlayerState.currentSegmentIndex,
            multiPlayerState.pausedSegmentTime
          );
        }
      }
    }
  };

  // Play segment at specific index
  const playSegmentAtIndex = (index, startTime = 0) => {
    if (index >= segmentsWithAudio.length) {
      // Finished all segments
      setMultiPlayerState({
        isPlaying: false,
        currentSegmentIndex: -1,
        currentTime: 0,
        totalDuration: totalMultiDuration,
        pausedSegmentTime: 0,
      });
      return;
    }
    const segment = segmentsWithAudio[index];
    const audio = segmentAudios[segment.id];
    if (!audio) return;
    // Stop previous audio if any
    if (currentSegmentAudioRef.current) {
      currentSegmentAudioRef.current.pause();
      currentSegmentAudioRef.current.src = "";
    }
    // Create new audio
    const audioElement = new Audio(audio.url);
    currentSegmentAudioRef.current = audioElement;
    // Apply settings if available
    const settings = segmentSettings[segment.id];
    if (settings) {
      audioElement.playbackRate = settings.speed || 1.0;
      audioElement.volume = (settings.volume || 100) / 100;
    }
    // Set start time if resuming (after metadata loads)
    if (startTime > 0) {
      audioElement.addEventListener(
        "loadedmetadata",
        () => {
          audioElement.currentTime = startTime;
        },
        { once: true }
      );
    }
    audioElement.addEventListener("ended", () => {
      // Play next segment
      playSegmentAtIndex(index + 1);
    });
    audioElement.addEventListener("error", (e) => {
      console.error("Multi audio error:", e);
      toast.error(`Lỗi phát đoạn ${index + 1}`);
      // Try next segment
      playSegmentAtIndex(index + 1);
    });
    audioElement.addEventListener("timeupdate", () => {
      // Calculate cumulative time up to this segment
      let cumulativeTime = 0;
      for (let i = 0; i < index; i++) {
        const seg = segmentsWithAudio[i];
        cumulativeTime += segmentAudios[seg.id]?.duration || 0;
      }
      // Add current segment's progress
      // Ensure currentTime doesn't exceed segment duration
      const segmentDuration = segmentAudios[segment.id]?.duration || 0;
      const currentSegmentTime = Math.min(
        audioElement.currentTime,
        segmentDuration
      );
      cumulativeTime += currentSegmentTime;
      // Ensure cumulativeTime doesn't exceed totalMultiDuration
      cumulativeTime = Math.min(cumulativeTime, totalMultiDuration);
      setMultiPlayerState((prev) => ({
        ...prev,
        currentTime: cumulativeTime,
      }));
    });
    audioElement.play();
    // Calculate initial cumulative time for this segment
    let initialCumulativeTime = 0;
    for (let i = 0; i < index; i++) {
      const seg = segmentsWithAudio[i];
      initialCumulativeTime += segmentAudios[seg.id]?.duration || 0;
    }
    setMultiPlayerState({
      isPlaying: true,
      currentSegmentIndex: index,
      currentTime: initialCumulativeTime + startTime,
      totalDuration: totalMultiDuration,
      pausedSegmentTime: 0,
    });
  };

  // Handle play/pause audio
  const handleTogglePlay = () => {
    const audio = audioPlayerRef.current;
    if (!audio || !generatedAudio) return;
    if (audio.paused) {
      audio.play();
      setAudioPlayerState((prev) => ({ ...prev, isPlaying: true }));
      // Sync background music if enabled
      if (backgroundMusic && musicPlayerRef.current) {
        musicPlayerRef.current.currentTime = audio.currentTime;
        musicPlayerRef.current.play();
      }
    } else {
      audio.pause();
      setAudioPlayerState((prev) => ({ ...prev, isPlaying: false }));
      // Pause background music
      if (musicPlayerRef.current) {
        musicPlayerRef.current.pause();
      }
    }
  };

  // Handle export audio with settings
  const handleExportAudio = async () => {
    if (mode === "single") {
      if (!generatedAudio) {
        toast.error("Chưa có audio để xuất");
        return;
      }
    } else {
      // Multi mode - check if we have merged audio or segments
      if (!mergedAudio && segmentsWithAudio.length === 0) {
        toast.error("Chưa có audio để xuất");
        return;
      }
    }
    try {
      toast.loading("Đang xử lý audio...", { id: "export" });
      // Get audio data - handle both single and multi mode
      let arrayBuffer;
      let audioUrl;
      if (mode === "single") {
        audioUrl = generatedAudio.url;
      } else {
        // Multi mode - prefer merged audio, fallback to first segment
        if (mergedAudio && mergedAudio.url) {
          audioUrl = mergedAudio.url;
        } else if (segmentsWithAudio.length > 0) {
          // Use first segment as fallback (shouldn't happen if merge works)
          audioUrl = segmentAudios[segmentsWithAudio[0].id].url;
        } else {
          toast.error("Không có audio để xuất", { id: "export" });
          return;
        }
      }
      // Handle both data URLs and regular URLs
      if (audioUrl.startsWith("data:")) {
        // Decode base64 data URL directly (avoid CSP issues)
        const base64Data = audioUrl.split(",")[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        // Fetch from regular URL
        const response = await fetch(audioUrl);
        arrayBuffer = await response.arrayBuffer();
      }
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      // Create offline context for processing
      const sampleRate = audioBuffer.sampleRate;
      const length = Math.floor(
        audioBuffer.length * (audioSettings.speed || 1)
      );
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        length,
        sampleRate
      );
      // Create source
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = audioSettings.speed || 1.0;
      // Apply pitch (simple pitch shift using playbackRate)
      const pitchRatio = Math.pow(2, (audioSettings.pitch || 0) / 12);
      source.playbackRate.value = (audioSettings.speed || 1.0) * pitchRatio;
      // Create gain node for volume
      const gainNode = offlineContext.createGain();
      gainNode.gain.value = (audioSettings.volume || 100) / 100;
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(offlineContext.destination);
      // Start playback
      source.start(0);
      // Render to buffer
      const renderedBuffer = await offlineContext.startRendering();
      // Mix with background music if available
      let finalBuffer = renderedBuffer;
      if (backgroundMusic && backgroundMusic.url) {
        try {
          // Get music data - handle both data URLs and regular URLs
          let musicArrayBuffer;
          if (backgroundMusic.url.startsWith("data:")) {
            // Decode base64 data URL directly
            const base64Data = backgroundMusic.url.split(",")[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            musicArrayBuffer = bytes.buffer;
          } else {
            // Fetch from regular URL
            const musicResponse = await fetch(backgroundMusic.url);
            musicArrayBuffer = await musicResponse.arrayBuffer();
          }
          const musicBuffer = await audioContext.decodeAudioData(
            musicArrayBuffer
          );
          // Mix audio buffers
          finalBuffer = mixAudioBuffers(renderedBuffer, musicBuffer, {
            voiceVolume: (audioSettings.volume || 100) / 100,
            musicVolume: (musicVolume || 30) / 100,
            autoDuck: musicAutoDuck,
          });
        } catch (error) {
          console.error("Error mixing background music:", error);
          // Continue without background music
        }
      }
      // Convert to desired format
      let blob;
      let filename;
      if (exportFormat === "wav") {
        blob = audioBufferToWav(finalBuffer);
        filename = `voiceover-${Date.now()}.wav`;
      } else {
        // For MP3, we'll use WAV as fallback (MP3 encoding requires library)
        blob = audioBufferToWav(finalBuffer);
        filename = `voiceover-${Date.now()}.wav`;
        toast("MP3 encoding requires additional library. Exporting as WAV.", {
          id: "export",
          icon: "ℹ️",
        });
      }
      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất file thành công!", { id: "export" });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Lỗi khi xuất file", { id: "export" });
    }
  };

  // Helper: Mix two audio buffers
  const mixAudioBuffers = (buffer1, buffer2, options = {}) => {
    const { voiceVolume = 1, musicVolume = 0.3, autoDuck = true } = options;
    const sampleRate = buffer1.sampleRate;
    const length = Math.max(buffer1.length, buffer2.length);
    const numChannels = Math.max(
      buffer1.numberOfChannels,
      buffer2.numberOfChannels
    );
    const offlineContext = new OfflineAudioContext(
      numChannels,
      length,
      sampleRate
    );
    const mixedBuffer = offlineContext.createBuffer(
      numChannels,
      length,
      sampleRate
    );
    // Mix channels
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = mixedBuffer.getChannelData(channel);
      const voiceData = buffer1.getChannelData(
        Math.min(channel, buffer1.numberOfChannels - 1)
      );
      const musicData = buffer2.getChannelData(
        Math.min(channel, buffer2.numberOfChannels - 1)
      );
      for (let i = 0; i < length; i++) {
        const voiceSample = i < buffer1.length ? voiceData[i] * voiceVolume : 0;
        let musicSample = 0;
        if (i < buffer2.length) {
          musicSample = musicData[i] * musicVolume;
          // Auto-ducking: reduce music when voice is present
          if (autoDuck && Math.abs(voiceSample) > 0.01) {
            musicSample *= 0.3; // Reduce music by 70%
          }
        }
        channelData[i] = Math.max(-1, Math.min(1, voiceSample + musicSample));
      }
    }
    return mixedBuffer;
  };

  // Helper: Convert AudioBuffer to WAV Blob
  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(
      44 + length * numChannels * bytesPerSample
    );
    const view = new DataView(arrayBuffer);
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * numChannels * bytesPerSample, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, length * numChannels * bytesPerSample, true);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, buffer.getChannelData(channel)[i])
        );
        view.setInt16(
          offset,
          sample < 0 ? sample * 0x8000 : sample * 0x7fff,
          true
        );
        offset += 2;
      }
    }
    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  // Update current time from audio element
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio) return;
    const updateTime = () => {
      setAudioPlayerState((prev) => {
        const duration = audio.duration || prev.duration;
        // Ensure currentTime doesn't exceed duration
        const currentTime = Math.min(audio.currentTime, duration || 0);
        return {
          ...prev,
          currentTime,
          duration,
        };
      });
    };
    const handleTimeUpdate = () => updateTime();
    const handleLoadedMetadata = () => updateTime();
    const handleEnded = () => {
      setAudioPlayerState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [generatedAudio]);

  // Apply audio settings when they change (if audio is generated)
  useEffect(() => {
    if (!generatedAudio || !audioPlayerRef.current) return;
    const audio = audioPlayerRef.current;
    // Apply speed
    audio.playbackRate = audioSettings.speed;
    // Apply volume (0-1 range)
    audio.volume = (audioSettings.volume || 100) / 100;
    // Note: Pitch requires Web Audio API for proper implementation
    // For now, we can use playbackRate which affects both speed and pitch
    // A proper pitch shifter would require additional processing
  }, [audioSettings.speed, audioSettings.volume, generatedAudio]);

  // Update background music volume when it changes
  useEffect(() => {
    if (musicPlayerRef.current) {
      musicPlayerRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume]);

  // Get default prompt based on language
  const getDefaultPrompt = (language) => {
    if (!language) return "";
    const langLower = language.toLowerCase();
    if (
      langLower.includes("vietnamese") ||
      langLower.includes("vi") ||
      langLower === "vi"
    ) {
      return "Đọc theo phong cách lồng tiếng phim, chất giọng miền Nam của Việt Nam, giọng đọc truyền cảm, tự nhiên, ấm áp, tròn vành rõ chữ và tốc độ đọc rất nhanh:";
    }
    if (
      langLower.includes("english") ||
      langLower.includes("en") ||
      langLower === "en"
    ) {
      return "Generate a voiceover in a General American accent with a cinematic film dubbing style. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate:";
    }
    if (
      langLower.includes("thai") ||
      langLower.includes("th") ||
      langLower === "th"
    ) {
      return "Read in a movie dubbing style with a Standard Central Thai (Bangkok) accent. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate.";
    }
    if (
      langLower.includes("indonesian") ||
      langLower.includes("id") ||
      langLower === "id" ||
      langLower.includes("bahasa indonesia")
    ) {
      return "Read in a movie dubbing style with a Bahasa Indonesia accent. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate.";
    }
    if (
      langLower.includes("spanish") ||
      langLower.includes("es") ||
      langLower === "es"
    ) {
      return "Read in a movie dubbing style with a Latin American Spanish accent. The tone should be warm, natural, and emotionally expressive. The speaking pace must be very fast and rapid, mimicking high-energy dialogue while ensuring every word remains clear and articulate.";
    }
    return "";
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}.${ms.toString().padStart(3, "0").substring(0, 2)}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(3, "0")
      .substring(0, 2)}`;
  };

  // Format time for display (simpler version)
  const formatTimeSimple = (seconds) => {
    if (!seconds && seconds !== 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
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
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAudio}
            disabled={
              mode === "single"
                ? !hasGeneratedAudio
                : !mergedAudio && segmentsWithAudio.length === 0
            }
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
              mode === "single"
                ? hasGeneratedAudio
                  ? "bg-brand-500 text-white hover:bg-brand-600"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                : mergedAudio || segmentsWithAudio.length > 0
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <FiDownload className="text-sm" /> Xuất file
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
              <FiFileText className="text-base" /> Đơn
            </button>
            <button
              onClick={() => setMode("character")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
                mode === "character"
                  ? "bg-brand-500 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FiUsers className="text-base" /> Đa
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
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => srtFileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-1"
                      title="Import file SRT"
                    >
                      <FiUpload className="text-xs" /> Import SRT
                    </button>
                    <button
                      onClick={handleAddSegment}
                      className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition flex items-center gap-1"
                    >
                      <FiPlus className="text-xs" /> Thêm
                    </button>
                  </div>
                </div>
                {/* Hidden SRT file input */}
                <input
                  ref={srtFileInputRef}
                  type="file"
                  accept=".srt"
                  className="hidden"
                  onChange={handleImportSRT}
                />
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
                          style={{
                            backgroundColor: char?.color || "#gray",
                          }}
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
                            <span className="text-xs text-gray-500 font-mono">
                              {formatTimeSimple(seg.startTime)} →
                              {formatTimeSimple(seg.startTime + seg.duration)} (
                              {seg.duration.toFixed(1)}s)
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
                          {/* Segment audio status and controls */}
                          <div className="mt-2 flex items-center gap-2">
                            {segmentAudios[seg.id] ? (
                              <>
                                <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                                  <FiZap className="text-xs" /> Đã có giọng
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Play this segment audio
                                    const audio = new Audio(
                                      segmentAudios[seg.id].url
                                    );
                                    audio.play();
                                  }}
                                  className="text-xs text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50 transition flex items-center gap-1"
                                >
                                  <FiPlay className="text-xs" /> Nghe thử
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateSegmentVoice(seg.id);
                                  }}
                                  disabled={generatingSegments.has(seg.id)}
                                  className={`text-xs px-2 py-0.5 rounded transition flex items-center gap-1 ${
                                    generatingSegments.has(seg.id)
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {generatingSegments.has(seg.id) ? (
                                    <>
                                      <FiLoader className="text-xs animate-spin" />
                                      Đang tạo...
                                    </>
                                  ) : (
                                    <>
                                      <FiRotateCw className="text-xs" /> Tạo lại
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateSegmentVoice(seg.id);
                                }}
                                disabled={
                                  generatingSegments.has(seg.id) ||
                                  !char?.voice ||
                                  !seg.text.trim()
                                }
                                className={`text-xs px-2 py-0.5 rounded transition flex items-center gap-1 ${
                                  generatingSegments.has(seg.id) ||
                                  !char?.voice ||
                                  !seg.text.trim()
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-brand-600 hover:text-brand-700 hover:bg-brand-50"
                                }`}
                              >
                                {generatingSegments.has(seg.id) ? (
                                  <>
                                    <FiLoader className="text-xs animate-spin" />
                                    Đang tạo...
                                  </>
                                ) : (
                                  <>
                                    <FiZap className="text-xs" /> Tạo giọng
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSegments(
                              segments.filter((s) => s.id !== seg.id)
                            );
                            // Clean up audio
                            setSegmentAudios((prev) => {
                              const newAudios = { ...prev };
                              delete newAudios[seg.id];
                              return newAudios;
                            });
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
                        <FiPlus className="text-xs" /> Thêm
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
                                <FiPlus className="text-xs" /> Chọn giọng nói
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
          {/* Bottom Playback Bar */}
          <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-4">
            <button
              onClick={
                mode === "single" ? handleTogglePlay : handleTogglePlayMulti
              }
              disabled={
                mode === "single"
                  ? !hasGeneratedAudio
                  : segmentsWithAudio.length === 0
              }
              className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                (mode === "single" && !hasGeneratedAudio) ||
                (mode !== "single" && segmentsWithAudio.length === 0)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-brand-500 text-white hover:bg-brand-600"
              }`}
            >
              {(mode === "single" && audioPlayerState.isPlaying) ||
              (mode !== "single" && multiPlayerState.isPlaying) ? (
                <FiPause className="text-lg" />
              ) : (
                <FiPlay className="text-lg ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div className="relative h-1.5 bg-gray-200 rounded-full cursor-pointer">
                <div
                  className="absolute h-full bg-brand-500 rounded-full"
                  style={{
                    width: `${
                      mode === "single"
                        ? audioPlayerState.duration > 0
                          ? Math.min(
                              100,
                              (audioPlayerState.currentTime /
                                audioPlayerState.duration) *
                                100
                            )
                          : 0
                        : mergedAudio && mergedAudioRef.current
                        ? mergedAudioRef.current.duration > 0
                          ? Math.min(
                              100,
                              (mergedAudioRef.current.currentTime /
                                mergedAudioRef.current.duration) *
                                100
                            )
                          : 0
                        : totalMultiDuration > 0
                        ? Math.min(
                            100,
                            (multiPlayerState.currentTime /
                              totalMultiDuration) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                {formatTime(
                  mode === "single"
                    ? audioPlayerState.currentTime
                    : mergedAudio && mergedAudioRef.current
                    ? mergedAudioRef.current.currentTime
                    : multiPlayerState.currentTime
                )}
                {" / "}
                {formatTime(
                  mode === "single"
                    ? audioPlayerState.duration
                    : mergedAudio && mergedAudioRef.current
                    ? mergedAudioRef.current.duration
                    : totalMultiDuration
                )}
              </span>
              <div className="h-6 w-px bg-gray-300" />
              {mode === "character" && (
                <div className="flex items-center gap-2">
                  <FiTarget className="text-base" />
                  <span className="text-xs">
                    {segmentsWithAudioCount}/{segments.length} đoạn đã có giọng
                  </span>
                </div>
              )}
              <button
                onClick={handleGenerateVoice}
                disabled={!canGenerateVoice || isGenerating}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
                  canGenerateVoice && !isGenerating
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isGenerating ? (
                  <>
                    <FiLoader className="text-base animate-spin" /> Đang tạo...
                  </>
                ) : (
                  <>
                    <FiZap className="text-base" /> Tạo giọng nói
                  </>
                )}
              </button>
            </div>
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
                  <FiMic className="inline text-base mr-2" /> Giọng nói
                </button>
                <button
                  onClick={() => setRightPanelTab("settings")}
                  disabled={
                    (mode === "single" && !hasGeneratedAudio) ||
                    (mode !== "single" && segments.length === 0)
                  }
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    rightPanelTab === "settings"
                      ? "text-brand-600 border-b-2 border-brand-600 bg-brand-50"
                      : (mode === "single" && !hasGeneratedAudio) ||
                        (mode !== "single" && segments.length === 0)
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FiSliders className="inline text-base mr-2" /> Cài đặt
                </button>
                <button
                  onClick={() => setRightPanelTab("mixer")}
                  disabled={mode === "single" && !hasGeneratedAudio}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                    rightPanelTab === "mixer"
                      ? "text-brand-600 border-b-2 border-brand-600 bg-brand-50"
                      : mode === "single" && !hasGeneratedAudio
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FiVolume2 className="inline text-base mr-2" /> Mixer
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
                    {/* Custom Prompt Section - Collapsible */}
                    <div className="border-t border-gray-200 pt-3">
                      <button
                        type="button"
                        onClick={() => setPromptExpanded(!promptExpanded)}
                        className="w-full flex items-center justify-between text-xs text-gray-600 hover:text-gray-900 transition mb-2"
                      >
                        <span className="flex items-center gap-2">
                          <FiFileText className="text-sm" /> Yêu cầu giọng đọc
                          (Prompt tùy chỉnh)
                        </span>
                        <FiChevronDown
                          className={`text-xs transition-transform ${
                            promptExpanded ? "transform rotate-180" : ""
                          }`}
                        />
                      </button>
                      {promptExpanded && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id="useCustomPrompt"
                              checked={useCustomPrompt}
                              onChange={(e) => {
                                setUseCustomPrompt(e.target.checked);
                                if (!e.target.checked) {
                                  setCustomPrompt("");
                                }
                              }}
                              className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500"
                            />
                            <label
                              htmlFor="useCustomPrompt"
                              className="text-xs text-gray-600 cursor-pointer"
                            >
                              Sử dụng prompt tùy chỉnh (nếu không chọn sẽ dùng
                              prompt mặc định theo ngôn ngữ)
                            </label>
                          </div>
                          {useCustomPrompt ? (
                            <textarea
                              value={customPrompt}
                              onChange={(e) => setCustomPrompt(e.target.value)}
                              placeholder="Nhập prompt tùy chỉnh cho giọng đọc..."
                              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white resize-none"
                              rows={4}
                            />
                          ) : (
                            <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 max-h-32 overflow-y-auto">
                              <p className="font-medium mb-1 text-gray-700">
                                Prompt mặc định sẽ được sử dụng:
                              </p>
                              <p className="text-gray-600 whitespace-pre-wrap">
                                {selectedVoice?.language
                                  ? getDefaultPrompt(selectedVoice.language) ||
                                    "Không có prompt mặc định cho ngôn ngữ này"
                                  : "Chọn giọng nói để xem prompt mặc định"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Provider & Model Selection - Collapsible */}
                    <div className="border-t border-gray-200 pt-3">
                      <button
                        type="button"
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                        className="w-full flex items-center justify-between text-xs text-gray-600 hover:text-gray-900 transition"
                      >
                        <span className="flex items-center gap-2">
                          <FiSettings className="text-sm" /> Lựa chọn nhà cung
                          cấp
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
                                      <FiPlay className="text-xs" /> Nghe thử
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
                  {mode === "single" ? (
                    // Single mode settings
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Tốc độ:
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
                          Cao độ:
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
                          Âm lượng:
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
                          Độ ổn định:
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
                          Độ rõ ràng:
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
                            <input
                              type="radio"
                              name="format"
                              value="mp3"
                              checked={exportFormat === "mp3"}
                              onChange={(e) => setExportFormat(e.target.value)}
                            />
                            <span className="text-sm text-gray-700">
                              MP3 (320kbps)
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="format"
                              value="wav"
                              checked={exportFormat === "wav"}
                              onChange={(e) => setExportFormat(e.target.value)}
                            />
                            <span className="text-sm text-gray-700">
                              WAV (lossless)
                            </span>
                          </label>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Multi mode settings - for selected segment
                    <>
                      {selectedSegment ? (
                        <>
                          <div className="mb-3 pb-3 border-b border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">
                              Cài đặt cho đoạn đã chọn
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              Đoạn
                              {segments.findIndex(
                                (s) => s.id === selectedSegment
                              ) + 1}
                            </p>
                          </div>
                          {(() => {
                            const seg = segments.find(
                              (s) => s.id === selectedSegment
                            );
                            const currentSettings = segmentSettings[
                              selectedSegment
                            ] || {
                              speed: audioSettings.speed || 1.0,
                              pitch: audioSettings.pitch || 0,
                              volume: audioSettings.volume || 100,
                            };
                            return (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Tốc độ:
                                    <span className="text-brand-600">
                                      {currentSettings.speed}x
                                    </span>
                                  </label>
                                  <input
                                    type="range"
                                    min="0.25"
                                    max="4"
                                    step="0.25"
                                    value={currentSettings.speed}
                                    onChange={(e) =>
                                      setSegmentSettings({
                                        ...segmentSettings,
                                        [selectedSegment]: {
                                          ...currentSettings,
                                          speed: Number(e.target.value),
                                        },
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
                                    Cao độ:
                                    <span className="text-brand-600">
                                      {currentSettings.pitch}
                                    </span>
                                  </label>
                                  <input
                                    type="range"
                                    min="-12"
                                    max="12"
                                    step="1"
                                    value={currentSettings.pitch}
                                    onChange={(e) =>
                                      setSegmentSettings({
                                        ...segmentSettings,
                                        [selectedSegment]: {
                                          ...currentSettings,
                                          pitch: Number(e.target.value),
                                        },
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
                                    Âm lượng:
                                    <span className="text-brand-600">
                                      {currentSettings.volume}%
                                    </span>
                                  </label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={currentSettings.volume}
                                    onChange={(e) =>
                                      setSegmentSettings({
                                        ...segmentSettings,
                                        [selectedSegment]: {
                                          ...currentSettings,
                                          volume: Number(e.target.value),
                                        },
                                      })
                                    }
                                    className="w-full"
                                  />
                                </div>
                                {segmentAudios[selectedSegment] && (
                                  <div className="pt-3 border-t border-gray-200">
                                    <button
                                      onClick={() => {
                                        // Regenerate with new settings
                                        handleGenerateSegmentVoice(
                                          selectedSegment
                                        );
                                      }}
                                      disabled={generatingSegments.has(
                                        selectedSegment
                                      )}
                                      className={`w-full px-3 py-2 text-xs rounded-lg transition flex items-center justify-center gap-2 ${
                                        generatingSegments.has(selectedSegment)
                                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                          : "bg-brand-500 text-white hover:bg-brand-600"
                                      }`}
                                    >
                                      {generatingSegments.has(
                                        selectedSegment
                                      ) ? (
                                        <>
                                          <FiLoader className="text-xs animate-spin" />
                                          Đang tạo lại...
                                        </>
                                      ) : (
                                        "Áp dụng và tạo lại"
                                      )}
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="text-center py-8 text-sm text-gray-500">
                          Chọn một đoạn hội thoại để chỉnh sửa cài đặt
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {/* Mixer Tab */}
              {rightPanelTab === "mixer" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 sidebar-scrollbar min-h-0 h-0">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FiVolume2 className="text-base" /> Voice Track
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
                      <FiMusic className="text-base" /> Background Music
                    </h4>
                    {!backgroundMusic ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-brand-500 hover:text-brand-600 transition flex items-center justify-center gap-2"
                      >
                        <FiUpload /> Tải nhạc nền lên
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {backgroundMusic.name || "Background Music"}
                          </p>
                          <button
                            onClick={() => {
                              setBackgroundMusic(null);
                              if (musicPlayerRef.current) {
                                musicPlayerRef.current.pause();
                                musicPlayerRef.current.src = "";
                              }
                            }}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
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
                              min="0"
                              max="100"
                              step="5"
                              className="flex-1"
                              value={musicVolume}
                              onChange={(e) => {
                                const volume = Number(e.target.value);
                                setMusicVolume(volume);
                                if (musicPlayerRef.current) {
                                  musicPlayerRef.current.volume = volume / 100;
                                }
                              }}
                            />
                            <span className="text-xs text-gray-900 w-10 text-right">
                              {musicVolume}%
                            </span>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={musicAutoDuck}
                              onChange={(e) =>
                                setMusicAutoDuck(e.target.checked)
                              }
                            />
                            <span className="text-xs text-gray-700">
                              Auto-ducking (giảm nhạc khi có giọng)
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={musicLoop}
                              onChange={(e) => {
                                setMusicLoop(e.target.checked);
                                if (musicPlayerRef.current) {
                                  musicPlayerRef.current.loop =
                                    e.target.checked;
                                }
                              }}
                            />
                            <span className="text-xs text-gray-700">
                              Loop nhạc nền
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    {/* Hidden file input for music upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setBackgroundMusic({
                            file,
                            url,
                            name: file.name,
                          });
                        }
                      }}
                    />
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
        {/* Hidden audio element for single mode */}
        {mode === "single" && generatedAudio && (
          <audio
            ref={audioPlayerRef}
            src={generatedAudio.url}
            onTimeUpdate={() => {
              if (audioPlayerRef.current) {
                setAudioPlayerState((prev) => {
                  const duration =
                    prev.duration || audioPlayerRef.current.duration || 0;
                  // Ensure currentTime doesn't exceed duration
                  const currentTime = Math.min(
                    audioPlayerRef.current.currentTime,
                    duration
                  );
                  return {
                    ...prev,
                    currentTime,
                  };
                });
                // Sync background music
                if (
                  backgroundMusic &&
                  musicPlayerRef.current &&
                  !musicPlayerRef.current.paused
                ) {
                  musicPlayerRef.current.currentTime =
                    audioPlayerRef.current.currentTime;
                }
              }
            }}
            onLoadedMetadata={() => {
              if (audioPlayerRef.current) {
                setAudioPlayerState((prev) => ({
                  ...prev,
                  duration: audioPlayerRef.current.duration || 0,
                }));
              }
            }}
            onEnded={() => {
              setAudioPlayerState((prev) => ({
                ...prev,
                isPlaying: false,
                currentTime: 0,
              }));
              // Stop background music
              if (musicPlayerRef.current) {
                musicPlayerRef.current.pause();
                musicPlayerRef.current.currentTime = 0;
              }
            }}
          />
        )}
        {/* Hidden audio element for merged multi-mode audio */}
        {mode !== "single" && mergedAudio && (
          <audio
            ref={mergedAudioRef}
            src={mergedAudio.url}
            onTimeUpdate={() => {
              // Update state for timeline display (same logic as single mode)
              if (mergedAudioRef.current) {
                setMultiPlayerState((prev) => {
                  const duration =
                    prev.totalDuration || mergedAudioRef.current.duration || 0;
                  // Ensure currentTime doesn't exceed duration
                  const currentTime = Math.min(
                    mergedAudioRef.current.currentTime,
                    duration
                  );
                  return {
                    ...prev,
                    currentTime,
                    totalDuration: duration,
                  };
                });
              }
            }}
            onLoadedMetadata={() => {
              if (mergedAudioRef.current) {
                setMultiPlayerState((prev) => ({
                  ...prev,
                  totalDuration:
                    mergedAudioRef.current.duration ||
                    mergedAudio.duration ||
                    0,
                }));
              }
            }}
            onEnded={() => {
              setMultiPlayerState((prev) => ({
                ...prev,
                isPlaying: false,
                currentTime: 0,
              }));
            }}
            onPlay={() => {
              setMultiPlayerState((prev) => ({
                ...prev,
                isPlaying: true,
              }));
            }}
            onPause={() => {
              setMultiPlayerState((prev) => ({
                ...prev,
                isPlaying: false,
              }));
            }}
          />
        )}
        {/* Hidden audio element for background music */}
        {backgroundMusic && backgroundMusic.url && (
          <audio
            ref={musicPlayerRef}
            src={backgroundMusic.url}
            loop={musicLoop}
            onLoadedMetadata={() => {
              if (musicPlayerRef.current) {
                musicPlayerRef.current.volume = musicVolume / 100;
                // Sync with voice audio if playing
                if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
                  musicPlayerRef.current.currentTime =
                    audioPlayerRef.current.currentTime;
                  musicPlayerRef.current.play();
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
