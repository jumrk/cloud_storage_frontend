import { useCallback, useEffect, useRef, useState } from "react";
import axiosClient from "@/shared/lib/axiosClient";

const PHASE_TEXT = {
  init: "Đang khởi tạo…",
  prepare: "Đang chuẩn bị…",
  queued: "Đang xếp hàng…",
  loading: "Đang tải dữ liệu…",
  generating: "Đang tạo giọng…",
  merging: "Đang ghép audio…",
  saving: "Đang lưu…",
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

export default function useVoiceGeneration({
  projectId,
  onReloadProject,
  onClipProgress, // Callback to update progress for specific clips: (clipIds, progress) => void
}) {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [loadingText, setLoadingText] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null);
  const [phase, setPhase] = useState("");

  // Track multiple jobs running in parallel
  const activeJobsRef = useRef(new Map()); // jobId -> { clipIds, pollTimer, smoothTimer, lastStatus }
  const pollTimerRef = useRef(null);
  const smoothTimerRef = useRef(null);
  const lastStatusRef = useRef(null);

  const clearSmooth = useCallback((jobId = null) => {
    if (jobId) {
      const job = activeJobsRef.current.get(jobId);
      if (job?.smoothTimer) {
        clearInterval(job.smoothTimer);
        job.smoothTimer = null;
      }
    } else {
      // Clear all smooth timers
      activeJobsRef.current.forEach((job) => {
        if (job.smoothTimer) {
          clearInterval(job.smoothTimer);
          job.smoothTimer = null;
        }
      });
      if (smoothTimerRef.current) {
        clearInterval(smoothTimerRef.current);
        smoothTimerRef.current = null;
      }
    }
  }, []);

  const clearPoll = useCallback((jobId = null) => {
    if (jobId) {
      const job = activeJobsRef.current.get(jobId);
      if (job?.pollTimer) {
        clearInterval(job.pollTimer);
        job.pollTimer = null;
      }
      activeJobsRef.current.delete(jobId);
    } else {
      // Clear all poll timers
      activeJobsRef.current.forEach((job) => {
        if (job.pollTimer) {
          clearInterval(job.pollTimer);
        }
      });
      activeJobsRef.current.clear();
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }
  }, []);

  const startSmoothing = useCallback((jobId, clipIds) => {
    const job = activeJobsRef.current.get(jobId);
    if (!job || job.smoothTimer) return;

    job.smoothTimer = setInterval(() => {
      // Update progress for each clip in this job
      if (onClipProgress && clipIds && clipIds.length > 0) {
        clipIds.forEach((clipId) => {
          const currentProgress = job.clipProgress?.get(clipId) || 0;
          const cap = 90;
          if (currentProgress >= cap) return;
          const step = currentProgress < 60 ? 1.2 : 0.7;
          const newProgress = Math.min(cap, Math.round((currentProgress + step) * 10) / 10);
          if (!job.clipProgress) job.clipProgress = new Map();
          job.clipProgress.set(clipId, newProgress);
          onClipProgress(clipId, newProgress);
        });
      }
    }, 900);
  }, [onClipProgress]);

  const stopSmoothing = useCallback((jobId = null) => {
    clearSmooth(jobId);
  }, [clearSmooth]);

  const updateUI = useCallback(
    (jobId, clipIds, st, rawProgress, ph, currentClip, totalClips) => {
      const normalized = normalizeProgress(rawProgress);
      const job = activeJobsRef.current.get(jobId);
      if (!job) return;

      // Update progress for each clip in this job
      if (onClipProgress && clipIds && clipIds.length > 0) {
        // If job has only 1 clip, use job progress directly
        if (clipIds.length === 1) {
          const clipId = clipIds[0];
          if (!job.clipProgress) job.clipProgress = new Map();
          const current = job.clipProgress.get(clipId) || 0;
          const newProgress = Number.isFinite(normalized)
            ? Math.max(current, normalized)
            : current;
          job.clipProgress.set(clipId, newProgress);
          onClipProgress(clipId, newProgress);
        }
        // If job has multiple clips, calculate progress per clip
        else if (
          currentClip !== undefined &&
          totalClips !== undefined &&
          totalClips > 0
        ) {
          // currentClip is 1-based (1, 2, 3, ...)
          // For each clip, calculate progress based on its position
          clipIds.forEach((clipId, idx) => {
            if (!job.clipProgress) job.clipProgress = new Map();
            const current = job.clipProgress.get(clipId) || 0;
            
            // If this clip has already been processed (idx < currentClip - 1), it's done
            if (idx < currentClip - 1) {
              const newProgress = 100;
              job.clipProgress.set(clipId, newProgress);
              onClipProgress(clipId, newProgress);
            }
            // If this clip is currently being processed (idx === currentClip - 1)
            else if (idx === currentClip - 1) {
              // Use the normalized progress for the current clip
              const newProgress = Number.isFinite(normalized) ? normalized : current;
              job.clipProgress.set(clipId, newProgress);
              onClipProgress(clipId, newProgress);
            }
            // If this clip hasn't been processed yet, keep current progress (don't reset)
            else {
              // Keep current progress, don't update
            }
          });
        } else {
          // No per-clip info, distribute progress evenly among all clips
          clipIds.forEach((clipId) => {
            if (!job.clipProgress) job.clipProgress = new Map();
            const current = job.clipProgress.get(clipId) || 0;
            const newProgress = Number.isFinite(normalized)
              ? Math.max(current, normalized)
              : current;
            job.clipProgress.set(clipId, newProgress);
            onClipProgress(clipId, newProgress);
          });
        }
      }

      // Update global UI state (for backward compatibility)
      setStatus(st || null);
      setPhase(ph || "");
      setLoadingText(
        formatPhase(ph, st) || (st === "running" ? "Đang tạo giọng…" : "")
      );

      setProgress((prev) =>
        Number.isFinite(normalized) ? Math.max(prev, normalized) : prev
      );

      const indeterminate =
        (st === "running" || st === "queued") &&
        (!Number.isFinite(normalized) || normalized < 1);
      if (indeterminate) startSmoothing(jobId, clipIds);
      else stopSmoothing(jobId);

      if (st === "done" || st === "error") {
        stopSmoothing(jobId);
        // Set final progress for completed clips
        if (onClipProgress && clipIds && clipIds.length > 0) {
          clipIds.forEach((clipId) => {
            if (st === "done") {
              onClipProgress(clipId, 100);
              // Clear loading state after a short delay to show completion
              setTimeout(() => {
                onClipProgress(clipId, null);
              }, 1000);
            } else {
              onClipProgress(clipId, null); // Clear on error
            }
          });
        }
      }
    },
    [startSmoothing, stopSmoothing, onClipProgress]
  );

  // Debounce reload to avoid multiple reloads when multiple jobs complete
  const reloadTimerRef = useRef(null);
  const pendingReloadRef = useRef(false);

  const scheduleReload = useCallback(() => {
    pendingReloadRef.current = true;
    if (reloadTimerRef.current) {
      clearTimeout(reloadTimerRef.current);
    }
    // Wait longer to allow other jobs to complete and avoid interrupting active jobs
    // This prevents reload from interfering with jobs that are still running
    reloadTimerRef.current = setTimeout(() => {
      if (pendingReloadRef.current) {
        // Only reload if there are no active jobs to avoid interrupting them
        const hasActiveJobs = activeJobsRef.current.size > 0;
        if (!hasActiveJobs) {
          pendingReloadRef.current = false;
          onReloadProject?.();
        } else {
          // If there are still active jobs, reschedule reload check
          pendingReloadRef.current = true;
          reloadTimerRef.current = setTimeout(() => {
            if (pendingReloadRef.current && activeJobsRef.current.size === 0) {
              pendingReloadRef.current = false;
              onReloadProject?.();
            }
          }, 1000); // Check again after 1s
        }
      }
    }, 1500); // 1.5s debounce - longer to avoid interrupting active jobs
  }, [onReloadProject]);

  const poll = useCallback(
    async (jobId) => {
      if (!jobId || !projectId) return;
      const job = activeJobsRef.current.get(jobId);
      if (!job) return;

      try {
        const res = await axiosClient.get(
          `/api/video-processor/tools/${projectId}/voices/generate/${jobId}/status`
        );
        const payload = res?.data || {};

        const st = payload.status;
        const pr = normalizeProgress(payload.progress);
        const ph = payload.phase;
        const currentClip = payload.currentClip;
        const totalClips = payload.totalClips;
        const completedClips = payload.completedClips;

        updateUI(jobId, job.clipIds, st, pr, ph, currentClip, totalClips);
        if (st && st !== job.lastStatus) {
          job.lastStatus = st;
        }

        // If clips are being completed incrementally, reload project to show them immediately
        if (st === "running" && completedClips && completedClips > (job.lastCompletedClips || 0)) {
          job.lastCompletedClips = completedClips;
          // Reload immediately when a clip completes (don't debounce for incremental updates)
          onReloadProject?.();
        }

        if (st === "done" || st === "error") {
          clearPoll(jobId);
          stopSmoothing(jobId);
          
          // Check if there are any other active jobs
          const hasOtherJobs = Array.from(activeJobsRef.current.keys()).some(id => id !== jobId);
          if (!hasOtherJobs) {
            setLoading(false);
            setLoadingAction(null);
          }
          
          if (st === "done") {
            // Dispatch event to notify that voice generation completed
            window.dispatchEvent(
              new CustomEvent("voiceover.voiceGenerated", {
                detail: { clipIds: job.clipIds },
              })
            );
            // Backend already added clips to timeline, just reload to sync
            // Use debounce to avoid multiple reloads when multiple jobs complete
            scheduleReload();
          }
        }
      } catch {
        clearPoll(jobId);
        stopSmoothing(jobId);
        
        // Check if there are any other active jobs
        const hasOtherJobs = Array.from(activeJobsRef.current.keys()).some(id => id !== jobId);
        if (!hasOtherJobs) {
          setLoading(false);
          setLoadingAction(null);
          setLoadingText("Lỗi kiểm tra tiến trình tạo giọng.");
        }
      }
    },
    [projectId, clearPoll, stopSmoothing, updateUI, scheduleReload]
  );

  const startGenerateVoice = useCallback(async (clipIds = null) => {
    if (!projectId) return;

    // Don't clear existing jobs - allow parallel processing
    // Only set loading state if this is the first job
    const isFirstJob = activeJobsRef.current.size === 0;
    if (isFirstJob) {
      setLoading(true);
      setLoadingAction("generateVoice");
      setLoadingText("Đang khởi tạo tác vụ…");
    }

    try {
      const payload = {
        projectId,
      };
      if (clipIds && clipIds.length > 0) {
        payload.clipIds = clipIds;
      }

      const res = await axiosClient.post(
        `/api/video-processor/tools/voices/generate`,
        payload
      );

      const data = res?.data || {};
      const jobId = data?.jobId;
      if (!jobId) {
        if (isFirstJob) {
          setLoading(false);
          setLoadingAction(null);
        }
        setLoadingText("Không thể khởi tạo tác vụ tạo giọng.");
        return;
      }

      // Track this job
      const job = {
        jobId,
        clipIds: clipIds || [],
        pollTimer: null,
        smoothTimer: null,
        lastStatus: null,
        lastCompletedClips: 0,
        clipProgress: new Map(),
      };
      activeJobsRef.current.set(jobId, job);

      // Start polling for this job
      await poll(jobId);
      job.pollTimer = setInterval(() => poll(jobId), 2000);
    } catch {
      if (isFirstJob) {
        setLoading(false);
        setLoadingAction(null);
      }
      setLoadingText("Không thể khởi tạo tác vụ tạo giọng.");
    }
  }, [
    projectId,
    poll,
  ]);

  useEffect(() => {
    return () => {
      clearPoll();
      clearSmooth();
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };
  }, [clearPoll, clearSmooth]);

  return {
    loading,
    loadingAction,
    loadingText,
    progress,
    status,
    phase,
    startGenerateVoice,
  };
}

