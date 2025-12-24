"use client";

import React, { useState, useRef, useEffect } from "react";
import { CiPlay1, CiPause1 } from "react-icons/ci";
import {
  FiUpload,
  FiVideo,
  FiCrop,
  FiDownload,
  FiRotateCcw,
  FiCheckCircle,
  FiChevronDown,
  FiList,
} from "react-icons/fi";
import { useTranslations } from "next-intl";
import Popover from "@/shared/ui/Popover";
import useHardsub from "../hooks/useHardsub";

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export default function HardsubPage() {
  const t = useTranslations();

  // Video state
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Region selection state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [region, setRegion] = useState(null); // { x, y, width, height }
  const [showRegionHint, setShowRegionHint] = useState(true);
  const [dragAction, setDragAction] = useState(null); // 'draw' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'resize-t' | 'resize-r' | 'resize-b' | 'resize-l'
  const [dragStart, setDragStart] = useState(null);
  const [originalRegion, setOriginalRegion] = useState(null);
  const [cursorStyle, setCursorStyle] = useState("crosshair");

  // UI state
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0]);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [confidence, setConfidence] = useState(0.8);
  const [activeTab, setActiveTab] = useState("extract"); // "extract" or "history"

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const languageDropdownRef = useRef(null);

  // Use hardsub hook
  const {
    loading: isProcessing,
    progress,
    phase,
    subtitles,
    history,
    historyLoading,
    startExtraction,
    downloadSubtitle,
    downloadFromHistory,
    loadHistory,
    reset: resetExtraction,
    cleanup,
  } = useHardsub();

  // Editable subtitles state (local copy for editing)
  const [editedSubtitles, setEditedSubtitles] = useState([]);

  // Sync subtitles from hook to editable state
  useEffect(() => {
    if (subtitles.length > 0) {
      setEditedSubtitles(subtitles);
    }
  }, [subtitles]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setRegion(null);
      setShowRegionHint(true);
      resetExtraction(); // Reset extraction state
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setRegion(null);
      setSubtitles([]);
      setShowRegionHint(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
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

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const time = pos * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Canvas drawing for region selection
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Detect what user clicked on
  const detectClickTarget = (coords) => {
    if (!region) return "draw";

    const handleSize = 10;
    const handleTolerance = 5;

    // Check corner handles
    const corners = {
      "resize-tl": { x: region.x, y: region.y },
      "resize-tr": { x: region.x + region.width, y: region.y },
      "resize-bl": { x: region.x, y: region.y + region.height },
      "resize-br": { x: region.x + region.width, y: region.y + region.height },
    };

    for (const [action, pos] of Object.entries(corners)) {
      if (
        Math.abs(coords.x - pos.x) < handleSize + handleTolerance &&
        Math.abs(coords.y - pos.y) < handleSize + handleTolerance
      ) {
        return action;
      }
    }

    // Check edge handles
    const edges = {
      "resize-t":
        coords.y >= region.y - handleTolerance &&
        coords.y <= region.y + handleTolerance &&
        coords.x >= region.x &&
        coords.x <= region.x + region.width,
      "resize-b":
        coords.y >= region.y + region.height - handleTolerance &&
        coords.y <= region.y + region.height + handleTolerance &&
        coords.x >= region.x &&
        coords.x <= region.x + region.width,
      "resize-l":
        coords.x >= region.x - handleTolerance &&
        coords.x <= region.x + handleTolerance &&
        coords.y >= region.y &&
        coords.y <= region.y + region.height,
      "resize-r":
        coords.x >= region.x + region.width - handleTolerance &&
        coords.x <= region.x + region.width + handleTolerance &&
        coords.y >= region.y &&
        coords.y <= region.y + region.height,
    };

    for (const [action, isOnEdge] of Object.entries(edges)) {
      if (isOnEdge) return action;
    }

    // Check if inside region
    if (
      coords.x >= region.x &&
      coords.x <= region.x + region.width &&
      coords.y >= region.y &&
      coords.y <= region.y + region.height
    ) {
      return "move";
    }

    return "draw";
  };

  // Update cursor based on hover position
  const handleCanvasMouseMove = (e) => {
    const coords = getCanvasCoordinates(e);
    const target = detectClickTarget(coords);

    const cursorMap = {
      draw: "crosshair",
      move: "move",
      "resize-tl": "nwse-resize",
      "resize-tr": "nesw-resize",
      "resize-bl": "nesw-resize",
      "resize-br": "nwse-resize",
      "resize-t": "ns-resize",
      "resize-b": "ns-resize",
      "resize-l": "ew-resize",
      "resize-r": "ew-resize",
    };

    setCursorStyle(cursorMap[target] || "crosshair");

    // Continue with drag action if active
    if (!isDrawing || !dragAction || !dragStart) return;

    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;

    if (dragAction === "draw") {
      // Drawing new region
      if (!startPoint) return;
      const width = coords.x - startPoint.x;
      const height = coords.y - startPoint.y;
      setRegion({
        x: width > 0 ? startPoint.x : coords.x,
        y: height > 0 ? startPoint.y : coords.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
    } else if (dragAction === "move") {
      // Moving existing region
      if (!originalRegion) return;
      setRegion({
        x: originalRegion.x + dx,
        y: originalRegion.y + dy,
        width: originalRegion.width,
        height: originalRegion.height,
      });
    } else if (dragAction.startsWith("resize-")) {
      // Resizing existing region
      if (!originalRegion) return;
      let newRegion = { ...originalRegion };

      if (dragAction.includes("t")) {
        newRegion.y = originalRegion.y + dy;
        newRegion.height = originalRegion.height - dy;
      }
      if (dragAction.includes("b")) {
        newRegion.height = originalRegion.height + dy;
      }
      if (dragAction.includes("l")) {
        newRegion.x = originalRegion.x + dx;
        newRegion.width = originalRegion.width - dx;
      }
      if (dragAction.includes("r")) {
        newRegion.width = originalRegion.width + dx;
      }

      // Ensure minimum size
      if (newRegion.width > 20 && newRegion.height > 20) {
        setRegion(newRegion);
      }
    }
  };

  const handleMouseDown = (e) => {
    if (isProcessing) return;
    const coords = getCanvasCoordinates(e);
    const action = detectClickTarget(coords);

    setIsDrawing(true);
    setDragAction(action);
    setDragStart(coords);

    if (action === "draw") {
      setStartPoint(coords);
      setRegion(null);
      setShowRegionHint(false);
    } else {
      setOriginalRegion({ ...region });
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setDragAction(null);
    setDragStart(null);
    setStartPoint(null);
    setOriginalRegion(null);
  };

  // Draw region on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");

    const draw = () => {
      // Set canvas size to match video
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw region if exists
      if (region) {
        // Darken outside region
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.clearRect(region.x, region.y, region.width, region.height);

        // Draw border around region
        ctx.strokeStyle = "#0e5f9b";
        ctx.lineWidth = 3;
        ctx.strokeRect(region.x, region.y, region.width, region.height);

        // Draw handles
        const handleSize = 10;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#0e5f9b";
        ctx.lineWidth = 2;

        // Corner handles
        const drawHandle = (x, y) => {
          ctx.fillRect(
            x - handleSize / 2,
            y - handleSize / 2,
            handleSize,
            handleSize
          );
          ctx.strokeRect(
            x - handleSize / 2,
            y - handleSize / 2,
            handleSize,
            handleSize
          );
        };

        // 4 corners
        drawHandle(region.x, region.y); // Top-left
        drawHandle(region.x + region.width, region.y); // Top-right
        drawHandle(region.x, region.y + region.height); // Bottom-left
        drawHandle(region.x + region.width, region.y + region.height); // Bottom-right

        // 4 edges (midpoints)
        drawHandle(region.x + region.width / 2, region.y); // Top
        drawHandle(region.x + region.width / 2, region.y + region.height); // Bottom
        drawHandle(region.x, region.y + region.height / 2); // Left
        drawHandle(region.x + region.width, region.y + region.height / 2); // Right
      }
    };

    draw();
    const interval = setInterval(draw, 100);
    return () => clearInterval(interval);
  }, [region]);

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
    setRegion(null);
    setShowRegionHint(true);
    resetExtraction(); // Reset extraction state
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

  const handleClearRegion = () => {
    setRegion(null);
    setShowRegionHint(true);
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setIsLanguageOpen(false);
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

  const handleStartExtraction = async () => {
    if (!region) {
      return;
    }
    if (!videoFile) {
      return;
    }
    await startExtraction(videoFile, region, selectedLanguage.code, confidence);
  };

  const handleDownload = async (format = "srt") => {
    await downloadSubtitle(format);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brand-50 p-2.5 rounded-full">
          <FiCrop className="text-xl text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hardsub - Tách phụ đề nhúng
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Video Upload & Player with Region Selection */}
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
                <FiCrop className="text-base" />
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
                  className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-brand-500 transition cursor-pointer bg-white shadow-sm"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                    <FiUpload className="text-3xl text-brand-600" />
                  </div>
                  <p className="text-base font-medium text-gray-900 mb-2">
                    Kéo thả video vào đây hoặc click để chọn
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Hỗ trợ: MP4, MOV, AVI, MKV (tối đa 500MB)
                  </p>
                  <div className="flex justify-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      MP4
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      MOV
                    </span>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      AVI
                    </span>
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
                <div className="space-y-4.5">
                  {/* Video Player with Canvas Overlay */}
                  <div className="relative bg-black rounded-lg overflow-hidden shadow-lg">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-auto"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />

                    {/* Canvas overlay for region selection */}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ cursor: cursorStyle }}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />

                    {/* Hint overlay */}
                    {showRegionHint && !region && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                        <div className="bg-white/90 rounded-lg p-4 max-w-xs text-center">
                          <FiCrop className="text-3xl text-gray-700 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-800">
                            Kéo chuột để chọn vùng phụ đề
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Vùng chọn là nơi phụ đề xuất hiện trên video
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Play/Pause Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <button
                        onClick={handlePlayPause}
                        className="pointer-events-auto bg-white/90 rounded-full p-4 hover:bg-white transition shadow-md"
                      >
                        {isPlaying ? (
                          <CiPause1 className="text-3xl text-gray-800" />
                        ) : (
                          <CiPlay1 className="text-3xl text-gray-800" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Video Controls */}
                  <div className="space-y-2">
                    {/* Timeline */}
                    <div
                      className="h-2 bg-gray-200 rounded-full cursor-pointer relative"
                      onClick={handleSeek}
                    >
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-brand-600 rounded-full shadow-sm"
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Region Info */}
                  {region && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiCheckCircle className="text-emerald-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Đã chọn vùng phụ đề
                          </p>
                          <p className="text-xs text-gray-600">
                            {Math.round(region.width)} x{" "}
                            {Math.round(region.height)} px
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleClearRegion}
                        className="text-sm text-gray-700 hover:text-gray-900 transition"
                      >
                        Chọn lại
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleStartExtraction}
                      disabled={!region || isProcessing}
                      className="w-full bg-brand-500 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-brand-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition"
                    >
                      {isProcessing
                        ? `Đang xử lý... ${progress}%`
                        : region
                        ? "Bắt đầu tách phụ đề"
                        : "Vui lòng chọn vùng subtitle"}
                    </button>

                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 text-center">
                          {progress}% hoàn thành
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleReset}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <FiRotateCcw />
                      Chọn video khác
                    </button>
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

        {/* Right: Settings & Results - Only show in extract tab */}
        {activeTab === "extract" && (
          <div className="space-y-4.5">
            {videoUrl ? (
              <>
                {/* Settings Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <h2 className="text-base font-semibold text-gray-900 mb-3.5">
                    Cài đặt OCR
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngôn ngữ phụ đề
                      </label>
                      <div className="relative" ref={languageDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-gray-400 transition bg-white"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-lg">
                              {selectedLanguage.flag}
                            </span>
                            <span className="text-gray-900">
                              {selectedLanguage.label}
                            </span>
                          </span>
                          <FiChevronDown
                            className={`text-gray-400 transition-transform ${
                              isLanguageOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <Popover
                          open={isLanguageOpen}
                          className="w-full mt-1 max-h-64 overflow-y-auto sidebar-scrollbar bg-white border border-gray-200 rounded-lg shadow-lg"
                        >
                          <div className="py-1">
                            {LANGUAGES.map((lang) => (
                              <button
                                key={lang.code}
                                type="button"
                                onClick={() => handleLanguageSelect(lang)}
                                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition ${
                                  selectedLanguage.code === lang.code
                                    ? "bg-brand-50 text-brand-700 font-medium"
                                    : "text-gray-900"
                                }`}
                              >
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.label}</span>
                                {selectedLanguage.code === lang.code && (
                                  <span className="ml-auto text-brand-600">
                                    ✓
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </Popover>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Độ tin cậy: {Math.round(confidence * 100)}%
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={confidence * 100}
                        onChange={(e) =>
                          setConfidence(Number(e.target.value) / 100)
                        }
                        className="w-full"
                        disabled={isProcessing}
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Chỉ giữ lại text có độ tin cậy trên ngưỡng này
                      </p>
                    </div>
                  </div>
                </div>

                {/* Results: Timeline & Editable Subtitles */}
                {subtitles.length > 0 && (
                  <>
                    {/* Timeline */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Timeline phụ đề
                      </h3>

                      <div className="relative h-12 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {editedSubtitles.map((sub) => {
                          const duration =
                            editedSubtitles[editedSubtitles.length - 1]?.end ||
                            20;
                          const left = (sub.start / duration) * 100;
                          const width =
                            ((sub.end - sub.start) / duration) * 100;
                          const isActive =
                            currentTime >= sub.start && currentTime < sub.end;

                          return (
                            <div
                              key={sub.id}
                              className={`absolute top-0 h-full border-l-2 ${
                                isActive
                                  ? "bg-brand-500 border-brand-700"
                                  : "bg-brand-200 border-brand-400"
                              } transition-colors cursor-pointer hover:bg-brand-400`}
                              style={{ left: `${left}%`, width: `${width}%` }}
                              title={sub.text}
                              onClick={() => {
                                if (videoRef.current) {
                                  videoRef.current.currentTime = sub.start;
                                }
                              }}
                            />
                          );
                        })}
                      </div>

                      <div className="text-xs text-gray-600 flex justify-between">
                        <span>0:00</span>
                        <span>
                          {formatTime(
                            editedSubtitles[editedSubtitles.length - 1]?.end ||
                              0
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Editable Subtitles List */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3.5">
                        <h2 className="text-base font-semibold text-gray-900">
                          Phụ đề đã tách ({editedSubtitles.length})
                        </h2>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload("srt")}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
                          >
                            <FiDownload />
                            Xuất SRT
                          </button>
                          <button
                            onClick={() => handleDownload("vtt")}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition"
                          >
                            <FiDownload />
                            Xuất VTT
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3.5 max-h-[500px] overflow-y-auto sidebar-scrollbar">
                        {editedSubtitles.map((sub, index) => {
                          const isActive =
                            currentTime >= sub.start && currentTime < sub.end;

                          return (
                            <div
                              key={sub.id}
                              className={`p-3 border rounded-lg transition ${
                                isActive
                                  ? "border-brand-500 bg-brand-50"
                                  : "border-gray-200 bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                  <div className="text-xs text-gray-600 mb-2">
                                    <span className="inline-block w-5 h-5 bg-brand-600 text-white text-center rounded-full mr-2 text-xs leading-5">
                                      {index + 1}
                                    </span>
                                    {formatTime(sub.start)} →{" "}
                                    {formatTime(sub.end)}
                                  </div>
                                  <textarea
                                    value={sub.text}
                                    onChange={(e) => {
                                      const updated = [...editedSubtitles];
                                      updated[index] = {
                                        ...sub,
                                        text: e.target.value,
                                      };
                                      setEditedSubtitles(updated);
                                    }}
                                    className="w-full text-sm text-gray-900 bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Instructions */}
                {!subtitles.length && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-900 mb-3">
                      Hướng dẫn sử dụng
                    </h2>
                    <ol className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start">
                        <span className="font-semibold text-gray-900 mr-2">
                          1.
                        </span>
                        <span>Tải video có phụ đề nhúng (hardcoded) lên</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-gray-900 mr-2">
                          2.
                        </span>
                        <span>
                          Kéo chuột để chọn vùng chứa phụ đề trên video
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-gray-900 mr-2">
                          3.
                        </span>
                        <span>Chọn ngôn ngữ phụ đề và điều chỉnh cài đặt</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-gray-900 mr-2">
                          4.
                        </span>
                        <span>Nhấn "Bắt đầu tách phụ đề" để xử lý</span>
                      </li>
                      <li className="flex items-start">
                        <span className="font-semibold text-gray-900 mr-2">
                          5.
                        </span>
                        <span>Xuất file SRT khi hoàn tất</span>
                      </li>
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  Hardsub là gì?
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  Hardsub (hard subtitle) là phụ đề được "in" cố định vào video,
                  không thể tắt được. Công cụ này sử dụng OCR để nhận dạng và
                  tách phụ đề từ video.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Hỗ trợ nhiều ngôn ngữ</li>
                  <li>Độ chính xác cao với Google Cloud Vision</li>
                  <li>Xuất file SRT/VTT chuẩn</li>
                </ul>
              </div>
            )}
          </div>
        )}
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
