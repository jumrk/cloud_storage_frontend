"use client";

import React, { useState, useRef, useEffect } from "react";
import { CiPlay1, CiPause1 } from "react-icons/ci";
import {
  FiUpload,
  FiChevronDown,
  FiDownload,
  FiVideo,
  FiGlobe,
  FiSettings,
  FiCheckCircle,
  FiClock,
  FiTrash2,
  FiEdit3,
  FiList,
} from "react-icons/fi";
import { useTranslations } from "next-intl";
import Popover from "@/shared/ui/Popover";
import useExtractSubtitle from "../hooks/useExtractSubtitle";

const LANGUAGES = [
  { code: "auto", label: "Tự động phát hiện", flag: "🌐" },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
];

export default function ExtractSubtitlePage() {
  const t = useTranslations();
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [exportFormats, setExportFormats] = useState({ srt: true, vtt: false });
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("extract"); // "extract" or "history"
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const languageDropdownRef = useRef(null);

  // Use extract subtitle hook
  const {
    loading: isProcessing,
    error,
    progress,
    subtitles: subtitlesFromAPI,
    history,
    historyLoading,
    startExtraction,
    downloadSubtitle,
    downloadFromHistory,
    loadHistory,
    reset,
    cleanup,
  } = useExtractSubtitle();

  // Local state for edited subtitles
  const [editedSubtitles, setEditedSubtitles] = useState([]);

  // Sync edited subtitles when API subtitles change
  useEffect(() => {
    if (subtitlesFromAPI.length > 0) {
      setEditedSubtitles(subtitlesFromAPI);
    } else {
      setEditedSubtitles([]);
    }
  }, [subtitlesFromAPI]);

  // Use edited subtitles for display
  const subtitles = editedSubtitles;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      reset();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      reset();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleExtract = async () => {
    if (!videoFile) return;
    await startExtraction(videoFile, selectedLanguage.code);
  };

  const handleSubtitleEdit = (id, newText) => {
    setEditedSubtitles((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, text: newText } : sub))
    );
  };

  const handleSubtitleDelete = (id) => {
    setEditedSubtitles((prev) => prev.filter((sub) => sub.id !== id));
  };

  const handleExport = async (format) => {
    await downloadSubtitle(format);
  };

  const handleReset = () => {
    setVideoFile(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
    }
    reset();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [cleanup, videoUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target)
      ) {
        setIsLanguageOpen(false);
      }
    }
    if (isLanguageOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLanguageOpen]);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setIsLanguageOpen(false);
  };

  const handleFormatToggle = (format) => {
    setExportFormats((prev) => ({
      ...prev,
      [format]: !prev[format],
    }));
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-brand-50 p-2.5 rounded-full">
            <FiDownload className="text-xl text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tách phụ đề tự động
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Video Upload & Preview */}
          <div className="space-y-4.5">
            {/* Tabs */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("extract")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                    activeTab === "extract"
                      ? "text-brand-600 border-b-2 border-brand-600 bg-brand-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <FiDownload className="text-base" />
                  Tách phụ đề
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                    activeTab === "history"
                      ? "text-brand-600 border-b-2 border-brand-600 bg-brand-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <FiList className="text-base" />
                  Lịch sử
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "extract" ? (
              <>
                {!videoUrl ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all shadow-sm ${
                      isDragging
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-300 bg-white hover:border-brand-500"
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="space-y-3.5">
                      <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center">
                        <FiUpload className="text-3xl text-brand-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-800">
                          {isDragging ? "Thả video vào đây" : "Tải video lên"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1.5">
                          Kéo thả hoặc click để chọn file
                        </p>
                        <div className="mt-3.5 flex items-center justify-center gap-2 flex-wrap">
                          {["MP4", "MOV", "AVI", "MKV"].map((format) => (
                            <span
                              key={format}
                              className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded"
                            >
                              {format}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Video Preview */}
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-auto"
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      {/* Play/Pause Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition">
                        <button
                          onClick={handlePlayPause}
                          className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:scale-110 transition"
                        >
                          {isPlaying ? (
                            <CiPause1 className="text-2xl" />
                          ) : (
                            <CiPlay1 className="text-2xl ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="bg-white border border-gray-200 rounded-lg p-3.5">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-brand-50 rounded">
                          <FiVideo className="text-base text-brand-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {videoFile?.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(videoFile?.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                            {videoFile?.name?.split(".").pop()?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3.5">
                        <FiSettings className="text-base text-gray-600" />
                        <h3 className="text-sm font-semibold text-gray-800">
                          Cài đặt
                        </h3>
                      </div>

                      <div className="space-y-3.5">
                        {/* Language */}
                        <div>
                          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
                            <FiGlobe className="text-sm" />
                            Ngôn ngữ phụ đề
                          </label>
                          <div className="relative" ref={languageDropdownRef}>
                            <button
                              type="button"
                              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                              className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:border-brand-500 transition"
                            >
                              <span className="flex items-center gap-2.5">
                                <span className="text-lg">
                                  {selectedLanguage.flag}
                                </span>
                                <span>{selectedLanguage.label}</span>
                              </span>
                              <FiChevronDown
                                className={`text-gray-400 transition-transform ${
                                  isLanguageOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                            <Popover
                              open={isLanguageOpen}
                              className="w-full mt-1 max-h-60 overflow-y-auto sidebar-scrollbar"
                            >
                              <div className="py-1">
                                {LANGUAGES.map((lang) => (
                                  <button
                                    key={lang.code}
                                    type="button"
                                    onClick={() => handleLanguageSelect(lang)}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${
                                      selectedLanguage.code === lang.code
                                        ? "bg-brand-50 text-brand-700 font-medium"
                                        : "text-gray-900 hover:bg-gray-50"
                                    }`}
                                  >
                                    <span className="text-base">
                                      {lang.flag}
                                    </span>
                                    <span className="flex-1">{lang.label}</span>
                                    {selectedLanguage.code === lang.code && (
                                      <FiCheckCircle className="text-xs text-brand-600" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </Popover>
                          </div>
                        </div>

                        {/* Format */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Định dạng xuất
                          </label>
                          <div className="flex gap-2.5">
                            {[
                              { key: "srt", label: "SRT" },
                              { key: "vtt", label: "VTT" },
                            ].map((format) => (
                              <label
                                key={format.key}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer transition text-sm ${
                                  exportFormats[format.key]
                                    ? "border-brand-500 bg-brand-50 text-brand-700"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={exportFormats[format.key]}
                                  onChange={() =>
                                    handleFormatToggle(format.key)
                                  }
                                  className="hidden"
                                />
                                <span className="font-medium">
                                  {format.label}
                                </span>
                                {exportFormats[format.key] && (
                                  <FiCheckCircle className="text-xs" />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Extract Button */}
                    <button
                      onClick={handleExtract}
                      disabled={isProcessing || !videoFile}
                      className="w-full bg-brand-500 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-brand-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition"
                    >
                      {isProcessing
                        ? `Đang xử lý... ${progress}%`
                        : subtitles.length > 0
                        ? "✓ Đã tách phụ đề"
                        : "Bắt đầu tách phụ đề"}
                    </button>

                    {/* Progress */}
                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Đang xử lý...</span>
                          <span className="font-semibold text-brand-600">
                            {progress}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded text-sm">
                        <p className="font-medium">Lỗi</p>
                        <p className="text-xs mt-0.5">{error}</p>
                      </div>
                    )}

                    {/* Export & Reset */}
                    {subtitles.length > 0 && (
                      <div className="flex gap-2.5">
                        {exportFormats.srt && (
                          <button
                            onClick={() => handleExport("srt")}
                            className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                          >
                            <FiDownload />
                            Xuất SRT
                          </button>
                        )}
                        {exportFormats.vtt && (
                          <button
                            onClick={() => handleExport("vtt")}
                            className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                          >
                            <FiDownload />
                            Xuất VTT
                          </button>
                        )}
                      </div>
                    )}

                    {(subtitles.length > 0 || videoFile) && (
                      <button
                        onClick={handleReset}
                        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                      >
                        Chọn video khác
                      </button>
                    )}
                  </div>
                )}

                {/* Info Cards */}
                {!videoUrl && (
                  <div className="space-y-3.5">
                    {/* Features */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Tính năng
                      </h3>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { icon: "🤖", text: "AI tự động" },
                          { icon: "🌍", text: "20+ ngôn ngữ" },
                          { icon: "✨", text: "Chính xác cao" },
                          { icon: "⚡", text: "Xử lý nhanh" },
                        ].map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                          >
                            <span>{feature.icon}</span>
                            <span className="text-xs font-medium text-gray-700">
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-2.5">
                        Hướng dẫn
                      </h3>
                      <ol className="space-y-2">
                        {[
                          "Tải video lên",
                          "Chọn ngôn ngữ và định dạng",
                          "Nhấn tách phụ đề",
                          "Chỉnh sửa nếu cần",
                          "Tải xuống file",
                        ].map((step, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs"
                          >
                            <span className="flex items-center justify-center w-5 h-5 bg-brand-600 text-white rounded-full font-semibold text-[10px] flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-gray-700 pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* History Tab */
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    Lịch sử
                  </h3>
                  <button
                    onClick={loadHistory}
                    disabled={historyLoading}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium disabled:text-gray-400"
                  >
                    {historyLoading ? "Đang tải..." : "Làm mới"}
                  </button>
                </div>

                {historyLoading && history.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    Đang tải lịch sử...
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-500">
                    Chưa có lịch sử
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto sidebar-scrollbar">
                    {history.map((job) => {
                      const completedDate = job.completedAt
                        ? new Date(job.completedAt)
                        : null;
                      const timeAgo = completedDate
                        ? getTimeAgo(completedDate)
                        : "";

                      return (
                        <div
                          key={job.jobId}
                          className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {job.originalFileName || "video"}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                <span>{job.subtitlesCount} phụ đề</span>
                                <span>•</span>
                                <span>{job.language.toUpperCase()}</span>
                                {timeAgo && (
                                  <>
                                    <span>•</span>
                                    <span>{timeAgo}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {job.outFiles?.some((f) => f.ext === "srt") && (
                              <button
                                onClick={() =>
                                  downloadFromHistory(job.jobId, "srt")
                                }
                                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition"
                              >
                                <FiDownload className="text-xs" />
                                SRT
                              </button>
                            )}
                            {job.outFiles?.some((f) => f.ext === "vtt") && (
                              <button
                                onClick={() =>
                                  downloadFromHistory(job.jobId, "vtt")
                                }
                                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition"
                              >
                                <FiDownload className="text-xs" />
                                VTT
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Timeline & Subtitles - Only show in extract tab */}
          {activeTab === "extract" && (
            <div className="space-y-4">
              {subtitles.length > 0 ? (
                <>
                  {/* Timeline */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      Timeline phụ đề
                    </h3>

                    <div className="relative h-12 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {subtitles.map((sub) => {
                        const duration =
                          subtitles[subtitles.length - 1]?.end || 20;
                        const left = (sub.start / duration) * 100;
                        const width = ((sub.end - sub.start) / duration) * 100;
                        const isActive =
                          currentTime >= sub.start && currentTime < sub.end;

                        return (
                          <div
                            key={sub.id}
                            className={`absolute h-full border-r border-white cursor-pointer transition ${
                              isActive
                                ? "bg-brand-600"
                                : "bg-gray-300 hover:bg-gray-400"
                            }`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                            }}
                            onClick={() => handleSeek(sub.start)}
                            title={`${formatTime(sub.start)} - ${formatTime(
                              sub.end
                            )}`}
                          />
                        );
                      })}

                      {videoUrl && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                          style={{
                            left: `${
                              (currentTime /
                                (subtitles[subtitles.length - 1]?.end || 20)) *
                              100
                            }%`,
                          }}
                        >
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                      )}
                    </div>

                    {videoUrl && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          {formatTime(currentTime)}
                        </span>
                        <span>/</span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                          {formatTime(
                            subtitles[subtitles.length - 1]?.end || 0
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Subtitles */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        Danh sách phụ đề
                      </h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                        {subtitles.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto sidebar-scrollbar pr-1">
                      {subtitles.map((sub, index) => {
                        const isActive =
                          currentTime >= sub.start && currentTime < sub.end;

                        return (
                          <div
                            key={sub.id}
                            className={`p-3 rounded-lg border transition ${
                              isActive
                                ? "border-brand-500 bg-brand-50"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-2">
                              <span
                                className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                                  isActive
                                    ? "bg-brand-600 text-white"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1.5">
                                  <FiClock className="flex-shrink-0" />
                                  <span>
                                    {formatTime(sub.start)} →{" "}
                                    {formatTime(sub.end)}
                                  </span>
                                </div>
                                <textarea
                                  value={sub.text}
                                  onChange={(e) =>
                                    handleSubtitleEdit(sub.id, e.target.value)
                                  }
                                  className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                  rows={2}
                                  placeholder="Nhập nội dung..."
                                />
                              </div>
                              <button
                                onClick={() => handleSubtitleDelete(sub.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                                title="Xóa"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleSeek(sub.start)}
                              className="text-[10px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 ml-8"
                            >
                              <CiPlay1 className="text-xs" />
                              Xem tại {formatTime(sub.start)}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <FiVideo className="text-3xl text-gray-400" />
                    </div>
                    <p className="text-base text-gray-500 font-medium">
                      {videoUrl
                        ? "Nhấn 'Bắt đầu tách phụ đề' để xử lý"
                        : "Tải video lên để bắt đầu"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}
