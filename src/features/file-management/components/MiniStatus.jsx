import React, { useEffect, useState, useRef, useReducer } from "react";
import Loader from "@/shared/ui/Loader";
import { FiCheck, FiX, FiUpload, FiClock, FiFile, FiFolder, FiTrash2, FiMove } from "react-icons/fi";
import StatusCard from "@/shared/ui/StatusCard";
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
import { motion, AnimatePresence } from "framer-motion";



// ================= FIXED CHUNK SIZE =================
// Synced with backend auto-tuned chunk size (25MB for optimal performance)
const FIXED_CHUNK_SIZE = 25 * 1024 * 1024; // 25MB (match backend)

const calculateOptimalChunkSize = (fileSize) => {
  return FIXED_CHUNK_SIZE;
};

// Hàm tính chunk size adaptive - Disabled, returns fixed size
const getAdaptiveChunkSize = (fileSize, measuredBandwidthKbps = null) => {
  return FIXED_CHUNK_SIZE;
};
// Đóng MiniStatus khi chunks đã gửi lên server thành công (status = "processing")
// Backend đã có đủ cơ chế đảm bảo Drive upload:
// - Bull queue retry 5 lần với backoff
// - removeOnFail giữ failed jobs 24h để retry
// - Circuit breaker đánh dấu failed đúng cách
// → Không cần giữ MiniStatus mở để theo dõi Drive upload nữa
const CLOSE_ON_PROCESSING = true;
const MIN_CHUNK_SIZE = 25 * 1024 * 1024; // 25MB minimum (match backend)
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
// ✅ FIX #5: Reducer for fileStates to prevent race conditions
const fileStatesReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_FILE":
      return state.map((f, i) => 
        i === action.index ? { ...f, ...action.updates } : f
      );
    case "UPDATE_MULTIPLE":
      // Batch update multiple files at once
      return state.map((f, i) => {
        const update = action.updates[i];
        return update ? { ...f, ...update } : f;
      });
    case "RESET":
      return action.newState;
    default:
      return state;
  }
};

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
  // ✅ No need for token - cookie sent automatically
  const socketRef = useSocket(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // ✅ FIX #5: Use reducer instead of useState to prevent race conditions
  const [fileStates, dispatchFileStates] = useReducer(
    fileStatesReducer,
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
  // FIX C4: Lưu uploadId vào ref để cancelUpload luôn đọc được giá trị mới nhất
  // Trước đây đọc từ fileStates (React state) → stale closure → bỏ lỡ backend cancel
  const uploadIdRefs = useRef({});
  const hasCompletedRef = useRef(false);
  const statusPollersRef = useRef({});
  // Store file states ref để có thể access trong pollStatusUntilDone
  const fileStatesRef = useRef(fileStates);

  // ✅ FIX #5: Wrapper function to maintain backward compatibility with reducer
  const setFileStates = (updater) => {
    if (typeof updater === "function") {
      // If updater is a function, we need to apply it to current state
      // This is tricky with reducer, so we'll extract the new state and dispatch
      const newState = updater(fileStatesRef.current);
      dispatchFileStates({ type: "RESET", newState });
    } else {
      // Direct state update
      dispatchFileStates({ type: "RESET", newState: updater });
    }
  };

  // FIX C1: Atomic update helpers - dùng UPDATE_FILE thay vì RESET
  // Tránh race condition khi 2 updates đồng thời (WebSocket + polling) ghi đè lẫn nhau
  const updateFileState = (fileIndex, updates) => {
    dispatchFileStates({ type: "UPDATE_FILE", index: fileIndex, updates });
  };

  const updateMultipleFileStates = (updatesMap) => {
    dispatchFileStates({ type: "UPDATE_MULTIPLE", updates: updatesMap });
  };

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
      // Clear all polling timeouts (FIX C2: changed from clearInterval to clearTimeout)
      Object.values(statusPollersRef.current).forEach((timerId) => {
        if (timerId) clearTimeout(timerId);
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
      pollErrorCountRef.current = {};
      pollStartTimeRef.current = {};

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
              clearTimeout(statusPollersRef.current[idx]);
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

  // Track polling errors per file
  const pollErrorCountRef = useRef({});
  const pollStartTimeRef = useRef({});
  
  const pollStatusUntilDone = (uploadId, fileIndex, fileSize) => {
    if (statusPollersRef.current[fileIndex]) {
      clearTimeout(statusPollersRef.current[fileIndex]);
      delete statusPollersRef.current[fileIndex];
    }
    
    // Initialize error tracking
    pollErrorCountRef.current[fileIndex] = 0;
    pollStartTimeRef.current[fileIndex] = Date.now();
    
    const MAX_POLLING_DURATION = 10 * 60 * 1000; // 10 minutes max
    const MAX_CONSECUTIVE_ERRORS = 10;
    
    const tick = async () => {
      // Check timeout
      const elapsed = Date.now() - pollStartTimeRef.current[fileIndex];
      if (elapsed > MAX_POLLING_DURATION) {
        console.error(`[Upload] Polling timeout for file ${fileIndex} after ${elapsed / 1000}s`);
        clearTimeout(statusPollersRef.current[fileIndex]);
        delete statusPollersRef.current[fileIndex];
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex && f.status !== "success" && f.status !== "error"
              ? { ...f, status: "error", error: "Upload timeout - không nhận được phản hồi từ server" }
              : f
          )
        );
        return;
      }
      
      try {
        const res = await axiosClient.get("/api/upload/status", {
          params: { uploadId },
          timeout: 15000, // 15s timeout per request
        });
        const data = res.data;
        
        if (!data?.success) {
          pollErrorCountRef.current[fileIndex]++;
          console.warn(`[Upload] Poll returned success=false, error count: ${pollErrorCountRef.current[fileIndex]}`);
          
          if (pollErrorCountRef.current[fileIndex] >= MAX_CONSECUTIVE_ERRORS) {
            clearTimeout(statusPollersRef.current[fileIndex]);
            delete statusPollersRef.current[fileIndex];
            setFileStates((prev) =>
              prev.map((f, idx) =>
                idx === fileIndex && f.status !== "success" && f.status !== "error"
                  ? { ...f, status: "error", error: "Không thể lấy trạng thái upload từ server" }
                  : f
              )
            );
          }
          return;
        }
        
        // Reset error count on success
        pollErrorCountRef.current[fileIndex] = 0;
        
        lastStatusRef.current[fileIndex] = {
          assembledBytes: data.contiguousWatermark,
          driveBytes: data.nextDriveOffset,
          assembledPct: data.assembledPct,
          drivePct: data.drivePct,
          state: data.state,
        };
        
        // Log missing chunks for debugging (don't resend)
        if (data.missingChunks && Array.isArray(data.missingChunks) && data.missingChunks.length > 0) {
          console.warn(
            `[Upload] Polling detected ${data.missingChunks.length} missing chunks, but NOT resending.`,
            `With in-order validation, only the main upload loop can resend. Chunks: ${data.missingChunks.slice(0, 5).join(", ")}${data.missingChunks.length > 5 ? "..." : ""}`
          );
        }
        
        // Handle FAILED state - stop polling and show error
        if (data.state === "FAILED" || data.state === "ERROR") {
          clearTimeout(statusPollersRef.current[fileIndex]);
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
        clearTimeout(statusPollersRef.current[fileIndex]);
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
        pollErrorCountRef.current[fileIndex]++;
        console.error(`[FE] status poll error (${pollErrorCountRef.current[fileIndex]}/${MAX_CONSECUTIVE_ERRORS}):`, e?.message);
        
        if (pollErrorCountRef.current[fileIndex] >= MAX_CONSECUTIVE_ERRORS) {
          clearTimeout(statusPollersRef.current[fileIndex]);
          delete statusPollersRef.current[fileIndex];
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex && f.status !== "success" && f.status !== "error"
                ? { ...f, status: "error", error: `Lỗi kết nối: ${e?.message || "Không thể kiểm tra trạng thái upload"}` }
                : f
            )
          );
        }
      }
    };
    // FIX C2: Dùng setTimeout chain thay vì setInterval
    // setInterval gọi mỗi 3s bất kể tick trước đã xong chưa
    // Nếu server chậm (15s timeout), 5 tick chạy đồng thời → corrupt state
    const scheduleNextTick = () => {
      statusPollersRef.current[fileIndex] = setTimeout(async () => {
        await tick();
        if (!cancelledRef.current[fileIndex]) {
          scheduleNextTick();
        }
      }, 3000);
    };
    tick();
    scheduleNextTick();
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
      console.error(`[Upload] Complete request failed: ${error.message}`);
      // ✅ FIX: Set error status instead of processing when complete fails
      setFileStates((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex && f.status !== "success" && f.status !== "error"
            ? { ...f, status: "error", error: `Không thể hoàn tất upload: ${error.message}` }
            : f
        )
      );
      return false; // Return false to indicate failure
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
    // FIX C4: Lưu uploadId vào ref ngay khi có
    if (uploadId) uploadIdRefs.current[fileIndex] = uploadId;
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
        // FIX C4: Lưu uploadId vào ref ngay khi tạo, để cancelUpload luôn có thể đọc
        uploadIdRefs.current[fileIndex] = uploadId;
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
      clearTimeout(statusPollersRef.current[fileIndex]);
      delete statusPollersRef.current[fileIndex];
    }
    if (abortControllersRef.current[fileIndex]) {
      abortControllersRef.current[fileIndex].abort();
    }
    // FIX C4: Đọc uploadId từ ref (luôn mới nhất) thay vì từ fileStates (có thể stale)
    const uploadId = uploadIdRefs.current[fileIndex] || fileStates[fileIndex]?.uploadId;
    if (uploadId) {
      try {
        const response = await axiosClient.post("/api/upload/cancel", {
          uploadId: uploadId,
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
          // ✅ Cookie sent automatically with request
          const res = await axiosClient.post(
            "/api/upload/permanent-delete",
            { items }
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

  // ✅ FIX #1: Add timeout mechanism to force completion if stuck
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
      
      const uploadIds = fileStates
        .filter(
          (f) =>
            (f.status === "success" || f.status === "processing") && f.uploadId
        )
        .map((f) => f.uploadId);
      
      isUploadingRef.current = false;
      setIsVisible(false);
      onComplete?.({
        success: successfulFiles > 0,
        totalFiles: fileStates.length,
        successfulFiles,
        hasErrors,
        processingFiles,
        finalizing: processingFiles > 0,
        uploadIds,
      });
    }
    
    // ✅ FIX: Timeout mechanism - if all files uploaded but some stuck in "processing"
    // Force completion after 30 seconds to prevent UI stuck
    const allUploaded = fileStates.every(
      (f) => f.status !== "pending" && f.status !== "uploading"
    );
    
    if (allUploaded && fileStates.length > 0 && !hasCompletedRef.current) {
      const timeoutId = setTimeout(() => {
        if (!hasCompletedRef.current) {
          console.warn("[MiniStatus] Force completing upload after timeout");
          hasCompletedRef.current = true;
          
          const successfulFiles = fileStates.filter(
            (f) => f.status === "success"
          ).length;
          const hasErrors = fileStates.some((f) => f.status === "error");
          const processingFiles = fileStates.filter(
            (f) => f.status === "processing"
          ).length;
          
          const uploadIds = fileStates
            .filter(
              (f) =>
                (f.status === "success" || f.status === "processing") && f.uploadId
            )
            .map((f) => f.uploadId);
          
          isUploadingRef.current = false;
          setIsVisible(false);
          onComplete?.({
            success: successfulFiles > 0,
            totalFiles: fileStates.length,
            successfulFiles,
            hasErrors,
            processingFiles,
            finalizing: processingFiles > 0,
            uploadIds,
            timedOut: true, // Flag to indicate forced completion
          });
        }
      }, 120000); // 2 phút timeout - đủ cho Drive upload hoàn thành (trước đây 30s quá ngắn)
      
      return () => clearTimeout(timeoutId);
    }
  }, [fileStates, files.length, batchType, onComplete]);

  // Render logic with AnimatePresence for exit animations
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {batchType === "move" ? (
             <StatusCard
                title={status === "pending" ? t("upload_status.moving") : status === "success" ? t("upload_status.move_success") : t("upload_status.move_failed")}
                status={status}
                progress={progress}
                eta={formatETA(eta)}
                headerIcon={<FiMove size={18} />}
                headerColor="text-brand"
                style={style}
             >
                <div className="space-y-2">
                    {moveItems?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                             <div className="p-1 rounded bg-gray-100/50">
                                {item.type === "folder" ? <FiFolder className="text-yellow-500"/> : <FiFile className="text-gray-500"/>}
                             </div>
                             <span className="truncate text-gray-600 font-medium">{item.name || item.id}</span>
                        </div>
                    ))}
                </div>
             </StatusCard>
          ) : batchType === "create_folder" ? (
            <StatusCard
                title={status === "pending" ? t("upload_status.creating_folder") : status === "success" ? t("upload_status.create_folder_success") : t("upload_status.create_folder_failed")}
                status={status}
                progress={progress}
                headerIcon={<FiFolder size={18} />}
                headerColor="text-brand"
                style={style}
             >
                <div className="flex items-center gap-2 text-xs mt-1">
                     <div className="p-1 rounded bg-yellow-100/50 text-yellow-600">
                        <FiFolder />
                     </div>
                     <span className="truncate font-medium text-gray-700">{folderName}</span>
                </div>
                {status === "error" && (
                  <div className="text-xs text-danger mt-2 bg-danger/5 p-2 rounded">
                    {result?.error || t("upload_status.create_folder_error")}
                  </div>
                )}
             </StatusCard>
          ) : (batchType === "delete" || batchType === "permanent-delete") ? (
             <StatusCard
                title={
                    status === "pending"
                    ? (batchType === "permanent-delete" ? "Đang xóa vĩnh viễn..." : t("upload_status.deleting"))
                    : status === "success"
                        ? (batchType === "permanent-delete" ? "Đã xóa vĩnh viễn" : t("upload_status.delete_success"))
                        : (batchType === "permanent-delete" ? "Xóa vĩnh viễn thất bại" : t("upload_status.delete_failed"))
                }
                status={status}
                progress={progress}
                eta={formatETA(eta)}
                headerIcon={<FiTrash2 size={18} />}
                headerColor="text-danger" // Red for delete
                style={style}
             >
                <div className="space-y-2">
                    {moveItems?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs opacity-75">
                             <div className="p-1 rounded bg-danger/5 text-danger">
                                {item.type === "folder" ? <FiFolder /> : <FiFile />}
                             </div>
                             <span className="truncate text-gray-600 line-through decoration-danger/30">{item.name || item.id}</span>
                        </div>
                    ))}
                </div>
             </StatusCard>
          ) : (
            // Default: Upload Status
             <StatusCard
                title={
                   progress < 100
                    ? t("upload_status.uploading", { progress })
                    : fileStates.some((f) => f.status === "error")
                      ? t("upload_status.has_error")
                      : t("upload_status.upload_success")
                }
                status={status}
                progress={progress}
                speed={formatSpeed(speed)}
                eta={formatETA(eta)}
                headerIcon={<FiUpload size={18} />}
                headerColor="text-brand"
                style={style}
             >
                <div className="space-y-2 mt-1">
                    {isFolder ? (
                         <div className="flex items-center gap-2 text-xs">
                             <div className="p-1.5 rounded bg-yellow-100/50 text-yellow-600">
                                <FiFolder size={14}/>
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="truncate font-medium text-gray-700">{folderName}</p>
                             </div>
                             {fileStates.some((f) => f.status === "error") ? <FiX className="text-danger"/> : progress < 100 ? <Loader size="small"/> : <FiCheck className="text-success"/>}
                        </div>
                    ) : (
                        fileStates.map((f, idx) => {
                             const drivePct = lastStatusRef.current[idx]?.drivePct ?? null;
                             return (
                                <div key={idx} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                     <div className="p-1.5 rounded bg-brand/5 text-brand shrink-0">
                                        <FiFile size={14} />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`truncate text-xs font-medium ${
                                                f.status === 'success' ? 'text-success-700' :
                                                f.status === 'error' ? 'text-danger-700' :
                                                'text-gray-700'
                                            }`}>
                                                {f.name}
                                            </p>
                                        </div>
                                         <div className="flex items-center justify-between mt-0.5">
                                             <p className="text-[10px] text-gray-400">
                                                {f.status === 'processing' && drivePct != null ? `Drive: ${drivePct}%` :
                                                 f.status === 'success' ? 'Hoàn tất' :
                                                 f.status === 'error' ? 'Thất bại' :
                                                 f.status === 'uploading' ? 'Đang tải lên...' :
                                                 'Đang chờ...'}
                                             </p>
                                             {f.status !== 'success' && f.status !== 'error' ? (
                                                <div className="relative w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="absolute top-0 left-0 h-full bg-brand rounded-full" style={{width: `${f.progress || 0}%`}}></div>
                                                </div>
                                             ) : null}
                                         </div>
                                         {f.error && <p className="text-[10px] text-danger mt-1 bg-danger/5 p-1 rounded truncate" title={f.error}>{f.error}</p>}
                                     </div>

                                     <div className="shrink-0 flex items-center">
                                         {(f.status === "uploading" || f.status === "processing") && (
                                              <button
                                                onClick={() => cancelUpload(idx)}
                                                className="p-1 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                                                title="Hủy"
                                              >
                                                <FiX size={14} />
                                              </button>
                                         )}
                                          {f.status === "error" && (
                                              <button
                                                onClick={() => uploadFileWithChunks(fileStates[idx], idx)}
                                                className="p-1 text-gray-400 hover:text-brand hover:bg-brand/10 rounded-full transition-colors"
                                                title="Thử lại"
                                              >
                                                <FiUpload size={14} />
                                              </button>
                                         )}
                                          {f.status === "success" && <FiCheck className="text-success" size={14} />}
                                     </div>
                                </div>
                             )
                        })
                    )}
                </div>
             </StatusCard>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

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
