import { useCallback, useEffect, useRef, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";

const PHASE_TEXT = {
  prepare: "Đang chuẩn bị…",
  queued: "Đang xếp hàng…",
  extract: "Đang tách audio…",
  running: "Đang tách audio…",
  done: "Hoàn tất.",
  error: "Có lỗi xảy ra.",
};

function normalizeProgress(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.max(0, Math.min(100, num));
}

function formatPhase(phase = "", status = "") {
  if (phase && PHASE_TEXT[phase]) return PHASE_TEXT[phase];
  if (status && PHASE_TEXT[status]) return PHASE_TEXT[status];
  return phase || status || "";
}

export default function useAudioExtract({
  projectId,
  selectedClip,
  onReloadProject,
  forceFull = false,
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
        const cap = 90;
        if (p >= cap) return p;
        const step = p < 60 ? 1.2 : 0.7;
        return Math.min(cap, Math.round((p + step) * 10) / 10);
      });
    }, 900);
  }, []);

  const stopSmoothing = useCallback(() => {
    clearSmooth();
  }, [clearSmooth]);

  const updateUI = useCallback(
    (st, rawProgress, ph) => {
      const normalized = normalizeProgress(rawProgress);
      setStatus(st || null);
      setPhase(ph || "");
      setLoadingText(
        formatPhase(ph, st) || (st === "running" ? "Đang tách audio…" : "")
      );

      setProgress((prev) =>
        Number.isFinite(normalized) ? Math.max(prev, normalized) : prev
      );

      const indeterminate =
        (st === "running" || st === "queued") &&
        (!Number.isFinite(normalized) || normalized < 1);
      if (indeterminate) startSmoothing();
      else stopSmoothing();

      if (st === "done" || st === "error") stopSmoothing();
    },
    [startSmoothing, stopSmoothing]
  );

  const poll = useCallback(
    async (jobId) => {
      if (!jobId || !projectId) return;
      try {
        const res = await axiosClient.get(
          `/api/video-processor/tools/${projectId}/audio-extract/${jobId}/status`
        );
        const payload = res?.data || {};

        const st = payload.status;
        const pr = normalizeProgress(payload.progress);
        const ph = payload.phase;

        updateUI(st, pr, ph);
        if (st && st !== lastStatusRef.current) {
          lastStatusRef.current = st;
        }

        if (st === "done" || st === "error") {
          clearPoll();
          stopSmoothing();
          setLoading(false);
          setLoadingAction(null);
          if (st === "done") {
            if (payload?.result?.assetId) {
              const clipStart = Number(payload.result.timelineStartSec) || 0;
              const clipDur = Number(payload.result.durationSec) || 0;
              window.dispatchEvent(
                new CustomEvent("timeline.addClips", {
                  detail: {
                    lane: "audio",
                    clips: [
                      {
                        id: `extracted_${payload.result.assetId}_${Date.now()}`,
                        type: "audio",
                        assetId: payload.result.assetId,
                        name: "Extracted Audio",
                        label: "Extracted Audio",
                        start: clipStart,
                        duration: clipDur,
                        durationSec: clipDur,
                        volume: 1,
                        useAudio: true,
                      },
                    ],
                  },
                })
              );
            }
            onReloadProject?.();
          }
        }
      } catch {
        clearPoll();
        stopSmoothing();
        setLoading(false);
        setLoadingAction(null);
        setLoadingText("Lỗi kiểm tra tiến trình tách audio.");
      }
    },
    [projectId, clearPoll, stopSmoothing, updateUI, onReloadProject]
  );

  const startTachAudio = useCallback(async () => {
    if (!projectId || !selectedClip?.assetId) return;

    clearPoll();
    stopSmoothing();

    setLoading(true);
    setLoadingAction("tachAudio");
    setLoadingText("Đang khởi tạo tác vụ…");
    setProgress(0);
    setStatus("init");
    setPhase("prepare");
    lastStatusRef.current = null;
    jobIdRef.current = null;

    try {
      const res = await axiosClient.post(
        `/api/video-processor/tools/audio-extract/start`,
        {
          projectId,
          assetId: selectedClip.assetId,
          clipId: selectedClip.id,
          forceFull,
        }
      );

      const data = res?.data || {};
      const jobId = data?.jobId;
      if (!jobId) {
        setLoading(false);
        setLoadingAction(null);
        setLoadingText("Không thể khởi tạo tác vụ tách audio.");
        return;
      }

      jobIdRef.current = jobId;
      await poll(jobId);
      pollTimerRef.current = setInterval(() => poll(jobId), 1200);
    } catch {
      setLoading(false);
      setLoadingAction(null);
      setLoadingText("Không thể khởi tạo tác vụ tách audio.");
    }
  }, [
    projectId,
    selectedClip?.assetId,
    selectedClip?.id,
    forceFull,
    poll,
    clearPoll,
    stopSmoothing,
  ]);

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
    startTachAudio,
  };
}
