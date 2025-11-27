"use client";

import React, { useState, useRef, useEffect } from "react";
import { Video, Music, FileText, X, Download, Loader2 } from "lucide-react";
import Popover from "@/shared/ui/Popover";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function ExportMenu({ projectId, isOpen, onClose }) {
  const t = useTranslations();
  const [exportType, setExportType] = useState(null); // 'video' | 'audio' | 'subtitle'
  const [isExporting, setIsExporting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);

  // Video export options
  const [videoOptions, setVideoOptions] = useState({
    resolution: "1920x1080",
    fps: 30,
    quality: "high",
    format: "mp4",
  });

  // Audio export options
  const [audioOptions, setAudioOptions] = useState({
    format: "mp3",
    bitrate: "192k",
  });

  // Subtitle export options
  const [subtitleOptions, setSubtitleOptions] = useState({
    format: "srt",
  });

  const resolutions = [
    { label: "4K (3840x2160)", value: "3840x2160" },
    { label: "2K (2560x1440)", value: "2560x1440" },
    { label: "Full HD (1920x1080)", value: "1920x1080" },
    { label: "HD (1280x720)", value: "1280x720" },
    { label: "SD (854x480)", value: "854x480" },
  ];

  const fpsOptions = [24, 30, 60];

  const qualityOptions = [
    { label: t("video_processor.inspector.stage.export_menu.quality_high"), value: "high" },
    { label: t("video_processor.inspector.stage.export_menu.quality_medium"), value: "medium" },
    { label: t("video_processor.inspector.stage.export_menu.quality_low"), value: "low" },
  ];

  const audioFormats = [
    { label: "MP3", value: "mp3" },
    { label: "WAV", value: "wav" },
    { label: "AAC", value: "aac" },
  ];

  const subtitleFormats = [
    { label: "SRT", value: "srt" },
    { label: "VTT", value: "vtt" },
  ];

  useEffect(() => {
    if (!isOpen) {
      setExportType(null);
      setIsExporting(false);
      setJobId(null);
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (jobId && isExporting) {
      progressIntervalRef.current = setInterval(async () => {
        try {
          const res = await axiosClient.get(
            `/api/video-processor/project/${projectId}/export/progress/${jobId}`
          );
          if (res.data?.success) {
            const { status, progress: prog, message } = res.data;
            setProgress(prog || 0);

            if (status === "completed") {
              setIsExporting(false);
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
              downloadExport();
            } else if (status === "error") {
              setIsExporting(false);
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
              toast.error(message || t("video_processor.inspector.stage.export_menu.export_failed"));
            }
          }
        } catch (err) {
          console.error("Error checking export progress:", err);
        }
      }, 1000);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [jobId, isExporting, projectId]);

  const handleExport = async (type) => {
    try {
      setIsExporting(true);
      setProgress(0);

      let endpoint = "";
      let payload = {};

      if (type === "video") {
        endpoint = `/api/video-processor/project/${projectId}/export/video`;
        payload = videoOptions;
      } else if (type === "audio") {
        endpoint = `/api/video-processor/project/${projectId}/export/audio`;
        payload = audioOptions;
      } else if (type === "subtitle") {
        endpoint = `/api/video-processor/project/${projectId}/export/subtitle`;
        payload = subtitleOptions;
      }

      const res = await axiosClient.post(endpoint, payload);
      if (res.data?.success && res.data?.jobId) {
        setJobId(res.data.jobId);
        toast.success(t("video_processor.inspector.stage.export_menu.export_processing"));
      } else {
        throw new Error(res.data?.message || t("video_processor.inspector.stage.export_menu.cannot_start_export"));
      }
    } catch (err) {
      console.error("Error starting export:", err);
      setIsExporting(false);
      toast.error(
        err?.response?.data?.message || err?.message || t("video_processor.inspector.stage.export_menu.export_failed")
      );
    }
  };

  const downloadExport = async () => {
    if (!jobId) return;

    try {
      const response = await axiosClient.get(
        `/api/video-processor/project/${projectId}/export/result/${jobId}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      let filename = "export";
      if (exportType === "video") {
        filename = `video_${Date.now()}.${videoOptions.format}`;
      } else if (exportType === "audio") {
        filename = `audio_${Date.now()}.${audioOptions.format}`;
      } else if (exportType === "subtitle") {
        filename = `subtitle_${Date.now()}.${subtitleOptions.format}`;
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t("video_processor.inspector.stage.export_menu.download_success"));
      onClose();
    } catch (err) {
      console.error("Error downloading export:", err);
      toast.error(t("video_processor.inspector.stage.export_menu.cannot_download"));
    }
  };

  if (!isOpen) return null;

  return (
    <Popover open={isOpen} className="right-0 w-96">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="text-sm font-semibold text-text-strong">{t("video_processor.inspector.stage.export_menu.title")}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-50 text-text-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Export Type Selection */}
        {!exportType && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setExportType("video")}
              className="w-full p-3 rounded-lg border border-border bg-white hover:bg-surface-50 transition flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-strong">
                  {t("video_processor.inspector.stage.export_menu.export_video")}
                </div>
                <div className="text-xs text-text-muted">
                  {t("video_processor.inspector.stage.export_menu.export_video_description")}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExportType("audio")}
              className="w-full p-3 rounded-lg border border-border bg-white hover:bg-surface-50 transition flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Music className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-strong">
                  {t("video_processor.inspector.stage.export_menu.export_audio")}
                </div>
                <div className="text-xs text-text-muted">
                  {t("video_processor.inspector.stage.export_menu.export_audio_description")}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExportType("subtitle")}
              className="w-full p-3 rounded-lg border border-border bg-white hover:bg-surface-50 transition flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-text-strong">
                  {t("video_processor.inspector.stage.export_menu.export_subtitle")}
                </div>
                <div className="text-xs text-text-muted">
                  {t("video_processor.inspector.stage.export_menu.export_subtitle_description")}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Video Export Options */}
        {exportType === "video" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <button
                type="button"
                onClick={() => setExportType(null)}
                className="p-1 rounded hover:bg-surface-50 text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
              <h4 className="text-sm font-medium text-text-strong">
                {t("video_processor.inspector.stage.export_menu.video_options")}
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-strong mb-1.5 block">
                  {t("video_processor.inspector.stage.export_menu.resolution")}
                </label>
                <select
                  value={videoOptions.resolution}
                  onChange={(e) =>
                    setVideoOptions({ ...videoOptions, resolution: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {resolutions.map((res) => (
                    <option key={res.value} value={res.value}>
                      {res.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text-strong mb-1.5 block">
                  FPS
                </label>
                <select
                  value={videoOptions.fps}
                  onChange={(e) =>
                    setVideoOptions({
                      ...videoOptions,
                      fps: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {fpsOptions.map((fps) => (
                    <option key={fps} value={fps}>
                      {fps} fps
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text-strong mb-1.5 block">
                  {t("video_processor.inspector.stage.export_menu.quality")}
                </label>
                <select
                  value={videoOptions.quality}
                  onChange={(e) =>
                    setVideoOptions({ ...videoOptions, quality: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {qualityOptions.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{t("video_processor.inspector.stage.export_menu.processing")}</span>
                  <span className="text-text-strong">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleExport("video")}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("video_processor.inspector.stage.export_menu.processing")}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t("video_processor.inspector.stage.export_menu.export_video")}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Audio Export Options */}
        {exportType === "audio" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <button
                type="button"
                onClick={() => setExportType(null)}
                className="p-1 rounded hover:bg-surface-50 text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
              <h4 className="text-sm font-medium text-text-strong">
                {t("video_processor.inspector.stage.export_menu.audio_options")}
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-strong mb-1.5 block">
                  {t("video_processor.inspector.stage.export_menu.format")}
                </label>
                <select
                  value={audioOptions.format}
                  onChange={(e) =>
                    setAudioOptions({ ...audioOptions, format: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {audioFormats.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-text-strong mb-1.5 block">
                  {t("video_processor.inspector.stage.export_menu.bitrate")}
                </label>
                <select
                  value={audioOptions.bitrate}
                  onChange={(e) =>
                    setAudioOptions({ ...audioOptions, bitrate: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="128k">128 kbps</option>
                  <option value="192k">192 kbps</option>
                  <option value="256k">256 kbps</option>
                  <option value="320k">320 kbps</option>
                </select>
              </div>
            </div>

            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{t("video_processor.inspector.stage.export_menu.processing")}</span>
                  <span className="text-text-strong">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleExport("audio")}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("video_processor.inspector.stage.export_menu.processing")}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t("video_processor.inspector.stage.export_menu.export_audio")}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Subtitle Export Options */}
        {exportType === "subtitle" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <button
                type="button"
                onClick={() => setExportType(null)}
                className="p-1 rounded hover:bg-surface-50 text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
              <h4 className="text-sm font-medium text-text-strong">
                {t("video_processor.inspector.stage.export_menu.subtitle_options")}
              </h4>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-strong mb-1.5 block">
                  {t("video_processor.inspector.stage.export_menu.format")}
                </label>
                <select
                  value={subtitleOptions.format}
                  onChange={(e) =>
                    setSubtitleOptions({
                      ...subtitleOptions,
                      format: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {subtitleFormats.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleExport("subtitle")}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("video_processor.inspector.stage.export_menu.processing")}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t("video_processor.inspector.stage.export_menu.export_subtitle")}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Popover>
  );
}

