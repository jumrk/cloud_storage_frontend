import React, { useEffect, useState, useRef } from "react";
import Loader from "@/components/ui/Loader";
import { FiCheck, FiX, FiUpload, FiClock } from "react-icons/fi";
import axiosClient from "@/lib/axiosClient";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

/* ===========================
   Chunk sizing (giữ logic cũ)
=========================== */
// Đảm bảo file nào cũng có ít nhất 2 chunks
const calculateOptimalChunkSize = (fileSize) => {
  if (fileSize < 1 * 1024 * 1024) return Math.max(1, Math.floor(fileSize / 2));
  if (fileSize < 10 * 1024 * 1024) return 2 * 1024 * 1024;
  if (fileSize < 100 * 1024 * 1024) return 10 * 1024 * 1024;
  if (fileSize < 1024 * 1024 * 1024) return 25 * 1024 * 1024;
  if (fileSize < 10 * 1024 * 1024 * 1024) return 50 * 1024 * 1024;
  if (fileSize < 50 * 1024 * 1024 * 1024) return 100 * 1024 * 1024;
  return 200 * 1024 * 1024;
};
const CLOSE_ON_PROCESSING = true;
const createFileChunks = (file) => {
  const optimalChunkSize = calculateOptimalChunkSize(file.size);
  const chunks = [];
  let start = 0;

  while (start < file.size) {
    const end = Math.min(start + optimalChunkSize, file.size);
    chunks.push({ start, end, size: end - start });
    start = end;
  }

  if (chunks.length === 1) {
    const half = Math.floor(file.size / 2);
    chunks[0] = { start: 0, end: half, size: half };
    chunks.push({ start: half, end: file.size, size: file.size - half });
  }

  console.log(
    `[FE] 📊 ${file.name} ${(file.size / 1024 / 1024).toFixed(2)}MB → ${
      chunks.length
    } chunks (~${(optimalChunkSize / 1024 / 1024).toFixed(2)}MB/chunk)`
  );
  return chunks;
};

const readFileChunk = (file, start, end) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.onerror = reject;
    r.readAsArrayBuffer(file.slice(start, end));
  });

/* ===========================
   MiniStatus cho 1 batch
=========================== */
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

  const [fileStates, setFileStates] = useState(
    files.map((f) => ({
      file: f.file,
      name: f.name,
      relativePath: isFolder ? f.relativePath : undefined,
      icon: "/images/icon/png.png",
      status: "pending", // pending | uploading | processing | success | error | cancelled
      progress: 0, // % hiển thị cho UI mỗi file (assembled progress → 0..100)
      chunks: [],
      uploadId: null,
      error: null,
    }))
  );
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [status, setStatus] = useState("pending"); // cho các flow đặc biệt
  const [result, setResult] = useState(null);

  // Refs quản lý vòng đời upload
  const hasUploaded = useRef(false);
  const uploadAbortController = useRef(null);
  const cancelledRef = useRef({});
  const abortControllersRef = useRef({}); // Abort cho từng file
  const isUploadingRef = useRef(false);
  const hasCompletedRef = useRef(false);

  // Pollers & cache status Drive
  const statusPollersRef = useRef({}); // fileIndex -> setInterval id
  // Dọn mọi poller khi component unmount
  useEffect(() => {
    return () => {
      Object.values(statusPollersRef.current || {}).forEach((id) =>
        clearInterval(id)
      );
      statusPollersRef.current = {};
    };
  }, []);
  const lastStatusRef = useRef({}); // fileIndex -> { assembledBytes, driveBytes, ... }

  /* ===========================
     Overall progress (theo % mỗi file)
  =========================== */
  const calculateOverallProgress = (current) => {
    if (!current.length) return 0;
    const sum = current.reduce((acc, f) => acc + (Number(f.progress) || 0), 0);
    return Math.round(sum / current.length);
  };

  /* ===========================
     Poll /status tới khi Drive xong
  =========================== */
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

        // Lưu cache để UI có thể show “Đang đẩy lên Drive: x%”
        lastStatusRef.current[fileIndex] = {
          assembledBytes: data.contiguousWatermark,
          driveBytes: data.nextDriveOffset,
          assembledPct: data.assembledPct,
          drivePct: data.drivePct,
          state: data.state,
        };

        // Drive chưa xong → giữ trạng thái processing
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

        // Drive xong
        clearInterval(statusPollersRef.current[fileIndex]);
        delete statusPollersRef.current[fileIndex];

        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "success", progress: 100 } : f
          )
        );
        setProgress((p) =>
          calculateOverallProgress(
            fileStates.map((f, i) =>
              i === fileIndex ? { ...f, progress: 100, status: "success" } : f
            )
          )
        );
      } catch (e) {
        console.log("[FE] status poll error:", e?.message);
      }
    };

    tick();
    statusPollersRef.current[fileIndex] = setInterval(tick, 1500);
  };

  /* ===========================
     Upload 1 file bằng chunked upload
  =========================== */
  const uploadFileWithChunks = async (fileState, fileIndex) => {
    const file = fileState.file;
    const chunks = createFileChunks(file);

    // Tạo Abort cho file
    abortControllersRef.current[fileIndex] = new AbortController();

    // Khởi tạo state file
    setFileStates((prev) =>
      prev.map((f, idx) =>
        idx === fileIndex ? { ...f, chunks, status: "uploading" } : f
      )
    );

    let uploadId = fileState.uploadId;

    // Chunk đầu tiên → tạo session
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

        // Cập nhật progress theo assembledBytes
        const assembledBytes = Number(data.assembledBytes || 0);
        const pct = Math.max(
          0,
          Math.min(100, Math.round((assembledBytes / file.size) * 100))
        );

        setFileStates((prev) => {
          const next = prev.map((f, idx) =>
            idx === fileIndex
              ? { ...f, uploadId, progress: pct, status: "uploading" }
              : f
          );
          setProgress(calculateOverallProgress(next));
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

    // Các chunk tiếp theo
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
          setProgress(calculateOverallProgress(next));
          return next;
        });

        if (isLast) {
          // Nếu muốn đóng UI sớm, KHÔNG poll Drive
          if (!CLOSE_ON_PROCESSING) {
            pollStatusUntilDone(uploadId, fileIndex, file.size);
          }
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

  /* ===========================
     Cancel upload
  =========================== */
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
        // Dù BE trả sao, coi như đã hủy (best-effort)
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

  /* ===========================
     useEffect khởi chạy upload
  =========================== */
  useEffect(() => {
    if (hasUploaded.current || isUploadingRef.current) return;
    hasUploaded.current = true;
    isUploadingRef.current = true;
    hasCompletedRef.current = false;

    const handleError = (error) => {
      console.error("Upload error:", error);
      isUploadingRef.current = false;
      setFileStates((prev) =>
        prev.map((f) => ({ ...f, status: "error", error: error.message }))
      );
      setProgress(100);
    };

    // DELETE FLOW
    if (batchType === "delete") {
      const items = Array.isArray(moveItems) ? moveItems : [];
      (async () => {
        setStatus("pending");
        setProgress(30);
        try {
          const res = await axiosClient.post("/api/upload/delete", { items });
          const json = res.data;
          setStatus(json.success ? "success" : "error");
          setProgress(100);
          setTimeout(
            () => {
              setIsVisible(false);
              onComplete?.(json);
            },
            json.success ? 1500 : 2000
          );
        } catch (err) {
          setStatus("error");
          setProgress(100);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.({ error: err.message });
          }, 2000);
        }
      })();
      return;
    }

    // MOVE FLOW
    if (batchType === "move") {
      const items = Array.isArray(moveItems) ? moveItems : [];
      (async () => {
        setStatus("pending");
        setProgress(30);
        try {
          const res = await axiosClient.post("/api/upload/move", {
            items,
            targetFolderId: moveTargetFolderId,
          });
          const json = res.data;
          setStatus(json.success ? "success" : "error");
          setProgress(100);
          setTimeout(
            () => {
              setIsVisible(false);
              onComplete?.(json);
            },
            json.success ? 1500 : 2000
          );
        } catch (err) {
          setStatus("error");
          setProgress(100);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.({ error: err.message });
          }, 2000);
        }
      })();
      return;
    }

    // CREATE FOLDER FLOW
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

    // UPLOAD FLOW
    (async () => {
      try {
        for (let i = 0; i < fileStates.length; i++) {
          const f = fileStates[i].file;
          if (!f || f.size === 0) {
            setFileStates((prev) =>
              prev.map((ff, idx) =>
                idx === i
                  ? {
                      ...ff,
                      status: "error",
                      error: "File không hợp lệ hoặc rỗng",
                    }
                  : ff
              )
            );
            continue;
          }

          console.log(`[FE] 🚀 Upload file ${i}:`, {
            name: f.name,
            size: f.size,
            batchId,
          });

          await uploadFileWithChunks(fileStates[i], i);

          // Nghỉ 500ms giữa các file
          if (i < fileStates.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
          }

          // Cập nhật overall
          setProgress((p) => calculateOverallProgress(fileStates));
        }
      } catch (e) {
        handleError(e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  /* ===========================
     Ẩn UI khi mọi file kết thúc
  =========================== */
  useEffect(() => {
    if (
      files.length === 0 ||
      batchType === "delete" ||
      batchType === "move" ||
      batchType === "create_folder"
    ) {
      return;
    }
    const isDoneStatus = (s) =>
      s === "success" ||
      s === "error" ||
      s === "cancelled" ||
      (CLOSE_ON_PROCESSING && s === "processing"); // ✅ cho phép đóng khi processing
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
      setTimeout(() => {
        isUploadingRef.current = false;
        setIsVisible(false);
        onComplete?.({
          success: successfulFiles > 0,
          totalFiles: fileStates.length,
          successfulFiles,
          hasErrors,
          processingFiles, // số file đang đẩy Drive nền
          finalizing: processingFiles > 0, // gợi ý caller có thể reload sau
        });
      }, 2000);
    }
  }, [fileStates, files.length, batchType, onComplete]);

  if (!isVisible) return null;

  /* ===========================
     Render các flow đặc biệt
  =========================== */
  if (batchType === "move") {
    return (
      <div
        className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 flex flex-col gap-3 max-w-[340px] w-full border border-gray-200 z-[9999]"
        style={style}
      >
        <div className="flex items-center gap-2 mb-2">
          {status === "pending" ? (
            <FiUpload className="text-blue-500 animate-pulse" size={18} />
          ) : status === "success" ? (
            <FiCheck className="text-green-500" size={18} />
          ) : (
            <FiX className="text-red-500" size={18} />
          )}
          <span className="font-semibold text-sm text-gray-700 truncate">
            {status === "pending"
              ? t("upload_status.moving")
              : status === "success"
              ? t("upload_status.move_success")
              : t("upload_status.move_failed")}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              status === "success"
                ? "bg-green-500"
                : status === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-col gap-1 mt-2 max-h-32 overflow-y-auto">
          {moveItems?.map((item, idx) => (
            <div key={idx} className="flex w-full items-center gap-2 text-xs">
              <img
                src={
                  item.type === "folder"
                    ? "/images/icon/folder.png"
                    : "/images/icon/png.png"
                }
                alt="icon"
                className="w-4 h-4 object-contain flex-shrink-0"
              />
              <span
                className="flex-1 truncate overflow-hidden min-w-0 file-name-fixed-width text-blue-700 font-semibold"
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
        className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 flex flex-col gap-3 min-w-[280px] max-w-sm border border-gray-200 z-[9999]"
        style={style}
      >
        <div className="flex items-center gap-2 mb-2">
          {status === "pending" ? (
            <FiUpload className="text-blue-500 animate-pulse" size={18} />
          ) : status === "success" ? (
            <FiCheck className="text-green-500" size={18} />
          ) : (
            <FiX className="text-red-500" size={18} />
          )}
          <span className="font-semibold text-sm text-gray-700 truncate">
            {status === "pending"
              ? t("upload_status.creating_folder")
              : status === "success"
              ? t("upload_status.create_folder_success")
              : t("upload_status.create_folder_failed")}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              status === "success"
                ? "bg-green-500"
                : status === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs mt-2">
          <img
            src={"/images/icon/folder.png"}
            alt="icon"
            className="w-4 h-4 object-contain flex-shrink-0"
          />
          <span className="truncate flex-1 text-blue-700 font-semibold">
            {folderName}
          </span>
        </div>
        {status === "error" && (
          <div className="text-xs text-red-500 mt-2">
            {result?.error || t("upload_status.create_folder_error")}
          </div>
        )}
      </div>
    );
  }

  if (batchType === "delete") {
    return (
      <div
        className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 flex flex-col gap-3 max-w-[340px] w-full border border-gray-200 z-[9999]"
        style={style}
      >
        <div className="flex items-center gap-2 mb-2">
          {status === "pending" ? (
            <FiUpload className="text-blue-500 animate-pulse" size={18} />
          ) : status === "success" ? (
            <FiCheck className="text-green-500" size={18} />
          ) : (
            <FiX className="text-red-500" size={18} />
          )}
          <span className="font-semibold text-sm text-gray-700 truncate">
            {status === "pending"
              ? t("upload_status.deleting")
              : status === "success"
              ? t("upload_status.delete_success")
              : t("upload_status.delete_failed")}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              status === "success"
                ? "bg-green-500"
                : status === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-col gap-1 mt-2 max-h-32 overflow-y-auto">
          {moveItems?.map((item, idx) => (
            <div key={idx} className="flex w-full items-center gap-2 text-xs">
              <img
                src={
                  item.type === "folder"
                    ? "/images/icon/folder.png"
                    : "/images/icon/png.png"
                }
                alt="icon"
                className="w-4 h-4 object-contain flex-shrink-0"
              />
              <span
                className="flex-1 truncate overflow-hidden min-w-0 file-name-fixed-width text-red-700 font-semibold"
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

  /* ===========================
     Render upload mặc định
  =========================== */
  return (
    <div
      className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 flex flex-col gap-3 max-w-[340px] w-full border border-gray-200 z-[9999]"
      style={style}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        {progress < 100 ? (
          <Loader size="small" position="inline" hideText />
        ) : fileStates.some((f) => f.status === "error") ? (
          <FiX className="text-red-500" size={16} />
        ) : (
          <FiCheck className="text-green-500" size={16} />
        )}
        <span className="font-semibold text-sm text-gray-700 truncate">
          {progress < 100
            ? t("upload_status.uploading", { progress })
            : fileStates.some((f) => f.status === "error")
            ? t("upload_status.has_error")
            : t("upload_status.upload_success")}
        </span>
      </div>

      {/* Progress Bar tổng */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Files List */}
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {isFolder ? (
          <div className="flex items-center gap-2 text-xs">
            <img
              src={"/images/icon/folder.png"}
              alt="icon"
              className="w-4 h-4 object-contain flex-shrink-0"
            />
            <span className="truncate flex-1 text-blue-700 font-semibold">
              {folderName}
            </span>
            <div className="flex-shrink-0">
              {progress < 100 ? (
                <FiUpload className="text-blue-500 animate-pulse" size={14} />
              ) : fileStates.some((f) => f.status === "error") ? (
                <FiX className="text-red-500" size={14} />
              ) : (
                <FiCheck className="text-green-500" size={14} />
              )}
            </div>
          </div>
        ) : (
          fileStates.map((f, idx) => {
            const drivePct = lastStatusRef.current[idx]?.drivePct ?? null;
            return (
              <div key={idx} className="flex flex-col gap-0.5 w-full">
                <div className="flex w-full items-center gap-2 text-xs">
                  <img
                    src={f.icon}
                    alt="icon"
                    className="w-4 h-4 object-contain flex-shrink-0"
                  />
                  <span
                    className={
                      "flex-1 truncate overflow-hidden min-w-0 file-name-fixed-width" +
                      (f.status === "success"
                        ? " text-green-600"
                        : f.status === "error"
                        ? " text-red-600"
                        : f.status === "uploading"
                        ? " text-blue-600"
                        : f.status === "processing"
                        ? " text-yellow-600"
                        : " text-gray-500")
                    }
                    title={f.name}
                  >
                    {f.name}
                    {f.status === "processing" && drivePct != null && (
                      <span className="ml-2 text-gray-500">
                        (Drive {drivePct}%)
                      </span>
                    )}
                  </span>

                  <div className="flex-shrink-0 flex items-center gap-1">
                    <CircularProgress
                      percent={f.progress || 0}
                      size={18}
                      stroke={3}
                    />
                    {f.status === "success" ? (
                      <FiCheck className="text-green-500" size={14} />
                    ) : f.status === "error" ? (
                      <FiX className="text-red-500" size={14} />
                    ) : f.status === "uploading" ? (
                      <FiUpload
                        className="text-blue-500 animate-pulse"
                        size={14}
                      />
                    ) : f.status === "processing" ? (
                      <FiClock className="text-yellow-500" size={14} />
                    ) : (
                      <FiClock className="text-gray-400" size={14} />
                    )}

                    {(f.status === "uploading" ||
                      f.status === "processing") && (
                      <button
                        onClick={() => cancelUpload(idx)}
                        className="text-red-500 hover:text-red-700"
                        title="Cancel upload"
                      >
                        <FiX size={12} />
                      </button>
                    )}
                    {f.status === "error" && (
                      <button
                        onClick={() =>
                          uploadFileWithChunks(fileStates[idx], idx)
                        }
                        className="text-blue-500 hover:text-blue-700"
                        title="Retry upload"
                      >
                        <FiUpload size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {f.status === "error" && f.error && (
                  <div className="text-xs text-red-500 ml-6">{f.error}</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ===========================
   Circular progress
=========================== */
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
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#22c55e"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.3s" }}
      />
    </svg>
  );
}

/* ===========================
   Component chính
=========================== */
const UploadMiniStatus = ({
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
      ) : batchType === "delete" ? (
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

export default UploadMiniStatus;
