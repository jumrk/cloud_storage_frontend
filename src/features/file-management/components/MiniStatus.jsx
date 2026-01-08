import React, { useEffect, useState, useRef } from "react";
import Loader from "@/shared/ui/Loader";
import { FiCheck, FiX, FiUpload, FiClock } from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import Image from "next/image";
import useSocket from "@/shared/lib/useSocket";
// Adaptive chunk size dựa trên file size và băng thông
const calculateOptimalChunkSize = (fileSize) => {
  // File rất nhỏ: tối đa 50% file size
  if (fileSize < 1 * 1024 * 1024)
    return Math.max(256 * 1024, Math.floor(fileSize / 2));

  // File nhỏ: 1MB chunks
  if (fileSize < 10 * 1024 * 1024) return 1 * 1024 * 1024;

  // File trung bình: 2MB chunks
  if (fileSize < 100 * 1024 * 1024) return 2 * 1024 * 1024;

  // File lớn: 5MB chunks
  if (fileSize < 1024 * 1024 * 1024) return 5 * 1024 * 1024;

  // File rất lớn: 10MB chunks (giảm từ 50MB)
  if (fileSize < 10 * 1024 * 1024 * 1024) return 10 * 1024 * 1024;

  // File cực lớn: 15MB chunks (giảm từ 100MB)
  if (fileSize < 50 * 1024 * 1024 * 1024) return 15 * 1024 * 1024;

  // File khổng lồ: 25MB chunks (giảm từ 200MB)
  return 25 * 1024 * 1024;
};

// Hàm tính chunk size adaptive dựa trên băng thông đo được
const getAdaptiveChunkSize = (fileSize, measuredBandwidthKbps = null) => {
  const baseChunkSize = calculateOptimalChunkSize(fileSize);

  if (!measuredBandwidthKbps) return baseChunkSize;

  // Nếu băng thông cao (>10Mbps), tăng chunk size lên
  if (measuredBandwidthKbps > 10 * 1024) {
    return Math.min(baseChunkSize * 2, 50 * 1024 * 1024); // Max 50MB
  }

  // Nếu băng thông thấp (<1Mbps), giảm chunk size xuống
  if (measuredBandwidthKbps < 1024) {
    return Math.max(baseChunkSize / 2, 1 * 1024 * 1024); // Min 1MB
  }

  return baseChunkSize;
};
const CLOSE_ON_PROCESSING = true;
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
      uploadId: null,
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
        if (
          Number(data.nextDriveOffset) < Number(fileSize) &&
          data.state !== "COMPLETED"
        ) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "processing" } : f
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

  const uploadFileWithChunks = async (fileState, fileIndex) => {
    const file = fileState.file;
    // Bắt đầu với chunk size cơ bản, sẽ điều chỉnh sau khi đo băng thông
    let chunks = createFileChunks(file);
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
    if (!uploadId) {
      try {
        const firstChunkBuf = await readFileChunk(
          file,
          chunks[0].start,
          chunks[0].end
        );
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
        const resp = await axiosClient.post("/api/upload", firstChunkBuf, {
          headers: firstHeaders,
          signal: abortControllersRef.current[fileIndex]?.signal,
        });
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
          uploadSpeedRef.current[fileIndex] = { bytes: 0, time: now };
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
        setFileStates((prev) => {
          const next = prev.map((f, idx) =>
            idx === fileIndex
              ? { ...f, uploadId, progress: pct, status: "uploading" }
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
      } catch (error) {
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
    for (let i = 1; i < chunks.length; i++) {
      if (cancelledRef.current[fileIndex]) {
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "cancelled" } : f
          )
        );
        return;
      }
      try {
        const ch = chunks[i];
        const buf = await readFileChunk(file, ch.start, ch.end);
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
        const resp = await axiosClient.post("/api/upload", buf, {
          headers,
          signal: abortControllersRef.current[fileIndex]?.signal,
        });
        const data = resp.data;
        if (resp.status !== 200 || !data.success) {
          throw new Error(data.error || `Upload chunk ${i} thất bại`);
        }
        const assembledBytes = Number(data.assembledBytes || 0);
        const pct = Math.max(
          0,
          Math.min(100, Math.round((assembledBytes / file.size) * 100))
        );
        const isLast = i === chunks.length - 1;
        // Track upload speed và đo băng thông
        const now = Date.now();
        if (!uploadSpeedRef.current[fileIndex]) {
          uploadSpeedRef.current[fileIndex] = { bytes: 0, time: now };
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
                  status: isLast ? "processing" : "uploading",
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
        if (isLast) {
          // Không cần polling nữa - sẽ dùng WebSocket để nhận updates
          // Status sẽ được update qua socket events: file:driveUploadCompleted, file:security:rejected
        }
      } catch (error) {
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
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? { ...f, status: "error", error: msg || "Upload chunk thất bại" }
              : f
          )
        );
        return;
      }
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
        // Thực hiện upload SONG SONG thay vì tuần tự
        // Giới hạn số files upload song song để tránh chậm hệ thống
        const MAX_CONCURRENT_UPLOADS = 2; // Chỉ upload tối đa 2 files cùng lúc

        for (let i = 0; i < fileStates.length; i += MAX_CONCURRENT_UPLOADS) {
          const batch = fileStates.slice(i, i + MAX_CONCURRENT_UPLOADS);
          const uploadPromises = batch.map(async (fileState, batchIndex) => {
            const fileIndex = i + batchIndex;
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
              return;
            }
            await uploadFileWithChunks(fileStates[fileIndex], fileIndex);
          });

          // Chạy batch này song song, sau đó batch tiếp theo
          await Promise.allSettled(uploadPromises);

          // Delay nhỏ giữa các batch để tránh overload
          if (i + MAX_CONCURRENT_UPLOADS < fileStates.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
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
