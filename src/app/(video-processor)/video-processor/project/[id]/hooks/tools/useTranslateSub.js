import { useCallback, useEffect, useRef, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";

const PHASE_TEXT = {
  queued: "Đang xếp hàng…",
  collecting: "Đang thu thập phụ đề…",
  translating: "Đang dịch phụ đề…",
  applying: "Đang ghi vào timeline…",
  done: "Hoàn tất.",
  error: "Có lỗi xảy ra.",
};

const STEP_TITLES = {
  collect: "Thu thập",
  translate: "Dịch",
  apply: "Ghi vào timeline",
  done: "Hoàn tất",
};

function formatPhase(status = "", currentStep = null) {
  if (!status) return "";
  
  if (status === "done") return PHASE_TEXT.done;
  if (status.startsWith("error_")) return PHASE_TEXT.error;
  
  if (currentStep) {
    const stepTitle = STEP_TITLES[currentStep.key] || currentStep.title || "";
    if (currentStep.state === "running") {
      return `${stepTitle}…`;
    }
  }
  
  return PHASE_TEXT[status] || status;
}

export default function useTranslateSub({ projectId, onReloadProject }) {
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
        const step = p < 50 ? 1.2 : 0.6;
        const next = Math.min(cap, Math.round((p + step) * 10) / 10);
        return next;
      });
    }, 800);
  }, []);

  const stopSmoothing = useCallback(() => {
    clearSmooth();
  }, [clearSmooth]);

  const updateUI = useCallback(
    (st, pr, ph, error = null) => {
      setStatus(st || null);
      // Extract string from currentStep object if needed
      const phaseStr = typeof ph === "string" ? ph : ph?.title || ph?.key || "";
      setPhase(phaseStr);
      const phText = formatPhase(st, ph);

      if (st === "queued")
        setLoadingText(phText || "Đang xếp hàng…");
      else if (st === "collecting")
        setLoadingText(phText || "Đang thu thập phụ đề…");
      else if (st === "translating")
        setLoadingText(phText || "Đang dịch phụ đề…");
      else if (st === "applying")
        setLoadingText(phText || "Đang ghi vào timeline…");
      else if (st === "done") setLoadingText("Hoàn tất.");
      else if (st?.startsWith("error_") || st === "error")
        setLoadingText(error || phText || "Lỗi dịch phụ đề.");
      else setLoadingText(phText || "");

      setProgress((prev) =>
        typeof pr === "number"
          ? Math.max(prev, Math.min(100, Math.max(0, pr)))
          : prev
      );

      // Bắt đầu smoothing nếu đang ở trạng thái running
      const isRunning = st === "collecting" || st === "translating" || st === "applying";
      if (isRunning && typeof pr !== "number") {
        startSmoothing();
      } else {
        stopSmoothing();
      }

      if (st === "done" || st?.startsWith("error_") || st === "error") {
        stopSmoothing();
      }
    },
    [startSmoothing, stopSmoothing]
  );

  const poll = useCallback(
    async (jobId) => {
      if (!jobId) return;
      try {
        const res = await axiosClient.get(
          `/api/video-processor/tools/translate/status/${jobId}`
        );
        const payload = res?.data || {};
        const success = payload?.success !== false;
        
        if (!success) {
          updateUI("error", 0, null, payload?.messenger || "Lỗi");
          setLoading(false);
          setLoadingAction(null);
          clearPoll();
          return;
        }

        const st = payload.status;
        const pr =
          typeof payload.progress === "number" ? payload.progress : undefined;
        
        // Tìm step đang chạy
        const steps = Array.isArray(payload.steps) ? payload.steps : [];
        const currentStep = steps.find((s) => s.state === "running") || 
                          steps.find((s) => s.state === "success") ||
                          null;

        updateUI(st, pr, currentStep, payload?.error);

        // Nếu hoàn tất hoặc lỗi, dừng polling
        if (st === "done" || st?.startsWith("error_") || st === "error") {
          clearPoll();
          stopSmoothing();
          setLoading(false);
          setLoadingAction(null);
          if (st === "done" && payload?.timelineRev) {
            onReloadProject?.();
          }
        }
      } catch (err) {
        updateUI("error", 0, null, "Lỗi kết nối");
        setLoading(false);
        setLoadingAction(null);
        clearPoll();
      }
    },
    [clearPoll, stopSmoothing, updateUI, onReloadProject]
  );

  const startTranslate = useCallback(
    async (lang) => {
      if (!projectId || !lang) return;

      clearPoll();
      stopSmoothing();

      setLoading(true);
      setLoadingAction("translate");
      setLoadingText("Đang khởi tạo tác vụ…");
      setProgress(0);
      setStatus("queued");
      setPhase(null);
      lastStatusRef.current = null;
      jobIdRef.current = null;

      try {
        const res = await axiosClient.post(
          "/api/video-processor/tools/translate/start",
          {
            projectId,
            lang,
          }
        );

        const data = res?.data || {};
        const success = data?.success !== false;
        
        if (!success) {
          setLoading(false);
          setLoadingAction(null);
          setLoadingText(
            data?.messenger || "Không thể khởi tạo tác vụ dịch phụ đề."
          );
          return;
        }

        const jobId = data?.jobId;
        if (!jobId) {
          setLoading(false);
          setLoadingAction(null);
          setLoadingText("Không nhận được jobId từ server.");
          return;
        }

        jobIdRef.current = jobId;

        // Bắt đầu polling
        await poll(jobId);
        pollTimerRef.current = setInterval(() => poll(jobId), 1500);
      } catch (err) {
        setLoading(false);
        setLoadingAction(null);
        setLoadingText(
          err?.response?.data?.messenger || 
          "Không thể khởi tạo tác vụ dịch phụ đề."
        );
      }
    },
    [projectId, clearPoll, stopSmoothing, poll]
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
    startTranslate,
  };
}

