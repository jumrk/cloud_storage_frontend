import { useCallback, useEffect, useRef, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";

const PHASE_TEXT = {
  init: "Khởi tạo tác vụ…",
  "probe-embedded": "Đang dò phụ đề nhúng…",
  "embedded-found": "Đã tìm thấy phụ đề nhúng, đang xử lý…",
  "prepare-audio": "Đang chuẩn hoá âm thanh…",
  "audio-prep": "Đang chuẩn hoá âm thanh…",
  "audio-prep-skip": "Bỏ qua chuẩn hoá âm thanh…",
  "lang-detect": "Đang nhận diện ngôn ngữ…",
  "asr-start": "Đang nhận diện giọng nói (ASR)…",
  "asr-whisperx-load": "Đang tải mô hình ASR…",
  "asr-funasr": "Đang nhận diện tiếng Trung (Paraformer)…",
  "format-srt": "Đang định dạng phụ đề…",
  "parse-cues": "Đang phân tích phụ đề…",
  "store-assets": "Đang lưu tệp phụ đề…",
  "asr-finished": "Đã hoàn tất nhận diện, đang kết xuất…",
  done: "Hoàn tất.",
  error: "Có lỗi xảy ra.",
};

const INDETERMINATE_PHASES = new Set([
  "asr-start",
  "asr-whisperx-load",
  "lang-detect",
  "prepare-audio",
  "audio-prep",
]);

function formatPhase(phase = "") {
  if (!phase) return "";
  if (phase.startsWith("lang="))
    return `Ngôn ngữ: ${phase.slice(5).toUpperCase()}`;
  return PHASE_TEXT[phase] || phase;
}

export default function useSubFromAsset({
  projectId,
  selectedClip,
  onReloadProject,
  storeAsset = false,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [loadingText, setLoadingText] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null);
  const [phase, setPhase] = useState("");

  const jobIdRef = useRef(null);
  const pollTimerRef = useRef(null);
  const smoothTimerRef = useRef(null);
  const lastStatusRef = useRef(null);
  const pollErrorCountRef = useRef(0);
  const clearSmooth = useCallback(() => {
    if (smoothTimerRef.current) {
      clearInterval(smoothTimerRef.current);
      smoothTimerRef.current = null;
    }
  }, []);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startSmoothing = useCallback(() => {
    if (smoothTimerRef.current) return;
    smoothTimerRef.current = setInterval(() => {
      setProgress((p) => {
        const cap = 84;
        if (p >= cap) return p;
        const step = p < 60 ? 1.5 : 0.8;
        const next = Math.min(cap, Math.round((p + step) * 10) / 10);
        return next;
      });
    }, 900);
  }, []);

  const stopSmoothing = useCallback(() => {
    clearSmooth();
  }, [clearSmooth]);

  const updateUI = useCallback(
    (st, pr, ph) => {
      setStatus(st || null);
      setPhase(ph || "");
      const phText = formatPhase(ph);

      if (st === "extracting")
        setLoadingText(phText || "Đang trích xuất & chuẩn bị dữ liệu…");
      else if (st === "asr")
        setLoadingText(phText || "Đang nhận diện giọng nói (ASR)…");
      else if (st === "done") setLoadingText("Hoàn tất.");
      else if (st === "error") setLoadingText("Lỗi tách phụ đề.");
      else setLoadingText(phText || "");

      setProgress((prev) =>
        typeof pr === "number"
          ? Math.max(prev, Math.min(100, Math.max(0, pr)))
          : prev
      );

      const indeterminate = st === "asr" && INDETERMINATE_PHASES.has(ph || "");
      if (indeterminate) startSmoothing();
      else stopSmoothing();

      if (st === "done" || st === "error") stopSmoothing();
    },
    [startSmoothing, stopSmoothing]
  );

  const poll = useCallback(
    async (jobId) => {
      if (!jobId) return;
      try {
        const res = await axiosClient.get(
          `/api/video-processor/tools/sub/status/${jobId}`
        );
        const payload = res?.data || {};
        const success = payload?.success !== false;
        if (!success) {
          clearPoll();
          stopSmoothing();
          setLoading(false);
          setLoadingAction(null);
          setLoadingText(payload?.messenger || "Lỗi kiểm tra tiến trình.");
          return;
        }

        const st = payload.status;
        const pr =
          typeof payload.progress === "number" ? payload.progress : undefined;
        const ph = payload.phase;

        // Force progress to 100 if status is done
        const finalProgress = st === "done" ? 100 : pr;

        updateUI(st, finalProgress, ph);
        if (st && st !== lastStatusRef.current) {
          lastStatusRef.current = st;
        }

        // Stop polling if done or error
        if (st === "done" || st === "error") {
          clearPoll();
          stopSmoothing();
          setLoading(false);
          setLoadingAction(null);
          // Ensure progress is set to 100 when done
          if (st === "done") {
            setProgress(100);
            // Wait a bit to ensure backend has saved the timeline to DB
            // Then reload project to get the updated timeline with subtitles
            setTimeout(() => {
              onReloadProject?.();
            }, 500);
          }
          return; // Early return to prevent further polling
        }
      } catch (err) {
        // If 404, job might be cleaned up - check if we should stop
        const is404 = err?.response?.status === 404;
        if (is404) {
          // If we got 404, job might be done and cleaned up
          // Check if we have a last known status
          if (lastStatusRef.current === "done") {
            // Job was done, just stop polling
            clearPoll();
            stopSmoothing();
            setLoading(false);
            setLoadingAction(null);
            setProgress(100);
            setTimeout(() => {
              onReloadProject?.();
            }, 500);
            return;
          }
        }
        
        // Only stop polling on repeated errors, not on single network error
        pollErrorCountRef.current = (pollErrorCountRef.current || 0) + 1;
        
        if (pollErrorCountRef.current >= 5) {
          clearPoll();
          stopSmoothing();
          setLoading(false);
          setLoadingAction(null);
          setLoadingText("Lỗi kết nối khi kiểm tra tiến trình.");
        }
      }
    },
    [clearPoll, stopSmoothing, updateUI, onReloadProject]
  );

  const startTachSub = useCallback(
    async (cfg) => {
      clearPoll();
      stopSmoothing();
      pollErrorCountRef.current = 0; // Reset error count

      setLoading(true);
      setLoadingAction("tachSub");
      setLoadingText("Đang khởi tạo tác vụ…");
      setProgress(0);
      setStatus("init");
      setPhase("init");
      lastStatusRef.current = null;
      jobIdRef.current = null;

      try {
        const res = await axiosClient.post(
          "/api/video-processor/tools/sub/from-asset",
          {
            projectId,
            assetId: selectedClip?.assetId,
            clipId: selectedClip?.id,
            storeAsset,
            cfg,
          }
        );

        const data = res?.data || {};
        const success = data?.success !== false;
        if (!success) {
          setLoading(false);
          setLoadingAction(null);
          setLoadingText(
            data?.messenger || "Không thể khởi tạo tác vụ tách phụ đề."
          );
          return;
        }

        jobIdRef.current = data.jobId || null;

        await poll(jobIdRef.current);
        pollTimerRef.current = setInterval(() => poll(jobIdRef.current), 1200);
      } catch {
        setLoading(false);
        setLoadingAction(null);
        setLoadingText("Không thể khởi tạo tác vụ tách phụ đề.");
      }
    },
    [
      projectId,
      selectedClip?.assetId,
      selectedClip?.id,
      storeAsset,
      clearPoll,
      stopSmoothing,
      poll,
    ]
  );

  useEffect(() => {
    return () => {
      clearPoll();
      clearSmooth();
    };
  }, [clearPoll, clearSmooth]);

  return {
    loading,
    loadingAction,
    loadingText,
    progress,
    status,
    phase,
    startTachSub,
  };
}
