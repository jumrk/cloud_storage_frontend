"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { extractSubtitleService } from "../services/extractSubtitleService";
import toast from "react-hot-toast";

export default function useExtractSubtitle() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [subtitles, setSubtitles] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const pollingIntervalRef = useRef(null);

  const startExtraction = useCallback(async (videoFile, lang = "auto") => {
    if (!videoFile) {
      toast.error("Vui lòng chọn file video");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    setSubtitles([]);
    setStatus("extracting");

    try {
      const response = await extractSubtitleService.startExtraction(
        videoFile,
        lang
      );

      if (response.success && response.jobId) {
        setJobId(response.jobId);
        toast.success("Đã bắt đầu tách phụ đề...");
        // Start polling
        startPolling(response.jobId);
      } else {
        throw new Error(response.messenger || "Không thể bắt đầu tách phụ đề");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.messenger ||
        err.message ||
        "Lỗi khi tách phụ đề";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  }, []);

  const startPolling = useCallback((jobIdToPoll) => {
    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll immediately
    checkStatus(jobIdToPoll);

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkStatus(jobIdToPoll);
    }, 2000);
  }, []);

  const checkStatus = useCallback(async (jobIdToCheck) => {
    try {
      const response = await extractSubtitleService.getStatus(jobIdToCheck);

      if (response.success) {
        const currentStatus = response.status;
        const currentProgress = response.progress || 0;
        const currentSubtitles = response.subtitles || [];

        setStatus(currentStatus);
        setProgress(currentProgress);

        if (currentSubtitles.length > 0) {
          // Convert backend format to UI format
          const formattedSubtitles = currentSubtitles.map((sub, idx) => ({
            id: String(sub.id || idx + 1),
            start: sub.start,
            end: sub.end,
            text: sub.text || "",
          }));
          setSubtitles(formattedSubtitles);
        }

        // Stop polling if done or error
        if (currentStatus === "done" || currentStatus === "error") {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setLoading(false);

          if (currentStatus === "done") {
            toast.success("Tách phụ đề thành công!");
          } else if (currentStatus === "error") {
            const errorMsg = response.error || "Lỗi khi tách phụ đề";
            setError(errorMsg);
            toast.error(errorMsg);
          }
        }
      }
    } catch (err) {
      console.error("Error checking status:", err);
      // Don't show error toast on every poll failure
      // Only stop polling if it's a critical error
      if (err.response?.status === 404) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setError("Không tìm thấy job");
        setLoading(false);
      }
    }
  }, []);

  const downloadSubtitle = useCallback(
    async (format = "srt") => {
      if (!jobId) {
        toast.error("Không có job để tải xuống");
        return;
      }

      try {
        const blob = await extractSubtitleService.downloadSubtitle(jobId, format);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `subtitles.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Đã tải xuống file ${format.toUpperCase()}`);
      } catch (err) {
        const errorMessage =
          err.response?.data?.messenger ||
          err.message ||
          "Lỗi khi tải xuống file";
        toast.error(errorMessage);
      }
    },
    [jobId]
  );

  const reset = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setLoading(false);
    setError(null);
    setJobId(null);
    setStatus(null);
    setProgress(0);
    setSubtitles([]);
  }, []);

  // Load history
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await extractSubtitleService.getHistory();
      if (response.success) {
        setHistory(response.jobs || []);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Download from history
  const downloadFromHistory = useCallback(
    async (historyJobId, format = "srt") => {
      try {
        const blob = await extractSubtitleService.downloadSubtitle(
          historyJobId,
          format
        );
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `subtitles.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(`Đã tải xuống file ${format.toUpperCase()}`);
      } catch (err) {
        const errorMessage =
          err.response?.data?.messenger ||
          err.message ||
          "Lỗi khi tải xuống file";
        toast.error(errorMessage);
      }
    },
    []
  );

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Reload history when job completes
  useEffect(() => {
    if (status === "done") {
      loadHistory();
    }
  }, [status, loadHistory]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  }, []);

  return {
    loading,
    error,
    jobId,
    status,
    progress,
    subtitles,
    history,
    historyLoading,
    startExtraction,
    downloadSubtitle,
    downloadFromHistory,
    loadHistory,
    reset,
    cleanup,
  };
}
