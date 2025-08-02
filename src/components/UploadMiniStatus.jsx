import React, { useEffect, useState, useRef } from "react";
import Loader from "@/components/ui/Loader";
import {
  FiCheck,
  FiX,
  FiUpload,
  FiClock,
  FiPause,
  FiPlay,
} from "react-icons/fi";
import axiosClient from "@/lib/axiosClient";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

// Hàm tính toán chunk size thông minh dựa trên file size
// Đảm bảo file nào cũng có ít nhất 2 chunks
const calculateOptimalChunkSize = (fileSize) => {
  // File rất nhỏ (< 1MB): chia thành 2 chunks bằng nhau
  if (fileSize < 1 * 1024 * 1024) {
    return Math.max(1, Math.floor(fileSize / 2)); // Chia đôi file, tối thiểu 1 byte
  }
  // File nhỏ (1MB - 10MB): chunk 2MB
  else if (fileSize < 10 * 1024 * 1024) {
    return 2 * 1024 * 1024; // 2MB
  }
  // File trung bình (10MB - 100MB): chunk 10MB
  else if (fileSize < 100 * 1024 * 1024) {
    return 10 * 1024 * 1024; // 10MB
  }
  // File lớn (100MB - 1GB): chunk 25MB
  else if (fileSize < 1024 * 1024 * 1024) {
    return 25 * 1024 * 1024; // 25MB
  }
  // File rất lớn (1GB - 10GB): chunk 50MB
  else if (fileSize < 10 * 1024 * 1024 * 1024) {
    return 50 * 1024 * 1024; // 50MB
  }
  // File cực lớn (10GB - 50GB): chunk 100MB
  else if (fileSize < 50 * 1024 * 1024 * 1024) {
    return 100 * 1024 * 1024; // 100MB
  }
  // File siêu lớn (> 50GB): chunk 200MB
  else {
    return 200 * 1024 * 1024; // 200MB
  }
};

// Hàm chia file thành chunk với size thông minh
// Đảm bảo file nào cũng có ít nhất 2 chunks
const createFileChunks = (file) => {
  const optimalChunkSize = calculateOptimalChunkSize(file.size);
  const chunks = [];
  let start = 0;

  while (start < file.size) {
    const end = Math.min(start + optimalChunkSize, file.size);
    chunks.push({
      start,
      end,
      size: end - start,
    });
    start = end;
  }

  // Đảm bảo file có ít nhất 2 chunks
  if (chunks.length === 1) {
    const halfSize = Math.floor(file.size / 2);
    chunks[0] = {
      start: 0,
      end: halfSize,
      size: halfSize,
    };
    chunks.push({
      start: halfSize,
      end: file.size,
      size: file.size - halfSize,
    });
  }

  console.log(
    `[FE] 📊 File ${file.name} (${(file.size / 1024 / 1024).toFixed(
      2
    )}MB) được chia thành ${chunks.length} chunks, mỗi chunk ${(
      optimalChunkSize /
      1024 /
      1024
    ).toFixed(2)}MB`
  );

  return chunks;
};

// Hàm đọc chunk từ file
const readFileChunk = (file, start, end) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file.slice(start, end));
  });
};

// MiniStatus cho 1 batch (files hoặc folders hoặc create_folder)
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
      status: "pending",
      progress: 0,
      chunks: [],
      uploadedChunks: [],
      uploadId: null,
      error: null,
    }))
  );
  const [progress, setProgress] = useState(0);

  // Tính progress tổng thể dựa trên status của các file
  const calculateOverallProgress = (currentFileStates) => {
    if (!currentFileStates.length) return 0;

    let totalProgress = 0;
    let totalFiles = currentFileStates.length;
    const progressPerFile = 100 / totalFiles; // 33.33% cho mỗi file

    currentFileStates.forEach((f) => {
      if (f.status === "success") {
        totalProgress += progressPerFile; // File hoàn thành = 33.33%
      } else if (f.status === "uploading" && f.chunks && f.chunks.length > 0) {
        // File đang upload, tính theo chunks đã upload
        const fileProgress = (f.uploadedChunks?.length || 0) / f.chunks.length;
        totalProgress += fileProgress * progressPerFile; // Thêm phần trăm hoàn thành
      } else if (f.status === "error" || f.status === "cancelled") {
        // File lỗi hoặc bị hủy = 0%
        totalProgress += 0;
      } else {
        // File chưa bắt đầu = 0%
        totalProgress += 0;
      }
    });

    return Math.round(totalProgress);
  };
  const [isVisible, setIsVisible] = useState(true);
  const [status, setStatus] = useState("pending"); // for create_folder
  const [result, setResult] = useState(null); // for create_folder
  const hasUploaded = useRef(false);
  const uploadAbortController = useRef(null);
  const cancelledRef = useRef({});
  const abortControllersRef = useRef({}); // Thêm ref để lưu AbortController cho từng file
  const isUploadingRef = useRef(false); // Thêm flag để ngăn chặn upload nhiều lần
  const hasCompletedRef = useRef(false); // Thêm flag để tránh gọi onComplete nhiều lần
  console.log("nè nè " + fileStates.file);
  // Hàm upload file bằng chunked upload
  const uploadFileWithChunks = async (fileState, fileIndex) => {
    const file = fileState.file;
    const chunks = createFileChunks(file);

    // Tạo AbortController cho file này
    abortControllersRef.current[fileIndex] = new AbortController();

    setFileStates((prev) =>
      prev.map((f, idx) =>
        idx === fileIndex ? { ...f, chunks, status: "uploading" } : f
      )
    );

    let uploadId = fileState.uploadId;
    let uploadedChunks = fileState.uploadedChunks;

    // Nếu chưa có uploadId, tạo session mới bằng chunk đầu tiên
    if (!uploadId) {
      try {
        const firstChunk = await readFileChunk(
          file,
          chunks[0].start,
          chunks[0].end
        );
        // Gửi chunk đầu tiên dạng binary, metadata qua headers
        uploadId = `${batchId}-${fileIndex}-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
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
        if (
          isFolder &&
          fileIndex === 0 &&
          emptyFolders &&
          emptyFolders.length > 0
        ) {
          firstHeaders["X-Empty-Folders"] = encodeURIComponent(
            JSON.stringify(emptyFolders)
          );
          // Thêm log:
          console.log("[FE] Gửi emptyFolders:", emptyFolders);
        }
        // Thêm log gửi file chunk đầu tiên
        console.log("[FE] 🚀 Bắt đầu upload file:", {
          fileName: file.name,
          fileSize: file.size,
          relativePath: fileState.relativePath,
          parentId,
          totalChunks: chunks.length,
          chunkSize: chunks[0].size,
          timestamp: new Date().toISOString(),
        });
        // Nếu đã bị hủy thì không upload nữa
        if (cancelledRef.current[fileIndex]) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        const response = await axiosClient.post("/api/upload", firstChunk, {
          headers: firstHeaders,
          signal: abortControllersRef.current[fileIndex]?.signal, // Thêm signal để có thể abort
        });
        const data = response.data;
        if (response.status !== 200 || !data.success) {
          toast.error(data.error || "Lỗi upload");
          throw new Error(data.error || "Lỗi upload");
        }

        // Thêm log nhận response chunk đầu tiên
        console.log("[FE] ✅ Nhận response chunk đầu tiên:", {
          fileName: file.name,
          chunkIndex: 0,
          success: data.success,
          uploadedChunks: data.uploadedChunks,
          uploadId: data.uploadId,
          timestamp: new Date().toISOString(),
        });

        uploadedChunks = data.uploadedChunks || [0];
        setFileStates((prev) => {
          const next = prev.map((f, idx) =>
            idx === fileIndex ? { ...f, uploadId, uploadedChunks } : f
          );
          setProgress(calculateOverallProgress(next));
          return next;
        });
      } catch (error) {
        // Kiểm tra nếu lỗi do abort
        if (error.name === "AbortError" || error.message.includes("aborted")) {
          console.log(`[FE] Upload aborted for file ${fileIndex}`);
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        // Lấy message từ axios error object
        const errorMsg =
          error?.response?.data?.error ||
          error?.message ||
          "Lỗi không xác định";
        toast.error(errorMsg);
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "error", error: errorMsg } : f
          )
        );
        return;
      }
    }

    // Upload các chunk còn lại
    for (let i = 1; i < chunks.length; i++) {
      if (uploadedChunks.includes(i)) continue;
      if (
        cancelledRef.current[fileIndex] ||
        fileStates[fileIndex]?.status === "cancelled"
      ) {
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, status: "cancelled" } : f
          )
        );
        return;
      }
      try {
        const chunk = chunks[i];
        const chunkData = await readFileChunk(file, chunk.start, chunk.end);

        // Kiểm tra flag cancelled ngay sau await
        if (
          cancelledRef.current[fileIndex] ||
          fileStates[fileIndex]?.status === "cancelled"
        ) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }

        // Thêm log:
        console.log("[FE] 📤 Gửi chunk:", {
          fileName: file.name,
          chunkIndex: i,
          chunkSize: chunk.size,
          relativePath: fileState.relativePath,
          parentId,
          uploadId,
          timestamp: new Date().toISOString(),
        });
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
          "X-Chunk-Start": chunk.start,
          "X-Chunk-End": chunk.end,
        };
        // Nếu đã bị hủy thì không upload nữa
        if (cancelledRef.current[fileIndex]) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        const response = await axiosClient.post("/api/upload", chunkData, {
          headers,
          signal: abortControllersRef.current[fileIndex]?.signal, // Thêm signal để có thể abort
        });

        // Kiểm tra flag cancelled ngay sau await
        if (
          cancelledRef.current[fileIndex] ||
          fileStates[fileIndex]?.status === "cancelled"
        ) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }

        const data = response.data;
        if (response.status !== 200 || !data.success) {
          throw new Error(data.error || `Upload chunk ${i} thất bại`);
        }

        // Thêm log nhận response từ BE
        console.log("[FE] ✅ Nhận response chunk:", {
          fileName: file.name,
          chunkIndex: i,
          success: data.success,
          uploadedChunks: data.uploadedChunks,
          fileId: data.fileId,
          timestamp: new Date().toISOString(),
        });

        uploadedChunks = data.uploadedChunks || [...uploadedChunks, i];
        const chunkProgress = Math.round(
          (uploadedChunks.length / chunks.length) * 100
        );
        const isCompleted =
          i === chunks.length - 1 && data.tempFileStatus === "completed";
        setFileStates((prev) => {
          const next = prev.map((f, idx) =>
            idx === fileIndex
              ? {
                  ...f,
                  uploadedChunks,
                  progress: chunkProgress,
                  status: isCompleted ? "success" : "uploading",
                }
              : f
          );
          setProgress(calculateOverallProgress(next));
          return next;
        });
        if (isCompleted) {
          console.log(
            `[FE] 🎉 File ${file.name} uploaded successfully with ID: ${data.fileId}`
          );
        }
      } catch (error) {
        // Kiểm tra nếu lỗi do abort
        if (error.name === "AbortError" || error.message.includes("aborted")) {
          console.log(`[FE] Upload aborted for file ${fileIndex}, chunk ${i}`);
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        // Kiểm tra lỗi 499 Client Closed Request hoặc lỗi hủy
        const statusCode = error?.response?.status;
        const msg =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message;

        // Nếu là lỗi 499 hoặc lỗi liên quan đến hủy/session
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

        // Nếu là lỗi khác, mới set error
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

  // Hàm cancel upload
  const cancelUpload = async (fileIndex) => {
    cancelledRef.current[fileIndex] = true; // Đánh dấu đã hủy

    // Abort request HTTP đang gửi ngay lập tức
    if (abortControllersRef.current[fileIndex]) {
      console.log(`[FE] Aborting upload for file ${fileIndex}`);
      abortControllersRef.current[fileIndex].abort();
    }

    const fileState = fileStates[fileIndex];
    if (fileState.uploadId) {
      try {
        const response = await axiosClient.post("/api/upload/cancel", {
          uploadId: fileState.uploadId,
        });
        // Kiểm tra trường success và message
        const data = response.data;
        if (data?.success || (data?.message && data.message.includes("hủy"))) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        // Nếu không phải success, vẫn set cancelled nếu message đúng
        if (response.status === 200) {
          setFileStates((prev) =>
            prev.map((f, idx) =>
              idx === fileIndex ? { ...f, status: "cancelled" } : f
            )
          );
          return;
        }
        // Nếu thực sự lỗi, mới set error
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
      } catch (error) {
        // Nếu lỗi nhưng message có chữ "hủy thành công" thì vẫn set cancelled
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message;
        if (msg && msg.includes("hủy")) {
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
      // Nếu chưa có uploadId, chỉ cần set cancelled
      setFileStates((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex ? { ...f, status: "cancelled" } : f
        )
      );
    }
  };

  useEffect(() => {
    if (hasUploaded.current || isUploadingRef.current) return;
    hasUploaded.current = true;
    isUploadingRef.current = true;
    hasCompletedRef.current = false; // Reset flag khi bắt đầu upload mới

    // Error boundary cho toàn bộ upload process
    const handleError = (error) => {
      console.error("Upload error:", error);
      isUploadingRef.current = false; // Reset flag khi có lỗi
      setFileStates((prev) =>
        prev.map((f) => ({ ...f, status: "error", error: error.message }))
      );
      setProgress(100);
    };

    // DELETE FLOW
    if (batchType === "delete") {
      const deleteItemsToSend = Array.isArray(moveItems) ? moveItems : [];
      const deleteAsync = async () => {
        setStatus("pending");
        setProgress(30);
        try {
          const res = await axiosClient.post("/api/upload/delete", {
            items: deleteItemsToSend,
          });
          const json = res.data;
          if (res.status === 200 && json.success) {
            setStatus("success");
            setProgress(100);
            setTimeout(() => {
              setIsVisible(false);
              if (onComplete) onComplete(json);
            }, 1500);
          } else {
            setStatus("error");
            setProgress(100);
            setTimeout(() => {
              setIsVisible(false);
              if (onComplete) onComplete(json);
            }, 2000);
          }
        } catch (err) {
          setStatus("error");
          setProgress(100);
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete({ error: err.message });
          }, 2000);
        }
      };
      deleteAsync();
      return;
    }

    // MOVE FLOW
    if (batchType === "move") {
      const moveItemsToSend = Array.isArray(moveItems) ? moveItems : [];
      const moveItemsAsync = async () => {
        setStatus("pending");
        setProgress(30);
        try {
          const res = await axiosClient.post("/api/upload/move", {
            items: moveItemsToSend,
            targetFolderId: moveTargetFolderId,
          });
          const json = res.data;
          if (res.status === 200 && json.success) {
            setStatus("success");
            setProgress(100);
            setTimeout(() => {
              setIsVisible(false);
              if (onComplete) onComplete(json);
            }, 1500);
          } else {
            setStatus("error");
            setProgress(100);
            setTimeout(() => {
              setIsVisible(false);
              if (onComplete) onComplete(json);
            }, 2000);
          }
        } catch (err) {
          setStatus("error");
          setProgress(100);
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete({ error: err.message });
          }, 2000);
        }
      };
      moveItemsAsync();
      return;
    }

    // CREATE FOLDER FLOW
    if (batchType === "create_folder") {
      const createFolder = async () => {
        setStatus("pending");
        setProgress(30);
        try {
          const res = await axiosClient.post("/api/upload/create_folder", {
            name: folderName,
            parentId,
          });
          const json = res.data;
          if (res.status === 200 && json.success && json.folder) {
            setStatus("success");
            setResult(json);
            setProgress(100);
            setTimeout(() => {
              setIsVisible(false);
              if (onComplete) onComplete(json);
            }, 1500);
          } else {
            setStatus("error");
            setResult(json);
            setProgress(100);
            setTimeout(() => {
              setIsVisible(false);
              if (onComplete) onComplete(json);
            }, 2000);
          }
        } catch (err) {
          setStatus("error");
          setResult({ error: err.message });
          setProgress(100);
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete({ error: err.message });
          }, 2000);
        }
      };
      createFolder();
      return;
    }

    // UPLOAD FLOW - Sử dụng chunked upload hoặc normal upload
    const uploadBatchFiles = async () => {
      for (let i = 0; i < fileStates.length; i++) {
        try {
          const file = fileStates[i].file;
          if (!file || file.size === 0) {
            console.error(`File ${i} is invalid or empty`);
            setFileStates((prev) =>
              prev.map((f, idx) =>
                idx === i
                  ? {
                      ...f,
                      status: "error",
                      error: "File không hợp lệ hoặc rỗng",
                    }
                  : f
              )
            );
            continue;
          }

          console.log(`[FE] 🚀 Bắt đầu upload file ${i}:`, {
            fileName: file.name,
            fileSize: file.size,
            batchId,
            timestamp: new Date().toISOString(),
          });

          await uploadFileWithChunks(fileStates[i], i);

          console.log(`[FE] ✅ Hoàn thành upload file ${i}:`, {
            fileName: file.name,
            status: fileStates[i]?.status,
            timestamp: new Date().toISOString(),
          });

          // Chờ 0.5 giây trước khi upload file tiếp theo để tăng tốc độ
          if (i < fileStates.length - 1) {
            console.log(`[FE] ⏳ Chờ 0.5s trước khi upload file tiếp theo...`);
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`[FE] ❌ Lỗi upload file ${i}:`, {
            fileName: fileStates[i]?.file?.name,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          // Tiếp tục với file tiếp theo nếu có lỗi
        }

        // Cập nhật progress tổng thể
        setProgress(calculateOverallProgress(fileStates));
      }

      // Logic ẩn UI đã được chuyển sang useEffect để theo dõi thay đổi của fileStates
      console.log("[FE] 📊 Upload batch files hoàn thành, chờ useEffect xử lý");
    };

    const uploadBatchFolder = async () => {
      setFileStates((prev) => prev.map((f) => ({ ...f, status: "uploading" })));

      // Upload folder bằng chunked upload
      for (let i = 0; i < fileStates.length; i++) {
        try {
          const file = fileStates[i].file;
          if (!file || file.size === 0) {
            console.error(`File ${i} is invalid or empty`);
            setFileStates((prev) =>
              prev.map((f, idx) =>
                idx === i
                  ? {
                      ...f,
                      status: "error",
                      error: "File không hợp lệ hoặc rỗng",
                    }
                  : f
              )
            );
            continue;
          }

          console.log(`[FE] 🚀 Bắt đầu upload file ${i} trong folder:`, {
            fileName: file.name,
            fileSize: file.size,
            batchId,
            timestamp: new Date().toISOString(),
          });

          await uploadFileWithChunks(fileStates[i], i);

          console.log(`[FE] ✅ Hoàn thành upload file ${i} trong folder:`, {
            fileName: file.name,
            status: fileStates[i]?.status,
            timestamp: new Date().toISOString(),
          });

          // Chờ 0.5 giây trước khi upload file tiếp theo để tăng tốc độ
          if (i < fileStates.length - 1) {
            console.log(
              `[FE] ⏳ Chờ 0.5s trước khi upload file tiếp theo trong folder...`
            );
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`[FE] ❌ Lỗi upload file ${i} trong folder:`, {
            fileName: fileStates[i]?.file?.name,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          // Tiếp tục với file tiếp theo nếu có lỗi
        }
      }

      // Kiểm tra xem có file nào thành công không
      const successfulFiles = fileStates.filter(
        (f) => f.status === "success" // Chỉ tính file có status = "success"
      ).length;
      const hasErrors = fileStates.some((f) => f.status === "error");

      setProgress(calculateOverallProgress(fileStates));

      // Logic ẩn UI đã được chuyển sang useEffect để theo dõi thay đổi của fileStates
      console.log(
        "[FE] 📊 Upload batch folder hoàn thành, chờ useEffect xử lý"
      );
    };

    if (isFolder) {
      uploadBatchFolder();
    } else {
      uploadBatchFiles();
    }
    // eslint-disable-next-line
  }, [batchId]);

  // Thêm event listener để cảnh báo khi user rời khỏi trang
  // XÓA toàn bộ useEffect thêm event listener beforeunload và visibilitychange

  // Thêm useEffect để theo dõi thay đổi của fileStates và ẩn UI khi hoàn thành
  useEffect(() => {
    // Chỉ kiểm tra khi có files và không phải các batchType đặc biệt
    if (
      files.length === 0 ||
      batchType === "delete" ||
      batchType === "move" ||
      batchType === "create_folder"
    ) {
      return;
    }

    // Kiểm tra xem tất cả files đã hoàn thành chưa
    const allFilesCompleted = fileStates.every(
      (f) =>
        f.status === "success" ||
        f.status === "error" ||
        f.status === "cancelled"
    );

    if (
      allFilesCompleted &&
      fileStates.length > 0 &&
      !hasCompletedRef.current
    ) {
      console.log("[FE] 🎉 Tất cả files đã hoàn thành, ẩn UI sau 2s");

      // Đánh dấu đã hoàn thành để tránh gọi onComplete nhiều lần
      hasCompletedRef.current = true;

      // Tính số file thành công
      const successfulFiles = fileStates.filter(
        (f) => f.status === "success"
      ).length;
      const hasErrors = fileStates.some((f) => f.status === "error");

      setTimeout(() => {
        isUploadingRef.current = false; // Reset flag khi hoàn thành
        setIsVisible(false);
        if (onComplete) {
          onComplete({
            success: successfulFiles > 0,
            totalFiles: fileStates.length,
            successfulFiles,
            hasErrors,
          });
        }
      }, 2000);
    }
  }, [fileStates, files.length, batchType, onComplete]);

  if (!isVisible) return null;

  // Render for move
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
          {moveItems &&
            moveItems.length > 0 &&
            moveItems.map((item, idx) => (
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

  // Render for create_folder
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

  // Render for delete
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
          {moveItems &&
            moveItems.length > 0 &&
            moveItems.map((item, idx) => (
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
      {/* Progress Bar */}
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
          fileStates.map((file, idx) => (
            <div key={idx} className="flex flex-col gap-0.5 w-full">
              <div className="flex w-full items-center gap-2 text-xs">
                <img
                  src={file.icon}
                  alt="icon"
                  className="w-4 h-4 object-contain flex-shrink-0"
                />
                <span
                  className={
                    "flex-1 truncate overflow-hidden min-w-0 file-name-fixed-width" +
                    (file.status === "success"
                      ? " text-green-600"
                      : file.status === "error"
                      ? " text-red-600"
                      : file.status === "uploading"
                      ? " text-blue-600"
                      : " text-gray-500")
                  }
                  title={file.name}
                >
                  {file.name}
                </span>
                <div className="flex-shrink-0 flex items-center gap-1">
                  {file.chunks && file.chunks.length > 0 && (
                    <CircularProgress
                      percent={
                        file.chunks.length > 0
                          ? Math.round(
                              ((file.uploadedChunks?.length || 0) /
                                file.chunks.length) *
                                100
                            )
                          : 0
                      }
                      size={18}
                      stroke={3}
                    />
                  )}
                  {file.status === "success" ? (
                    <FiCheck className="text-green-500" size={14} />
                  ) : file.status === "error" ? (
                    <FiX className="text-red-500" size={14} />
                  ) : file.status === "uploading" ? (
                    <FiUpload
                      className="text-blue-500 animate-pulse"
                      size={14}
                    />
                  ) : (
                    <FiClock className="text-gray-400" size={14} />
                  )}

                  {/* Action buttons for paused/error files */}
                  {file.status === "error" && (
                    <button
                      onClick={() => uploadFileWithChunks(fileStates[idx], idx)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Retry upload"
                    >
                      <FiUpload size={12} />
                    </button>
                  )}
                  {(file.status === "uploading" ||
                    file.status === "paused") && (
                    <button
                      onClick={() => cancelUpload(idx)}
                      className="text-red-500 hover:text-red-700"
                      title="Cancel upload"
                    >
                      <FiX size={12} />
                    </button>
                  )}
                </div>
              </div>
              {file.status === "error" && file.error && (
                <div className="text-xs text-red-500 ml-6">{file.error}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Circular progress component
function CircularProgress({ percent = 0, size = 24, stroke = 3 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg
      width={size}
      height={size}
      className="inline-block align-middle"
      style={{ verticalAlign: "middle" }}
    >
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

// Component chính
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
