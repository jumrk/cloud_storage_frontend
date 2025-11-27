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

export default function useSubFromProject({
  projectId,
  onReloadProject,
  storeAsset = false,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [loadingText, setLoadingText] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null);
  const [phase, setPhase] = useState("");

  const jobIdsRef = useRef([]);
  const pollTimerRef = useRef(null);
  const smoothTimerRef = useRef(null);
  const lastStatusRef = useRef(null);
  const jobStatusesRef = useRef(new Map());

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
          jobStatusesRef.current.set(jobId, {
            status: "error",
            progress: 0,
            phase: payload?.messenger || "Lỗi",
          });
          return;
        }

        const st = payload.status;
        const pr =
          typeof payload.progress === "number" ? payload.progress : undefined;
        const ph = payload.phase;

        jobStatusesRef.current.set(jobId, { status: st, progress: pr || 0, phase: ph });

        // Tính toán progress trung bình từ tất cả jobs đã được poll
        const allStatuses = Array.from(jobStatusesRef.current.values());
        const totalJobs = jobIdsRef.current.length;
        
        if (allStatuses.length > 0) {
          const totalProgress = allStatuses.reduce(
            (sum, js) => sum + (js.progress || 0),
            0
          );
          // Tính progress trung bình: tổng progress của các jobs đã poll / tổng số jobs
          // Jobs chưa poll được tính là 0
          const avgProgress = totalJobs > 0
            ? totalProgress / totalJobs
            : totalProgress / allStatuses.length;

          // Chỉ check allDone khi đã poll tất cả jobs
          const allDone = allStatuses.length === totalJobs && 
            allStatuses.every((js) => js.status === "done");
          const hasError = allStatuses.some((js) => js.status === "error");
          const allFinished = allDone || (hasError && allStatuses.length === totalJobs);

          // Lấy phase từ job đang chạy hoặc job vừa poll
          const activeJob = allStatuses.find(
            (js) => js.status !== "done" && js.status !== "error"
          );
          const currentPhase = activeJob?.phase || ph || "";

          updateUI(
            allFinished ? (hasError ? "error" : "done") : st || "extracting",
            avgProgress,
            currentPhase
          );

          if (allFinished) {
            clearPoll();
            stopSmoothing();
            setLoading(false);
            setLoadingAction(null);
            if (allDone) onReloadProject?.();
          }
        }
      } catch {
        jobStatusesRef.current.set(jobId, {
          status: "error",
          progress: 0,
          phase: "Lỗi kết nối",
        });
      }
    },
    [clearPoll, stopSmoothing, updateUI, onReloadProject]
  );

  const pollAll = useCallback(async () => {
    const jobIds = jobIdsRef.current;
    if (!jobIds.length) return;
    await Promise.all(jobIds.map((id) => poll(id)));
  }, [poll]);

  const startTachSub = useCallback(
    async (cfg) => {
      if (!projectId) return;

      clearPoll();
      stopSmoothing();

      setLoading(true);
      setLoadingAction("tachSub");
      setLoadingText("Đang khởi tạo tác vụ…");
      setProgress(0);
      setStatus("init");
      setPhase("init");
      lastStatusRef.current = null;
      jobIdsRef.current = [];
      jobStatusesRef.current.clear();

      try {
        const res = await axiosClient.post(
          "/api/video-processor/tools/sub/from-asset",
          {
            projectId,
            storeAsset,
            cfg,
            // Không gửi assetId và clipId để backend tạo jobs cho tất cả clips
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

        // Backend trả về { jobs: [{ jobId, assetId, clipId }], count } khi không có assetId
        const jobs = data.jobs || [];
        if (jobs.length === 0) {
          setLoading(false);
          setLoadingAction(null);
          setLoadingText("Không có video clip trong project.");
          return;
        }

        jobIdsRef.current = jobs.map((j) => j.jobId).filter(Boolean);

        await pollAll();
        pollTimerRef.current = setInterval(pollAll, 1200);
      } catch {
        setLoading(false);
        setLoadingAction(null);
        setLoadingText("Không thể khởi tạo tác vụ tách phụ đề.");
      }
    },
    [projectId, storeAsset, clearPoll, stopSmoothing, pollAll]
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

