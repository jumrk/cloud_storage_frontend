import React, { useEffect, useState, useRef } from "react";
import Loader from "@/shared/ui/Loader";
import { FiCheck, FiX, FiUpload, FiClock } from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import {
  addPendingUpload,
  removePendingUpload,
  saveUploadFile,
  deleteUploadFile,
} from "@/shared/utils/uploadResumeStorage";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import Image from "next/image";
import useSocket from "@/shared/lib/useSocket";
// ================= OPTIMIZED CHUNK SIZE =================
// Tối ưu cho server mạnh và network tốt
// Tăng chunk size = ít round-trips = upload nhanh hơn
const calculateOptimalChunkSize = (fileSize) => {
  // File rất nhỏ (<1MB): tối đa 50% file size
  if (fileSize < 1 * 1024 * 1024)
    return Math.max(256 * 1024, Math.floor(fileSize / 2));

  // File nhỏ (<10MB): 2MB chunks
  if (fileSize < 10 * 1024 * 1024) return 2 * 1024 * 1024;

  // File trung bình (<100MB): 5MB chunks
  if (fileSize < 100 * 1024 * 1024) return 5 * 1024 * 1024;

  // File lớn (<500MB): 10MB chunks
  if (fileSize < 500 * 1024 * 1024) return 10 * 1024 * 1024;

  // File rất lớn (<2GB): 20MB chunks (TĂNG từ 5-10MB)
  if (fileSize < 2 * 1024 * 1024 * 1024) return 20 * 1024 * 1024;

  // File cực lớn (<10GB): 30MB chunks (TĂNG từ 10MB)
  if (fileSize < 10 * 1024 * 1024 * 1024) return 30 * 1024 * 1024;

  // File khổng lồ (>10GB): 50MB chunks (TĂNG từ 15-25MB)
  return 50 * 1024 * 1024;
};

// Hàm tính chunk size adaptive dựa trên băng thông đo được
const getAdaptiveChunkSize = (fileSize, measuredBandwidthKbps = null) => {
  const baseChunkSize = calculateOptimalChunkSize(fileSize);

  if (!measuredBandwidthKbps) return baseChunkSize;

  // Nếu băng thông cao (>10Mbps), tăng chunk size lên
  if (measuredBandwidthKbps > 10 * 1024) {
    // Tăng max chunk size lên 150MB để tận dụng băng thông cao
    return Math.min(baseChunkSize * 2, 150 * 1024 * 1024); // Max 150MB (tăng từ 50MB)
  }
  
  // Nếu băng thông rất cao (>50Mbps), tăng chunk size nhiều hơn
  if (measuredBandwidthKbps > 50 * 1024) {
    return Math.min(baseChunkSize * 3, 200 * 1024 * 1024); // Max 200MB cho băng thông rất cao
  }

  // Nếu băng thông thấp (<1Mbps), giảm chunk size xuống
  if (measuredBandwidthKbps < 1024) {
    return Math.max(baseChunkSize / 2, 1 * 1024 * 1024); // Min 1MB
  }

  return baseChunkSize;
};
const CLOSE_ON_PROCESSING = true;
const MIN_CHUNK_SIZE = 512 * 1024; // 512KB
const MAX_TOTAL_RETRIES = 30;
const CHECKSUM_MISMATCH_THRESHOLD = 3;
const createFileChunks = (file, measuredBandwidthKbps = null) => {
  const optimalChunkSize = getAdaptiveChunkSize(
    file.size,
    measuredBandwidthKbps
  );
  const chunks = [];
  let start = 0;
  while (start < file.size) {
    const end = Math.min(start + optimalChunkSize, file.size);
    chunks.push({ start, end, size: end - start });
    start = end;
  }
  return chunks;
};
const createFileChunksWithSize = (file, chunkSize) => {
  const size = Math.max(Number(chunkSize) || 0, MIN_CHUNK_SIZE);
  const chunks = [];
  let start = 0;
  while (start < file.size) {
    const end = Math.min(start + size, file.size);
    chunks.push({ start, end, size: end - start });
    start = end;
  }
  return chunks;
};
const readFileChunk = (file, start, end) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.onerror = reject;
    r.readAsArrayBuffer(file.slice(start, end));
  });
const MiniStatusBatch = ({
  files = [],
  isFolder,
  batchId,
  onComplete,
  style,
  emptyFolders = [],
  folderName,
  batchType,
  parentId,
  moveItems = [],
  moveTargetFolderId,
  useChunkedUpload = false,
}) => {
  const t = useTranslations();
  const tokenRef = useRef(
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  );
  const socketRef = useSocket(tokenRef.current);
  const [socketConnected, setSocketConnected] = useState(false);
  const [fileStates, setFileStates] = useState(
    files.map((f) => ({
      file: f.file,
      name: f.name,
      relativePath: isFolder ? f.relativePath : undefined,
      icon: "/images/icon/png.png",
      status: "pending",
      progress: 0,
      chunks: [],
      uploadId: f.uploadId || null,
      resumeUpload: Boolean(f.resumeUpload),
      chunkSize: f.chunkSize || null,
      error: null,
    }))
  );
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [status, setStatus] = useState("pending");
  const [result, setResult] = useState(null);
  const [eta, setEta] = useState(null); // Estimated time of arrival in seconds
  const [speed, setSpeed] = useState(0); // Upload speed in bytes per second
  const hasUploaded = useRef(false);
  const cancelledRef = useRef({});
  const abortControllersRef = useRef({});
  const isUploadingRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const statusPollersRef = useRef({});
  // Store file states ref để có thể access trong pollStatusUntilDone
  const fileStatesRef = useRef(fileStates);

  // Sync fileStatesRef mỗi khi fileStates thay đổi
  useEffect(() => {
    fileStatesRef.current = fileStates;
  }, [fileStates]);

  // ================= NETWORK STATUS DETECTION =================
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const networkRetryQueueRef = useRef([]); // Queue các chunks cần retry khi online lại

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("[Network] Online - resuming uploads if any pending...");
      // Resume any pending retries when back online
      if (networkRetryQueueRef.current.length > 0) {
        toast.success("Đã kết nối lại mạng. Đang tiếp tục upload...");
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.warn("[Network] Offline - uploads will pause");
      toast.error("Mất kết nối mạng. Upload sẽ tiếp tục khi có mạng.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ================= CLEANUP ON UNMOUNT =================
  // Fix memory leak: clear all intervals and abort controllers when component unmounts
  useEffect(() => {
    return () => {
      // Clear all polling intervals
      Object.values(statusPollersRef.current).forEach((interval) => {
        if (interval) clearInterval(interval);
      });
      statusPollersRef.current = {};

      // Abort all pending requests
      Object.values(abortControllersRef.current).forEach((controller) => {
        if (controller && !controller.signal.aborted) {
          controller.abort();
        }
      });
      abortControllersRef.current = {};

      // Clear other refs to help GC
      retriedChunksRef.current = {};
      failedChunksRef.current = {};
      totalRetryRef.current = {};
      checksumMismatchRef.current = {};
      uploadSpeedRef.current = {};
      lastStatusRef.current = {};
      networkRetryQueueRef.current = [];

      console.log("[MiniStatus] Cleanup completed on unmount");
    };
  }, []); // Empty deps = run only on unmount

  useEffect(() => {
    fileStates.forEach((f) => {
      if (
        f.uploadId &&
        (f.status === "success" ||
          f.status === "cancelled" ||
          f.status === "processing")
      ) {
        removePendingUpload(f.uploadId);
        deleteUploadFile(f.uploadId);
      }
    });
  }, [fileStates]);

  // Track socket connection
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket) return;

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Check current connection state
    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socketRef?.current]);

  // WebSocket listeners thay thế polling
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !socketConnected) return;

    const handleDriveUploadCompleted = (payload) => {
      console.log("[WebSocket] Drive upload completed:", payload);
      // Tìm file tương ứng với uploadId hoặc fileId
      setFileStates((prev) =>
        prev.map((f, idx) => {
          if (
            f.uploadId === payload.uploadId ||
            (payload.file && f.name === payload.file.name)
          ) {
            // Clear polling interval khi nhận WebSocket success event
            if (statusPollersRef.current[idx]) {
              clearInterval(statusPollersRef.current[idx]);
              delete statusPollersRef.current[idx];
            }
            return { ...f, status: "success", progress: 100 };
          }
          return f;
        })
      );
    };

    const handleSecurityRejected = (payload) => {
      console.log("[WebSocket] File security rejected:", payload);
      toast.error(`File ${payload.fileName} bị từ chối: ${payload.reason}`);
      setFileStates((prev) =>
        prev.map((f) => {
          if (f.name === payload.fileName) {
            return { ...f, status: "error", error: payload.reason };
          }
          return f;
        })
      );
    };

    // Setup listeners
    socket.on("file:driveUploadCompleted", handleDriveUploadCompleted);
    socket.on("file:security:rejected", handleSecurityRejected);

    return () => {
      socket.off("file:driveUploadCompleted", handleDriveUploadCompleted);
      socket.off("file:security:rejected", handleSecurityRejected);
    };
  }, [socketRef?.current, socketConnected]); // Depend on socket instance and connection state

  const lastStatusRef = useRef({});
  const uploadSpeedRef = useRef({}); // Track upload speed per file: { fileIndex: { bytes: number, time: number } }
  const progressHistoryRef = useRef([]); // Track progress over time for ETA calculation

  const calculateOverallProgress = (current) => {
    if (!current.length) return 0;
    // Ensure completed files always count as 100%
    const sum = current.reduce((acc, f) => {
      const fileProgress =
        f.status === "success" ? 100 : Number(f.progress) || 0;
      return acc + fileProgress;
    }, 0);
    return Math.round(sum / current.length);
  };

  // Calculate ETA based on current speed and remaining progress
  const calculateETA = (
    currentProgress,
    currentSpeed,
    totalFiles,
    completedFiles,
    fileStates
  ) => {
    if (currentSpeed <= 0 || currentProgress >= 100) return null;
    const remainingProgress = 100 - currentProgress;
    const remainingFiles = totalFiles - completedFiles;
    // Get current uploading file
    const currentFile = fileStates?.find(
      (f) => f.status === "uploading" || f.status === "processing"
    );
    if (!currentFile || !currentFile.file) {
      // If no current file, estimate based on average
      const avgTimePerFile = 5; // fallback 5 seconds per file
      return remainingFiles * avgTimePerFile;
    }
    // Calculate remaining bytes for current file
    const currentFileRemainingBytes =
      currentFile.file.size * (1 - currentFile.progress / 100);
    const estimatedSecondsForCurrentFile =
      currentFileRemainingBytes / currentSpeed;
    // Add estimated time for remaining files (using average speed from current file)
    const avgTimePerFile =
      estimatedSecondsForCurrentFile > 0 ? estimatedSecondsForCurrentFile : 5;
    const totalEstimated =
      estimatedSecondsForCurrentFile + (remainingFiles - 1) * avgTimePerFile;
    return totalEstimated > 0 ? Math.round(totalEstimated) : null;
  };

  // Format ETA to human readable string
  const formatETA = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format speed to human readable string
  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond || bytesPerSecond <= 0) return "0 B/s";
    const kb = bytesPerSecond / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB/s`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB/s`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB/s`;
  };

  // Track chunks đã retry để tránh retry vô hạn
  const retriedChunksRef = useRef({});
  const failedChunksRef = useRef({}); // Track chunks bị fail trong vòng lặp: { fileIndex: [chunkIndex1, chunkIndex2, ...] }
  const totalRetryRef = useRef({});
  const warnedNetworkRef = useRef({});
  const checksumMismatchRef = useRef({});
  const restartAttemptedRef = useRef({});
  const forcedChunkSizeRef = useRef({});

  const pollStatusUntilDone = (uploadId, fileIndex, fileSize) => {
    if (statusPollersRef.current[fileIndex]) {
      clearInterval(statusPollersRef.current[fileIndex]);
      delete statusPollersRef.current[fileIndex];
    }
    
    const tick = async () => {
      try {
        const res = await axiosClient.get("/api/upload/status", {
          params: { uploadId },
        });
        const data = res.data;
        if (!data?.success) return;
        lastStatusRef.current[fileIndex] = {
          assembledBytes: data.contiguousWatermark,
          driveBytes: data.nextDriveOffset,
          assembledPct: data.assembledPct,
          drivePct: data.drivePct,
          state: data.state,
        };
        
        // ================= RESEND MISSING CHUNKS (WITH LOCK) =================
        // CRITICAL: With in-order validation, resending missing chunks is tricky.
        // We can only resend if backend is waiting for those specific chunks.
        // If all chunks were sent but bitmap shows missing, it's likely a race condition
        // or bitmap read bug. In that case, we should NOT resend (would cause OUT_OF_ORDER).
        //
        // For now, we DISABLE automatic resend from polling to avoid conflicts.
        // The main upload loop already handles retries with proper ordering.
        // Polling should only detect state changes (COMPLETED, FAILED), not trigger resends.
        //
        // NOTE: If chunks are truly missing (network error mid-upload), the main upload
        // loop should have failed and triggered proper retry. Polling-based resend
        // cannot work correctly with in-order validation since we don't know the
        // exact chunk backend expects next.
        if (data.missingChunks && Array.isArray(data.missingChunks) && data.missingChunks.length > 0) {
          console.warn(
            `[Upload] Polling detected ${data.missingChunks.length} missing chunks, but NOT resending.`,
            `With in-order validation, only the main upload loop can resend. Chunks: ${data.missingChunks.slice(0, 5).join(", ")}${data.missingChunks.length > 5 ? "..." : ""}`
          );
          // Log for debugging - if this appears frequently, there may be a real issue
          // that needs investigation (e.g., network drops, backend errors)
        }
        
        // Handle FAILED state - stop polling and show error
        if (data.state === "FAILED" || data.state === "ERROR") {
          clearInterval(statusPollersRef.current[fileIndex]);
          delete statusPollersRef.current[fileIndex];
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? { ...f, status: "error", error: data.error || "Upload failed on server" }
                : f
            )
          );
          return;
        }

        if (
          Number(data.nextDriveOffset) < Number(fileSize) &&
          data.state !== "COMPLETED"
        ) {
          const isAssembled =
            Number(data.contiguousWatermark || 0) >= Number(fileSize);
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? { ...f, status: isAssembled ? "processing" : "uploading" }
                : f
            )
          );
          return;
        }
        clearInterval(statusPollersRef.current[fileIndex]);
        delete statusPollersRef.current[fileIndex];
        setFileStates((prev) => {
          const next = prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "success", progress: 100 } : f
          );
          const overallProgress = calculateOverallProgress(next);
          setProgress(overallProgress);
          // Calculate ETA
          const completedFiles = next.filter(
            (f) => f.status === "success"
          ).length;
          const etaSeconds = calculateETA(
            overallProgress,
            speed,
            next.length,
            completedFiles,
            next
          );
          setEta(etaSeconds);
          return next;
        });
      } catch (e) {
        console.log("[FE] status poll error:", e?.message);
      }
    };
    tick();
    statusPollersRef.current[fileIndex] = setInterval(tick, 3000); // Tăng từ 1.5s lên 3s để giảm load
  };

  // Helper function để retry với exponential backoff
  const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;
        if (isLastAttempt) {
          throw error; // Throw error ở lần retry cuối
        }
        
        // Exponential backoff: 1s, 2s, 4s, ...
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[Upload] Retry attempt ${attempt + 1}/${maxRetries} sau ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const bufferToHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  const getChunkChecksum = async (buf) => {
    try {
      if (typeof window === "undefined") return null;
      const subtle = window.crypto?.subtle;
      if (!subtle) return null;
      const digest = await subtle.digest("SHA-256", buf);
      return bufferToHex(digest);
    } catch (e) {
      return null;
    }
  };

  const isChecksumMismatch = (error) =>
    error?.response?.data?.code === "CHECKSUM_MISMATCH" ||
    String(error?.response?.data?.error || "").includes("Checksum mismatch");

  const recordRetryAttempt = (fileIndex) => {
    totalRetryRef.current[fileIndex] =
      (totalRetryRef.current[fileIndex] || 0) + 1;
    if (
      totalRetryRef.current[fileIndex] >= MAX_TOTAL_RETRIES &&
      !warnedNetworkRef.current[fileIndex]
    ) {
      warnedNetworkRef.current[fileIndex] = true;
      toast.error("Mạng không ổn định, vui lòng thử lại sau");
      const err = new Error("NETWORK_UNSTABLE");
      err.code = "NETWORK_UNSTABLE";
      throw err;
    }
  };

  const requestRestartWithSmallerChunks = async (
    fileState,
    fileIndex,
    uploadId,
    currentChunkSize
  ) => {
    if (restartAttemptedRef.current[fileIndex]) {
      return false;
    }
    const newChunkSize = Math.max(
      Math.floor(currentChunkSize / 2),
      MIN_CHUNK_SIZE
    );
    if (newChunkSize >= currentChunkSize) {
      return false;
    }

    restartAttemptedRef.current[fileIndex] = true;
    forcedChunkSizeRef.current[fileIndex] = newChunkSize;
    totalRetryRef.current[fileIndex] = 0;
    checksumMismatchRef.current[fileIndex] = 0;
    warnedNetworkRef.current[fileIndex] = false;

    if (uploadId) {
      try {
        await axiosClient.post("/api/upload/cancel", { uploadId });
      } catch (error) {
        // Ignore cancel errors, we'll restart anyway
      }
    }

    setFileStates((prev) =>
      prev.map((f, idx) =>
        idx === fileIndex
          ? {
              ...f,
              uploadId: null,
              resumeUpload: false,
              progress: 0,
              status: "pending",
              chunks: [],
              error: null,
            }
          : f
      )
    );

    await new Promise((resolve) => setTimeout(resolve, 300));
    const refreshed = fileStatesRef.current[fileIndex];
    if (refreshed) {
      await uploadFileWithChunks(refreshed, fileIndex);
      return true;
    }
    return false;
  };

  const sendChunkByIndex = async ({
    fileState,
    fileIndex,
    chunkIdx,
    uploadId,
    chunks,
  }) => {
    const ch = chunks[chunkIdx];
    if (!ch) return false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const buf = await readFileChunk(fileState.file, ch.start, ch.end);
        const checksum = await getChunkChecksum(buf);
        const headers = {
          "Content-Type": "application/octet-stream",
          "X-Upload-Id": uploadId,
          "X-Chunk-Index": chunkIdx,
          "X-Total-Chunks": chunks.length,
          "X-File-Name": encodeURIComponent(fileState.file.name),
          "X-Mime-Type": encodeURIComponent(
            fileState.file.type || "application/octet-stream"
          ),
          "X-Parent-Id": encodeURIComponent(parentId || ""),
          "X-Is-First-Chunk": "0",
          "X-Is-Last-Chunk": chunkIdx === chunks.length - 1 ? "1" : "0",
          "X-File-Size": fileState.file.size,
          "X-Relative-Path": encodeURIComponent(fileState.relativePath || ""),
          "X-Batch-Id": encodeURIComponent(batchId || ""),
          "X-Chunk-Start": ch.start,
          "X-Chunk-End": ch.end,
        };
        if (checksum) {
          headers["X-Chunk-Checksum"] = checksum;
          headers["X-Chunk-Checksum-Alg"] = "sha256";
        }
        await axiosClient.post("/api/upload", buf, {
          headers,
          signal: abortControllersRef.current[fileIndex]?.signal,
          timeout: 300000,
        });
        return true;
      } catch (error) {
        recordRetryAttempt(fileIndex);
        if (isChecksumMismatch(error)) {
          checksumMismatchRef.current[fileIndex] =
            (checksumMismatchRef.current[fileIndex] || 0) + 1;
          if (
            checksumMismatchRef.current[fileIndex] >=
            CHECKSUM_MISMATCH_THRESHOLD
          ) {
            const err = new Error("RESTART_WITH_SMALLER_CHUNKS");
            err.code = "RESTART_WITH_SMALLER_CHUNKS";
            throw err;
          }
        }
        if (attempt >= 2) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
    return true;
  };

  // ================= RESEND MISSING CHUNKS (SEQUENTIAL + IN-ORDER) =================
  // CRITICAL: With in-order validation on backend, we MUST send chunks sequentially
  // and in ascending order. Backend will reject any out-of-order chunk!
  const resendMissingChunks = async ({
    fileState,
    fileIndex,
    uploadId,
    chunks,
    missingChunks,
  }) => {
    const list = Array.isArray(missingChunks) ? missingChunks : [];
    if (list.length === 0) return true;
    
    // ✅ CRITICAL: Sort chunks in ascending order for in-order validation
    const sortedList = [...list].sort((a, b) => a - b);
    
    console.log(`[Upload] Resending ${sortedList.length} chunks in order: ${sortedList.slice(0, 5).join(", ")}${sortedList.length > 5 ? "..." : ""}`);
    
    // First, check what chunk backend actually expects
    try {
      const statusRes = await axiosClient.get("/api/upload/status", {
        params: { uploadId },
      });
      const statusData = statusRes?.data;
      
      // If backend reports a different expected chunk, we need to start from there
      // This handles cases where bitmap shows missing chunks but they were actually received
      if (statusData?.nextExpectedChunk !== undefined) {
        const expectedIdx = statusData.nextExpectedChunk;
        // Filter to only include chunks that backend actually needs
        const neededChunks = sortedList.filter(idx => idx >= expectedIdx);
        if (neededChunks.length === 0) {
          console.log(`[Upload] Backend expects chunk ${expectedIdx}, no missing chunks need resending`);
          return true;
        }
        if (neededChunks[0] !== expectedIdx) {
          console.warn(`[Upload] Backend expects chunk ${expectedIdx}, but first missing is ${neededChunks[0]}. Gap detected!`);
          // Cannot fill the gap - let polling handle it
          return false;
        }
      }
    } catch (e) {
      // Ignore status check errors, proceed with resend
    }
    
    // ✅ Send chunks STRICTLY SEQUENTIALLY (concurrency = 1)
    for (const chunkIdx of sortedList) {
      if (cancelledRef.current[fileIndex]) return false;
      
      try {
        await sendChunkByIndex({
          fileState,
          fileIndex,
          chunkIdx,
          uploadId,
          chunks,
        });
        
        // OPTIMIZED: Giảm delay từ 100ms xuống 10ms
        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (error) {
        if (
          error?.code === "RESTART_WITH_SMALLER_CHUNKS" ||
          error?.code === "NETWORK_UNSTABLE"
        ) {
          throw error;
        }
        
        // Handle CHUNK_OUT_OF_ORDER - backend expects a different chunk
        if (error?.response?.data?.code === "CHUNK_OUT_OF_ORDER") {
          const expectedIdx = error.response.data.expectedIndex;
          console.warn(`[Upload] Resend chunk ${chunkIdx} rejected, backend expects ${expectedIdx}. Stopping resend.`);
          // Cannot continue - backend expects a chunk we don't have in missing list
          return false;
        }
        
        // For other errors, log and continue to next chunk
        console.error(`[Upload] Resend chunk ${chunkIdx} failed: ${error.message}`);
      }
    }
    return true;
  };

  // ================= COMPLETE UPLOAD (NON-BLOCKING) =================
  // Gọi /api/upload/complete để báo backend bắt đầu upload lên Drive
  // KHÔNG đợi Drive upload hoàn thành - để file tiếp theo bắt đầu ngay
  const triggerUploadComplete = async (fileState, fileIndex, uploadId, chunks) => {
    if (cancelledRef.current[fileIndex]) return false;

    try {
      const res = await axiosClient.post("/api/upload/complete", { uploadId });
      const data = res?.data || null;

      // ================= HANDLE MISSING CHUNKS ON COMPLETE =================
      // With in-order validation, if backend reports missing chunks after all chunks
      // were sent sequentially, there's likely a race condition or timing issue.
      // We'll try ONE resend attempt. The fixed resendMissingChunks function will:
      // 1. Sort chunks in ascending order
      // 2. Check backend's expected chunk first
      // 3. Send strictly sequentially
      if (data?.missingChunks && Array.isArray(data.missingChunks) && data.missingChunks.length > 0) {
        console.warn(`[Upload] Complete API reports ${data.missingChunks.length} missing chunks. Attempting sequential resend...`);
        
        const resendSuccess = await resendMissingChunks({
          fileState,
          fileIndex,
          uploadId,
          chunks,
          missingChunks: data.missingChunks,
        });
        
        if (resendSuccess) {
          // Try complete again after successful resend
          try {
            await axiosClient.post("/api/upload/complete", { uploadId });
          } catch (e) {
            console.warn(`[Upload] Second complete call failed: ${e.message}`);
          }
        } else {
          console.warn(`[Upload] Resend failed - chunks may be out of sync with backend`);
        }
      }

      // Không đợi Drive upload - set status = "processing" và return ngay
      setFileStates((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex && f.status !== "success" && f.status !== "error"
            ? { ...f, status: "processing", progress: 100 }
            : f
        )
      );

      // Start polling để track Drive upload status (background, non-blocking)
      pollStatusUntilDone(uploadId, fileIndex, fileState.file.size);

      return true;
    } catch (error) {
      console.warn(`[Upload] Complete request failed: ${error.message}`);
      // Vẫn set processing để không block file tiếp theo
      setFileStates((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex && f.status !== "success" && f.status !== "error"
            ? { ...f, status: "processing", progress: 100 }
            : f
        )
      );
      return true;
    }
  };

  // Legacy function for compatibility (still waits, used for retry scenarios)
  const completeUploadWithRetry = async (
    fileState,
    fileIndex,
    uploadId,
    chunks
  ) => {
    const maxRounds = 12;
    let round = 0;

    while (round < maxRounds) {
      if (cancelledRef.current[fileIndex]) return false;

      let data = null;
      try {
        const res = await axiosClient.post("/api/upload/complete", { uploadId });
        data = res?.data || null;
      } catch (error) {
        data = null;
      }

      if (data?.success) {
        return true;
      }

      const missingChunks =
        data?.missingChunks == null ? null : data?.missingChunks || [];
      if (Array.isArray(missingChunks) && missingChunks.length > 0) {
        await resendMissingChunks({
          fileState,
          fileIndex,
          uploadId,
          chunks,
          missingChunks,
        });
      } else if (missingChunks === null) {
        // No bitmap data yet, wait for watermark to advance
      } else {
        try {
          const statusRes = await axiosClient.get("/api/upload/status", {
            params: { uploadId },
          });
          const statusData = statusRes?.data || null;
          if (statusData?.state === "COMPLETED") {
            return true;
          }
        } catch (error) {
          // Ignore status errors
        }
      }

      round++;
      const retryAfterMs =
        typeof data?.retryAfterMs === "number" ? data.retryAfterMs : 500;
      await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
    }

    throw new Error("Không thể hoàn tất upload: vẫn thiếu chunks");
  };

  const uploadFileWithChunks = async (fileState, fileIndex) => {
    const file = fileState.file;
    // Bắt đầu với chunk size cơ bản, sẽ điều chỉnh sau khi đo băng thông
    const forcedChunkSize =
      forcedChunkSizeRef.current[fileIndex] || fileState.chunkSize;
    let chunks = forcedChunkSize
      ? createFileChunksWithSize(file, forcedChunkSize)
      : createFileChunks(file);
    abortControllersRef.current[fileIndex] = new AbortController();

    // Theo dõi băng thông để điều chỉnh chunk size
    let measuredBandwidthKbps = null;
    const bandwidthMeasurements = [];
    setFileStates((prev) =>
      prev.map((f, idx) =>
        idx === fileIndex ? { ...f, chunks, status: "uploading" } : f
      )
    );
    let uploadId = fileState.uploadId;
    if (fileState.resumeUpload && uploadId) {
      setFileStates((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex ? { ...f, status: "uploading" } : f
        )
      );
      try {
        const statusRes = await axiosClient.get("/api/upload/status", {
          params: { uploadId },
        });
        const statusData = statusRes?.data || null;
        const missingChunks = statusData?.missingChunks || [];
        if (Array.isArray(missingChunks) && missingChunks.length > 0) {
          await resendMissingChunks({
            fileState,
            fileIndex,
            uploadId,
            chunks,
            missingChunks,
          });
        }
        await completeUploadWithRetry(fileState, fileIndex, uploadId, chunks);
      } catch (error) {
        const msg =
          error?.response?.data?.error ||
          error?.message ||
          "Không thể resume upload";
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "error", error: msg } : f
          )
        );
      }
      return;
    }
    if (!uploadId) {
      try {
        const firstChunkBuf = await readFileChunk(
          file,
          chunks[0].start,
          chunks[0].end
        );
        const firstChecksum = await getChunkChecksum(firstChunkBuf);
        uploadId = `${batchId}-${fileIndex}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 11)}`;
        const firstHeaders = {
          "Content-Type": "application/octet-stream",
          "X-Upload-Id": encodeURIComponent(uploadId),
          "X-Chunk-Index": 0,
          "X-Total-Chunks": chunks.length,
          "X-File-Name": encodeURIComponent(file.name),
          "X-Mime-Type": encodeURIComponent(
            file.type || "application/octet-stream"
          ),
          "X-Parent-Id": encodeURIComponent(parentId || ""),
          "X-Is-First-Chunk": "1",
          "X-Is-Last-Chunk": chunks.length === 1 ? "1" : "0",
          "X-File-Size": file.size,
          "X-Relative-Path": encodeURIComponent(fileState.relativePath || ""),
          "X-Batch-Id": encodeURIComponent(batchId || ""),
          "X-Chunk-Start": chunks[0].start,
          "X-Chunk-End": chunks[0].end,
        };
        if (firstChecksum) {
          firstHeaders["X-Chunk-Checksum"] = firstChecksum;
          firstHeaders["X-Chunk-Checksum-Alg"] = "sha256";
        }
        if (isFolder && fileIndex === 0 && emptyFolders?.length > 0) {
          firstHeaders["X-Empty-Folders"] = encodeURIComponent(
            JSON.stringify(emptyFolders)
          );
        }
        if (cancelledRef.current[fileIndex]) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        // Tăng timeout lên 5 phút (300000ms) cho mạng chậm (77-242 KB/s)
        // Retry với exponential backoff cho chunk đầu tiên
        const resp = await retryWithBackoff(
          async () => {
            return await axiosClient.post("/api/upload", firstChunkBuf, {
          headers: firstHeaders,
          signal: abortControllersRef.current[fileIndex]?.signal,
              timeout: 300000, // 5 phút timeout cho chunk đầu tiên
        });
          },
          3, // Max 3 retries
          2000 // Base delay 2 giây
        );
        const data = resp.data;
        if (resp.status !== 200 || !data.success) {
          toast.error(data.error || "Lỗi upload");
          throw new Error(data.error || "Lỗi upload");
        }
        const assembledBytes = Number(data.assembledBytes || 0);
        const pct = Math.max(
          0,
          Math.min(100, Math.round((assembledBytes / file.size) * 100))
        );
        // Track upload speed
        const now = Date.now();
        if (!uploadSpeedRef.current[fileIndex]) {
          uploadSpeedRef.current[fileIndex] = { bytes: 0, time: now - 100 };
        }
        const speedData = uploadSpeedRef.current[fileIndex];
        const timeDiff = (now - speedData.time) / 1000; // seconds
        if (timeDiff > 0) {
          const bytesDiff = assembledBytes - speedData.bytes;
          const currentSpeed = bytesDiff / timeDiff;
          setSpeed(currentSpeed);
          uploadSpeedRef.current[fileIndex] = {
            bytes: assembledBytes,
            time: now,
          };
        }
        const initialStatus =
          assembledBytes >= file.size ? "processing" : "uploading";
        setFileStates((prev) => {
          const next = prev.map((f, idx) =>
            idx === fileIndex
              ? { ...f, uploadId, progress: pct, status: initialStatus }
              : f
          );
          const overallProgress = calculateOverallProgress(next);
          setProgress(overallProgress);
          // Calculate ETA
          const completedFiles = next.filter(
            (f) => f.status === "success"
          ).length;
          const etaSeconds = calculateETA(
            overallProgress,
            speed,
            next.length,
            completedFiles,
            next
          );
          setEta(etaSeconds);
          return next;
        });
        const resumeMeta = {
          fileName: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          relativePath: fileState.relativePath || "",
          batchId: batchId || "",
          parentId: parentId || "",
          chunkSize: chunks[0]?.size || null,
        };
        await saveUploadFile(uploadId, file, resumeMeta);
        addPendingUpload(uploadId, resumeMeta);
      } catch (error) {
        if (error?.code === "RESTART_WITH_SMALLER_CHUNKS") {
          const currentChunkSize = chunks[0]?.size || 0;
          await requestRestartWithSmallerChunks(
            fileState,
            fileIndex,
            uploadId,
            currentChunkSize
          );
          return;
        }
        if (error?.code === "NETWORK_UNSTABLE") {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? { ...f, status: "error", error: "Mạng không ổn định" }
                : f
            )
          );
          return;
        }
        if (
          error.name === "AbortError" ||
          String(error.message).includes("aborted")
        ) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        const msg =
          error?.response?.data?.error ||
          error?.message ||
          "Lỗi không xác định";
        toast.error(msg);
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "error", error: msg } : f
          )
        );
        return;
      }
    }
    
    // Khởi tạo failed chunks array cho file này
    if (!failedChunksRef.current[fileIndex]) {
      failedChunksRef.current[fileIndex] = [];
    }
    
    // ================= SEQUENTIAL CHUNK UPLOAD LOCK =================
    // Ensure only ONE chunk is being uploaded at a time (strictly sequential)
    let uploadingChunk = false;
    let nextChunkIndex = 1;
    let chunkRetryCount = 0; // Track retries for current chunk
    const MAX_CHUNK_RETRIES = 5; // Max retries per chunk before failing

    while (nextChunkIndex < chunks.length) {
      if (cancelledRef.current[fileIndex]) {
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "cancelled" } : f
          )
        );
        return;
      }

      // ================= WAIT FOR PREVIOUS CHUNK TO COMPLETE =================
      // CRITICAL: Only send next chunk after previous is fully uploaded + confirmed by backend
      while (uploadingChunk) {
        await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms for previous chunk to finish
      }

      const i = nextChunkIndex;
      uploadingChunk = true; // Lock - prevent next chunk from starting

      try {
        // ================= NETWORK CHECK =================
        // Wait for network if offline (max 60 seconds before timeout)
        if (!navigator.onLine) {
          console.warn(`[Upload] Offline detected at chunk ${i}, waiting...`);
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? { ...f, status: "uploading", error: "Đang chờ kết nối mạng..." }
                : f
            )
          );
          
          const waitForNetwork = () =>
            new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                window.removeEventListener("online", onOnline);
                reject(new Error("Network timeout - offline too long"));
              }, 60000); // 60s timeout

              const onOnline = () => {
                clearTimeout(timeout);
                window.removeEventListener("online", onOnline);
                resolve();
              };

              if (navigator.onLine) {
                clearTimeout(timeout);
                resolve();
              } else {
                window.addEventListener("online", onOnline);
              }
            });

          try {
            await waitForNetwork();
            console.log(`[Upload] Network restored, resuming chunk ${i}`);
            setFileStates((prev) =>
              prev.map((f, idx) =>
                idx === fileIndex ? { ...f, error: null } : f
              )
            );
          } catch (networkError) {
            console.error(`[Upload] Network timeout at chunk ${i}`);
            setFileStates((prev) =>
              prev.map((f, idx) =>
                idx === fileIndex
                  ? { ...f, status: "error", error: "Mất kết nối mạng quá lâu" }
                  : f
              )
            );
            return;
          }
        }

        const ch = chunks[i];
        const buf = await readFileChunk(file, ch.start, ch.end);
        const checksum = await getChunkChecksum(buf);
        if (cancelledRef.current[fileIndex]) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        const headers = {
          "Content-Type": "application/octet-stream",
          "X-Upload-Id": uploadId,
          "X-Chunk-Index": i,
          "X-Total-Chunks": chunks.length,
          "X-File-Name": encodeURIComponent(file.name),
          "X-Mime-Type": encodeURIComponent(
            file.type || "application/octet-stream"
          ),
          "X-Parent-Id": encodeURIComponent(parentId || ""),
          "X-Is-First-Chunk": "0",
          "X-Is-Last-Chunk": i === chunks.length - 1 ? "1" : "0",
          "X-File-Size": file.size,
          "X-Relative-Path": encodeURIComponent(fileState.relativePath || ""),
          "X-Batch-Id": encodeURIComponent(batchId || ""),
          "X-Chunk-Start": ch.start,
          "X-Chunk-End": ch.end,
        };
        if (checksum) {
          headers["X-Chunk-Checksum"] = checksum;
          headers["X-Chunk-Checksum-Alg"] = "sha256";
        }
        // Tăng timeout lên 5 phút (300000ms) cho mạng chậm (77-242 KB/s)
        // Tính timeout dựa trên chunk size: ít nhất 5 phút, hoặc 2x thời gian ước tính
        const chunkSizeMB = (ch.end - ch.start) / (1024 * 1024);
        const estimatedTimeMs = (chunkSizeMB / 0.242) * 1000 * 2; // 2x thời gian ước tính với 242 KB/s
        const chunkTimeout = Math.max(300000, estimatedTimeMs); // Tối thiểu 5 phút
        
        // ================= STRICTLY SEQUENTIAL UPLOAD =================
        console.log(`[Upload] Sending chunk ${i}/${chunks.length} (WAITING FOR BACKEND CONFIRMATION)...`);
        
        // Retry với exponential backoff cho chunks bị lỗi (network errors, timeouts)
        const resp = await retryWithBackoff(
          async () => {
            return await axiosClient.post("/api/upload", buf, {
          headers,
          signal: abortControllersRef.current[fileIndex]?.signal,
              timeout: chunkTimeout,
        });
          },
          3, // Max 3 retries
          2000 // Base delay 2 giây (2s, 4s, 8s)
        );

        const data = resp.data;
        if (resp.status !== 200 || !data.success) {
          // ================= IN-ORDER VALIDATION HANDLING =================
          // Backend rejected chunk due to out-of-order arrival
          if (data.code === "CHUNK_OUT_OF_ORDER") {
            console.warn(
              `[Upload] ❌ Chunk ${i} out-of-order, backend expected ${data.expectedIndex}. Rewinding to ${data.expectedIndex}...`,
            );
            // Reset to the chunk backend actually expects
            // This handles case where frontend sent chunks 1,2,3 but backend still expects 1
            nextChunkIndex = data.expectedIndex || i;
            uploadingChunk = false; // Unlock to retry from expected index
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          throw new Error(data.error || `Upload chunk ${i} thất bại`);
        }
        
        // ✅ CRITICAL: Backend confirmed this chunk is FULLY processed before we move to next
        console.log(`[Upload] ✅ Chunk ${i} CONFIRMED by backend, moving to next chunk...`);
        nextChunkIndex++; // Only advance after backend confirmation
        chunkRetryCount = 0; // Reset retry count on success
        uploadingChunk = false; // Unlock to allow next chunk to start
        
        // ⏱️ OPTIMIZED: Giảm delay từ 100ms xuống 10ms
        // Backend đã có Redis-backed in-order validation, không cần delay lâu
        // 10ms đủ để event loop xử lý và tránh blocking hoàn toàn
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const assembledBytes = Number(data.assembledBytes || 0);
        const pct = Math.max(
          0,
          Math.min(100, Math.round((assembledBytes / file.size) * 100))
        );
        const isAssembled = assembledBytes >= file.size;
        // Track upload speed và đo băng thông
        const now = Date.now();
        if (!uploadSpeedRef.current[fileIndex]) {
          uploadSpeedRef.current[fileIndex] = { bytes: 0, time: now - 100 };
        }
        const speedData = uploadSpeedRef.current[fileIndex];
        const timeDiff = (now - speedData.time) / 1000; // seconds
        if (timeDiff > 0) {
          const bytesDiff = assembledBytes - speedData.bytes;
          const currentSpeed = bytesDiff / timeDiff; // bytes per second
          setSpeed(currentSpeed);

          // Đo băng thông và lưu lại
          const bandwidthKbps = (currentSpeed * 8) / 1024; // Convert to Kbps
          bandwidthMeasurements.push(bandwidthKbps);

          // Nếu đã đo được ít nhất 3 chunks và băng thông ổn định, có thể điều chỉnh chunk size
          if (bandwidthMeasurements.length >= 3 && i === 2) {
            const avgBandwidth =
              bandwidthMeasurements.reduce((a, b) => a + b, 0) /
              bandwidthMeasurements.length;
            const newChunkSize = getAdaptiveChunkSize(file.size, avgBandwidth);

            // Nếu chunk size mới khác đáng kể (>20%), tính lại chunks
            const currentChunkSize = chunks[0]?.size || 0;
            const sizeRatio = newChunkSize / currentChunkSize;

            if (sizeRatio > 1.2 || sizeRatio < 0.8) {
              const newChunks = createFileChunks(file, avgBandwidth);
              console.log(
                `[Upload] Điều chỉnh chunk size cho file ${
                  file.name
                } tại chunk ${i}: ${chunks.length} → ${
                  newChunks.length
                } chunks (${(sizeRatio * 100).toFixed(
                  0
                )}% thay đổi, bandwidth: ${avgBandwidth.toFixed(0)} Kbps)`
              );
              // Note: Trong production, có thể implement logic phức tạp hơn để chuyển đổi chunks đang chạy
            }
          }

          uploadSpeedRef.current[fileIndex] = {
            bytes: assembledBytes,
            time: now,
          };
        }
        setFileStates((prev) => {
          const next = prev.map((f, idx) =>
            idx === fileIndex
              ? {
                  ...f,
                  progress: pct,
                  status: isAssembled ? "processing" : "uploading",
                }
              : f
          );
          const overallProgress = calculateOverallProgress(next);
          setProgress(overallProgress);
          // Calculate ETA
          const completedFiles = next.filter(
            (f) => f.status === "success"
          ).length;
          const etaSeconds = calculateETA(
            overallProgress,
            speed,
            next.length,
            completedFiles,
            next
          );
          setEta(etaSeconds);
          return next;
        });
        if (i === chunks.length - 1) {
          // Bắt đầu polling như fallback nếu WebSocket event không đến
          // WebSocket event vẫn là primary method, nhưng polling đảm bảo không bị treo
            pollStatusUntilDone(uploadId, fileIndex, file.size);
        }
      } catch (error) {
        // ✅ CRITICAL: Always unlock uploadingChunk on error to prevent infinite wait
        uploadingChunk = false;
        
        if (
          error.name === "AbortError" ||
          String(error.message).includes("aborted")
        ) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        const statusCode = error?.response?.status;
        const msg =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message;
        if (
          statusCode === 499 ||
          (msg &&
            (msg.includes("session") ||
              msg.includes("Không tìm thấy session") ||
              msg.includes("not exist") ||
              msg.includes("cancel") ||
              msg.includes("hủy") ||
              msg.includes("clientClosedRequest") ||
              msg.includes("Client Closed Request")))
        ) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        
        // ================= STRICTLY SEQUENTIAL: RETRY SAME CHUNK =================
        // CRITICAL: Do NOT skip to next chunk! Retry THIS chunk with backoff.
        // Backend expects chunks in order, skipping causes cascade failure!
        chunkRetryCount++;
        console.warn(`[Upload] ❌ Chunk ${i} fail (${msg || error.message}), retry ${chunkRetryCount}/${MAX_CHUNK_RETRIES}...`);
        
        if (chunkRetryCount >= MAX_CHUNK_RETRIES) {
          // Too many retries - fail the upload
          console.error(`[Upload] ❌❌ Chunk ${i} failed after ${MAX_CHUNK_RETRIES} retries, stopping upload.`);
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? { ...f, status: "error", error: `Chunk ${i} thất bại sau ${MAX_CHUNK_RETRIES} lần thử: ${msg || error.message}` }
                : f
            )
          );
          return;
        }
        
        // Exponential backoff before retry (1s, 2s, 4s...)
        const backoffMs = Math.min(1000 * Math.pow(2, chunkRetryCount - 1), 10000);
        console.log(`[Upload] Waiting ${backoffMs}ms before retrying chunk ${i}...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        // Loop will continue with SAME nextChunkIndex (retry same chunk)
        // DO NOT continue or increment - just let the while loop retry
      }
    }
    
    // ✅ All chunks sent successfully (no need for separate retry - we retry inline now)
    console.log(`[Upload] ✅ All ${chunks.length} chunks sent successfully for file ${file.name}`);

    if (!cancelledRef.current[fileIndex] && uploadId) {
      // ✅ FIX: Dùng triggerUploadComplete (non-blocking) thay vì completeUploadWithRetry
      // Điều này cho phép file tiếp theo bắt đầu ngay khi chunks đã gửi xong
      // Drive upload sẽ chạy background và track qua WebSocket/polling
      await triggerUploadComplete(fileState, fileIndex, uploadId, chunks);
    }
  };

  const cancelUpload = async (fileIndex) => {
    cancelledRef.current[fileIndex] = true;
    if (statusPollersRef.current[fileIndex]) {
      clearInterval(statusPollersRef.current[fileIndex]);
      delete statusPollersRef.current[fileIndex];
    }
    if (abortControllersRef.current[fileIndex]) {
      abortControllersRef.current[fileIndex].abort();
    }
    const fileState = fileStates[fileIndex];
    if (fileState.uploadId) {
      try {
        const response = await axiosClient.post("/api/upload/cancel", {
          uploadId: fileState.uploadId,
        });
        const data = response.data;
        if (data?.success || response.status === 200) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
        } else {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? {
                    ...f,
                    status: "error",
                    error: data?.error || "Hủy upload thất bại",
                  }
                : f
            )
          );
        }
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message;
        if (String(msg).includes("hủy")) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
        } else {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex
                ? { ...f, status: "error", error: msg || "Hủy upload thất bại" }
                : f
            )
          );
        }
      }
    } else {
      setFileStates((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex ? { ...f, status: "cancelled" } : f
        )
      );
    }
  };

  useEffect(() => {
    // For permanent-delete, move, and create_folder, skip the upload check
    const isNonUploadBatch =
      batchType === "permanent-delete" ||
      batchType === "move" ||
      batchType === "create_folder";
    if (!isNonUploadBatch && (hasUploaded.current || isUploadingRef.current)) {
      return;
    }
    if (!isNonUploadBatch) {
      hasUploaded.current = true;
      isUploadingRef.current = true;
      hasCompletedRef.current = false;
    }
    const handleError = (error) => {
      console.error("Upload error:", error);
      if (!isNonUploadBatch) {
        isUploadingRef.current = false;
      }
      setFileStates((prev) =>
        prev.map((f) => ({ ...f, status: "error", error: error.message }))
      );
      setProgress(100);
    };

    if (batchType === "delete") {
      const items = Array.isArray(moveItems) ? moveItems : [];
      (async () => {
        setStatus("pending");
        setProgress(0);
        setEta(null);
        const startTime = Date.now();
        const totalItems = items.length;
        let lastProgress = 0;
        // Track progress based on time elapsed and estimated processing time
        // Each item takes approximately 50-100ms + processing time
        const progressInterval = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          // Estimate: each item takes ~0.1-0.15 seconds on average (50ms delay + processing)
          const estimatedProcessed = Math.min(
            totalItems,
            Math.floor(elapsed / 0.12)
          );
          const estimatedProgress = Math.min(
            95,
            (estimatedProcessed / totalItems) * 100
          );
          // Only update if progress increased
          if (estimatedProgress > lastProgress) {
            setProgress(estimatedProgress);
            lastProgress = estimatedProgress;
            // Calculate ETA
            if (estimatedProcessed > 0 && elapsed > 0) {
              const avgTimePerItem = elapsed / estimatedProcessed;
              const remainingItems = totalItems - estimatedProcessed;
              const estimatedSeconds = remainingItems * avgTimePerItem;
              setEta(Math.round(estimatedSeconds));
            }
          }
        }, 100); // Update every 100ms for smoother progress
        try {
          const res = await axiosClient.post("/api/upload/delete", { items });
          clearInterval(progressInterval);
          const json = res.data;
          setStatus(json.success ? "success" : "error");
          setProgress(100);
          setEta(null);
          setTimeout(
            () => {
              setIsVisible(false);
              onComplete?.(json);
            },
            json.success ? 1500 : 2000
          );
        } catch (err) {
          clearInterval(progressInterval);
          setStatus("error");
          setProgress(100);
          setEta(null);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.({ error: err.message });
          }, 2000);
        }
      })();
      return;
    }

    if (batchType === "permanent-delete") {
      const items = Array.isArray(moveItems) ? moveItems : [];
      (async () => {
        setStatus("pending");
        setProgress(0);
        setEta(null);
        const startTime = Date.now();
        const totalItems = items.length;
        let lastProgress = 0;
        // Track progress based on time elapsed and estimated processing time
        // Each item takes approximately 50-100ms + processing time
        const progressInterval = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          // Estimate: each item takes ~0.1-0.15 seconds on average (50ms delay + processing)
          const estimatedProcessed = Math.min(
            totalItems,
            Math.floor(elapsed / 0.12)
          );
          const estimatedProgress = Math.min(
            95,
            (estimatedProcessed / totalItems) * 100
          );
          // Only update if progress increased
          if (estimatedProgress > lastProgress) {
            setProgress(estimatedProgress);
            lastProgress = estimatedProgress;
            // Calculate ETA
            if (estimatedProcessed > 0 && elapsed > 0) {
              const avgTimePerItem = elapsed / estimatedProcessed;
              const remainingItems = totalItems - estimatedProcessed;
              const estimatedSeconds = remainingItems * avgTimePerItem;
              setEta(Math.round(estimatedSeconds));
            }
          }
        }, 100); // Update every 100ms for smoother progress
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await axiosClient.post(
            "/api/upload/permanent-delete",
            { items },
            { headers }
          );
          clearInterval(progressInterval);
          const json = res.data;
          setStatus(json.success ? "success" : "error");
          setProgress(100);
          setEta(null);
          setTimeout(
            () => {
              setIsVisible(false);
              onComplete?.(json);
            },
            json.success ? 1500 : 2000
          );
        } catch (err) {
          clearInterval(progressInterval);
          setStatus("error");
          setProgress(100);
          setEta(null);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.({ error: err.message, success: false });
          }, 2000);
        }
      })();
      return;
    }

    if (batchType === "move") {
      const items = Array.isArray(moveItems) ? moveItems : [];
      (async () => {
        setStatus("pending");
        setProgress(0);
        setEta(null);
        const startTime = Date.now();
        const totalItems = items.length;
        let lastProgress = 0;
        // Track progress based on time elapsed and estimated processing time
        // Each item takes approximately 50-100ms + processing time
        const progressInterval = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          // Estimate: each item takes ~0.1-0.15 seconds on average (50ms delay + processing)
          const estimatedProcessed = Math.min(
            totalItems,
            Math.floor(elapsed / 0.12)
          );
          const estimatedProgress = Math.min(
            95,
            (estimatedProcessed / totalItems) * 100
          );
          // Only update if progress increased
          if (estimatedProgress > lastProgress) {
            setProgress(estimatedProgress);
            lastProgress = estimatedProgress;
            // Calculate ETA
            if (estimatedProcessed > 0 && elapsed > 0) {
              const avgTimePerItem = elapsed / estimatedProcessed;
              const remainingItems = totalItems - estimatedProcessed;
              const estimatedSeconds = remainingItems * avgTimePerItem;
              setEta(Math.round(estimatedSeconds));
            }
          }
        }, 100); // Update every 100ms for smoother progress
        try {
          const res = await axiosClient.post("/api/upload/move", {
            items,
            targetFolderId: moveTargetFolderId,
          });
          clearInterval(progressInterval);
          const json = res.data;
          setStatus(json.success ? "success" : "error");
          setProgress(100);
          setEta(null);
          setTimeout(
            () => {
              setIsVisible(false);
              onComplete?.(json);
            },
            json.success ? 1500 : 2000
          );
        } catch (err) {
          clearInterval(progressInterval);
          setStatus("error");
          setProgress(100);
          setEta(null);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.({ error: err.message });
          }, 2000);
        }
      })();
      return;
    }

    if (batchType === "create_folder") {
      (async () => {
        setStatus("pending");
        setProgress(30);
        try {
          const res = await axiosClient.post("/api/upload/create_folder", {
            name: folderName,
            parentId,
          });
          const json = res.data;
          setStatus(json.success && json.folder ? "success" : "error");
          setResult(json);
          setProgress(100);
          setTimeout(
            () => {
              setIsVisible(false);
              onComplete?.(json);
            },
            json.success && json.folder ? 1500 : 2000
          );
        } catch (err) {
          setStatus("error");
          setResult({ error: err.message });
          setProgress(100);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.({ error: err.message });
          }, 2000);
        }
      })();
      return;
    }

    (async () => {
      try {
        // Upload TUẦN TỰ (sequential) - đợi file đầu xong rồi mới upload file tiếp theo
        // Điều này giúp tránh chunks bị mất khi upload nhiều files cùng lúc
        for (let i = 0; i < fileStates.length; i++) {
          const fileIndex = i;
          const fileState = fileStates[fileIndex];
          const f = fileState.file;
          
          if (!f || f.size === 0) {
            setFileStates((prev) =>
              prev.map((ff, idx) =>
                idx === fileIndex
                  ? {
                      ...ff,
                      status: "error",
                      error: "File không hợp lệ hoặc rỗng",
                    }
                  : ff
              )
            );
            continue; // Bỏ qua file này, tiếp tục file tiếp theo
          }

          // Upload file này - triggerUploadComplete sẽ set status = "processing" ngay
          // và KHÔNG đợi Drive upload hoàn thành
          await uploadFileWithChunks(fileState, fileIndex);

          // Đợi ngắn để state update (setFileStates là async)
          await new Promise(resolve => setTimeout(resolve, 100));

          // Verify file đã chuyển sang processing/success/error
          const currentState = fileStatesRef.current[fileIndex];
          console.log(`[Upload] File ${i + 1}/${fileStates.length} đã gửi xong chunks (status: ${currentState?.status}), qua file tiếp theo...`);

          // Delay ngắn giữa các files để backend không bị overload
          // OPTIMIZED: Giảm từ 300ms xuống 50ms - đủ để backend khởi tạo session mới
          if (i < fileStates.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      } catch (e) {
        handleError(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  useEffect(() => {
    if (
      files.length === 0 ||
      batchType === "delete" ||
      batchType === "permanent-delete" ||
      batchType === "move" ||
      batchType === "create_folder"
    ) {
      return;
    }
    const isDoneStatus = (s) =>
      s === "success" ||
      s === "error" ||
      s === "cancelled" ||
      (CLOSE_ON_PROCESSING && s === "processing");
    const allDone = fileStates.every((f) => isDoneStatus(f.status));
    if (allDone && fileStates.length > 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const successfulFiles = fileStates.filter(
        (f) => f.status === "success"
      ).length;
      const hasErrors = fileStates.some((f) => f.status === "error");
      const processingFiles = fileStates.filter(
        (f) => f.status === "processing"
      ).length;
      // Collect uploadIds from all files that have been uploaded (including processing)
      // This includes files that are still uploading to Drive
      const uploadIds = fileStates
        .filter(
          (f) =>
            (f.status === "success" || f.status === "processing") && f.uploadId
        )
        .map((f) => f.uploadId);
      // No delay - hide immediately and let data render as soon as it's available
      isUploadingRef.current = false;
      setIsVisible(false);
      onComplete?.({
        success: successfulFiles > 0,
        totalFiles: fileStates.length,
        successfulFiles,
        hasErrors,
        processingFiles,
        finalizing: processingFiles > 0,
        uploadIds, // Pass uploadIds for real-time updates (includes processing files)
      });
    }
  }, [fileStates, files.length, batchType, onComplete]);

  if (!isVisible) return null;

  if (batchType === "move") {
    return (
      <div
        className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 bg-white rounded-lg shadow-card p-2 sm:p-3 md:p-5 flex flex-col gap-1.5 sm:gap-2 md:gap-4 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] md:max-w-[450px] w-full border border-gray-200 z-[9999]"
        style={style}
      >
        <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 md:mb-2">
          {status === "pending" ? (
            <FiUpload className="text-brand animate-pulse" size={14} />
          ) : status === "success" ? (
            <FiCheck className="text-success" size={14} />
          ) : (
            <FiX className="text-danger" size={14} />
          )}
          <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 truncate">
            {status === "pending"
              ? t("upload_status.moving")
              : status === "success"
                ? t("upload_status.move_success")
                : t("upload_status.move_failed")}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5">
          <div
            className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
              status === "success"
                ? "bg-success"
                : status === "error"
                  ? "bg-danger"
                  : "bg-brand"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Progress info: ETA */}
        {status === "pending" && progress < 100 && eta && eta > 0 && (
          <div className="flex items-center justify-end text-[9px] sm:text-[10px] md:text-xs text-gray-600">
            <span>Còn lại: {formatETA(eta)}</span>
          </div>
        )}
        <div className="flex flex-col gap-1 sm:gap-1 md:gap-1.5 mt-0.5 sm:mt-1 md:mt-2 max-h-20 sm:max-h-24 md:max-h-32 overflow-y-auto sidebar-scrollbar">
          {moveItems?.map((item, idx) => (
            <div
              key={idx}
              className="flex w-full items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs"
            >
              <Image
                src={
                  item.type === "folder"
                    ? "/images/icon/folder.png"
                    : "/images/icon/png.png"
                }
                alt="icon"
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 object-contain flex-shrink-0"
                width={16}
                height={16}
                placeholder="blur"
                blurDataURL="data:image/png;base64,..."
                priority
              />
              <span
                className="flex-1 truncate overflow-hidden min-w-0 file-name-fixed-width text-brand-700 font-semibold text-[10px] sm:text-xs"
                title={item.name || item.id}
              >
                {item.name || item.id}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (batchType === "create_folder") {
    return (
      <div
        className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 bg-white rounded-lg shadow-card p-2 sm:p-3 md:p-5 flex flex-col gap-1.5 sm:gap-2 md:gap-4 min-w-[240px] sm:min-w-[280px] md:min-w-[320px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] md:max-w-[450px] border border-gray-200 z-[9999]"
        style={style}
      >
        <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 md:mb-2">
          {status === "pending" ? (
            <FiUpload className="text-brand animate-pulse" size={14} />
          ) : status === "success" ? (
            <FiCheck className="text-success" size={14} />
          ) : (
            <FiX className="text-danger" size={14} />
          )}
          <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 truncate">
            {status === "pending"
              ? t("upload_status.creating_folder")
              : status === "success"
                ? t("upload_status.create_folder_success")
                : t("upload_status.create_folder_failed")}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5">
          <div
            className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
              status === "success"
                ? "bg-success"
                : status === "error"
                  ? "bg-danger"
                  : "bg-brand"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs mt-0.5 sm:mt-1 md:mt-2">
          <Image
            src={"/images/icon/folder.png"}
            alt="icon"
            className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 object-contain flex-shrink-0"
            width={16}
            height={16}
            placeholder="blur"
            blurDataURL="data:image/png;base64,..."
            priority
          />
          <span className="truncate flex-1 text-brand-700 font-semibold text-[10px] sm:text-xs">
            {folderName}
          </span>
        </div>
        {status === "error" && (
          <div className="text-[10px] sm:text-xs text-danger mt-1 sm:mt-2">
            {result?.error || t("upload_status.create_folder_error")}
          </div>
        )}
      </div>
    );
  }

  if (batchType === "delete" || batchType === "permanent-delete") {
    const isPermanent = batchType === "permanent-delete";
    return (
      <div
        className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 bg-white rounded-lg shadow-card p-2 sm:p-3 md:p-5 flex flex-col gap-1.5 sm:gap-2 md:gap-4 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] md:max-w-[450px] w-full border border-gray-200 z-[9999]"
        style={style}
      >
        <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 md:mb-2">
          {status === "pending" ? (
            <FiUpload className="text-brand animate-pulse" size={14} />
          ) : status === "success" ? (
            <FiCheck className="text-success" size={14} />
          ) : (
            <FiX className="text-danger" size={14} />
          )}
          <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 truncate">
            {status === "pending"
              ? isPermanent
                ? "Đang xóa vĩnh viễn..."
                : t("upload_status.deleting")
              : status === "success"
                ? isPermanent
                  ? "Đã xóa vĩnh viễn"
                  : t("upload_status.delete_success")
                : isPermanent
                  ? "Xóa vĩnh viễn thất bại"
                  : t("upload_status.delete_failed")}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5">
          <div
            className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
              status === "success"
                ? "bg-success"
                : status === "error"
                  ? "bg-danger"
                  : "bg-brand"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Progress info: ETA */}
        {status === "pending" && progress < 100 && eta && eta > 0 && (
          <div className="flex items-center justify-end text-[9px] sm:text-[10px] md:text-xs text-gray-600">
            <span>Còn lại: {formatETA(eta)}</span>
          </div>
        )}
        <div className="flex flex-col gap-1 sm:gap-1 md:gap-1.5 mt-0.5 sm:mt-1 md:mt-2 max-h-20 sm:max-h-24 md:max-h-32 overflow-y-auto sidebar-scrollbar">
          {moveItems?.map((item, idx) => (
            <div
              key={idx}
              className="flex w-full items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs"
            >
              <Image
                src={
                  item.type === "folder"
                    ? "/images/icon/folder.png"
                    : "/images/icon/png.png"
                }
                alt="icon"
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 object-contain flex-shrink-0"
                width={16}
                height={16}
                placeholder="blur"
                blurDataURL="data:image/png;base64,..."
                priority
              />
              <span
                className="flex-1 truncate overflow-hidden min-w-0 file-name-fixed-width text-danger-700 font-semibold text-[10px] sm:text-xs"
                title={item.name || item.id}
              >
                {item.name || item.id}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 md:bottom-6 md:right-6 bg-white rounded-lg shadow-card p-2 sm:p-3 md:p-5 flex flex-col gap-1.5 sm:gap-2 md:gap-4 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] md:max-w-[450px] w-full border border-gray-200 z-[9999]"
      style={style}
    >
      <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-0.5 sm:mb-1 md:mb-2">
        {progress < 100 ? (
          <Loader size="small" position="inline" hideText />
        ) : fileStates.some((f) => f.status === "error") ? (
          <FiX className="text-danger" size={10} />
        ) : (
          <FiCheck className="text-success" size={10} />
        )}
        <span className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 truncate">
          {progress < 100
            ? t("upload_status.uploading", { progress })
            : fileStates.some((f) => f.status === "error")
              ? t("upload_status.has_error")
              : t("upload_status.upload_success")}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5">
        <div
          className="bg-brand h-2 sm:h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Progress info: speed and ETA */}
      {progress < 100 && (
        <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs text-gray-600">
          <span>{formatSpeed(speed)}</span>
          {eta && eta > 0 && <span>Còn lại: {formatETA(eta)}</span>}
        </div>
      )}
      <div className="flex flex-col gap-1 sm:gap-1 md:gap-1.5 max-h-20 sm:max-h-24 md:max-h-32 overflow-y-auto sidebar-scrollbar">
        {isFolder ? (
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs">
            <Image
              src={"/images/icon/folder.png"}
              alt="icon"
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 object-contain flex-shrink-0"
              width={16}
              height={16}
              placeholder="blur"
              blurDataURL="data:image/png;base64,..."
              priority
            />
            <span className="truncate flex-1 text-brand-700 font-semibold text-[10px] sm:text-xs">
              {folderName}
            </span>
            <div className="flex-shrink-0">
              {progress < 100 ? (
                <FiUpload className="text-brand animate-pulse" size={10} />
              ) : fileStates.some((f) => f.status === "error") ? (
                <FiX className="text-danger" size={10} />
              ) : (
                <FiCheck className="text-success" size={10} />
              )}
            </div>
          </div>
        ) : (
          fileStates.map((f, idx) => {
            const drivePct = lastStatusRef.current[idx]?.drivePct ?? null;
            return (
              <div
                key={idx}
                className="flex flex-col gap-0.5 sm:gap-0.5 md:gap-1 w-full"
              >
                <div className="flex w-full items-center gap-1 sm:gap-1.5 md:gap-2 text-[10px] sm:text-xs">
                  <Image
                    src={f.icon}
                    alt="icon"
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 object-contain flex-shrink-0"
                    width={16}
                    height={16}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,..."
                    priority
                  />
                  <span
                    className={
                      "flex-1 truncate overflow-hidden min-w-0 file-name-fixed-width text-[10px] sm:text-xs" +
                      (f.status === "success"
                        ? " text-success-600"
                        : f.status === "error"
                          ? " text-danger-600"
                          : f.status === "uploading"
                            ? " text-brand-600"
                            : f.status === "processing"
                              ? " text-warning-600"
                              : " text-gray-600")
                    }
                    title={f.name}
                  >
                    {f.name}
                    {f.status === "processing" && drivePct != null && (
                      <span className="ml-0.5 sm:ml-1 md:ml-2 text-gray-600 text-[9px] sm:text-[10px] md:text-xs">
                        {" "}
                        (Drive {drivePct}%){" "}
                      </span>
                    )}
                  </span>
                  <div className="flex-shrink-0 flex items-center gap-0.5 sm:gap-0.5 md:gap-1">
                    <CircularProgress
                      percent={f.progress || 0}
                      size={14}
                      stroke={2}
                    />
                    {f.status === "success" ? (
                      <FiCheck className="text-success" size={10} />
                    ) : f.status === "error" ? (
                      <FiX className="text-danger" size={10} />
                    ) : f.status === "uploading" ? (
                      <FiUpload
                        className="text-brand animate-pulse"
                        size={10}
                      />
                    ) : f.status === "processing" ? (
                      <FiClock className="text-warning-600" size={10} />
                    ) : (
                      <FiClock className="text-gray-600" size={10} />
                    )}
                    {(f.status === "uploading" ||
                      f.status === "processing") && (
                      <button
                        onClick={() => cancelUpload(idx)}
                        className="text-danger hover:opacity-90"
                        title="Cancel upload"
                      >
                        <FiX size={9} />
                      </button>
                    )}
                    {f.status === "error" && (
                      <button
                        onClick={() =>
                          uploadFileWithChunks(fileStates[idx], idx)
                        }
                        className="text-brand hover:opacity-90"
                        title="Retry upload"
                      >
                        <FiUpload size={9} />
                      </button>
                    )}
                  </div>
                </div>
                {f.status === "error" && f.error && (
                  <div
                    className="text-[9px] sm:text-[10px] md:text-xs text-danger ml-4 sm:ml-5 md:ml-6 break-words max-w-full"
                    title={f.error}
                  >
                    {f.error}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function CircularProgress({ percent = 0, size = 24, stroke = 3 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} className="inline-block align-middle">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-success)"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.3s" }}
      />
    </svg>
  );
}

const MiniStatus = ({
  files = [],
  folders = [],
  emptyFolders = [],
  batchId,
  onComplete,
  style,
  batchType,
  folderName,
  parentId,
  moveItems,
  moveTargetFolderId,
  useChunkedUpload = false,
}) => {
  return (
    <>
      {batchType === "create_folder" ? (
        <MiniStatusBatch
          batchType={batchType}
          folderName={folderName}
          parentId={parentId}
          batchId={batchId}
          onComplete={onComplete}
          style={style}
        />
      ) : batchType === "move" ? (
        <MiniStatusBatch
          batchType={batchType}
          batchId={batchId}
          onComplete={onComplete}
          style={style}
          moveItems={moveItems}
          moveTargetFolderId={moveTargetFolderId}
        />
      ) : batchType === "delete" || batchType === "permanent-delete" ? (
        <MiniStatusBatch
          batchType={batchType}
          batchId={batchId}
          onComplete={onComplete}
          style={style}
          moveItems={moveItems}
        />
      ) : (
        <>
          {files && files.length > 0 && (
            <MiniStatusBatch
              files={files}
              isFolder={false}
              batchId={batchId + "-files"}
              onComplete={onComplete}
              style={style}
              parentId={parentId}
              useChunkedUpload={useChunkedUpload}
            />
          )}
          {folders && folders.length > 0 && (
            <MiniStatusBatch
              files={folders}
              isFolder={true}
              batchId={batchId + "-folders"}
              onComplete={onComplete}
              style={style}
              emptyFolders={emptyFolders}
              folderName={folders[0]?.relativePath?.split("/")[0] || "Thư mục"}
              parentId={parentId}
              useChunkedUpload={useChunkedUpload}
            />
          )}
        </>
      )}
    </>
  );
};

export default MiniStatus;
