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

// Hàm chia file thành chunk
const createFileChunks = (file, chunkSize = 32 * 1024 * 1024) => {
  // 32MB default
  const chunks = [];
  let start = 0;
  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push({
      start,
      end,
      size: end - start,
    });
    start = end;
  }
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

// Hàm convert ArrayBuffer sang base64
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
      isPaused: false,
      error: null,
    }))
  );
  const [progress, setProgress] = useState(0);

  // Tính progress tổng thể dựa trên status của các file
  const calculateOverallProgress = () => {
    if (fileStates.length === 0) return 0;

    const completedFiles = fileStates.filter(
      (f) => f.status === "success"
    ).length;
    const totalFiles = fileStates.length;

    return Math.round((completedFiles / totalFiles) * 100);
  };
  const [isVisible, setIsVisible] = useState(true);
  const [status, setStatus] = useState("pending"); // for create_folder
  const [result, setResult] = useState(null); // for create_folder
  const hasUploaded = useRef(false);
  const uploadAbortController = useRef(null);

  // Hàm upload file bằng chunked upload
  const uploadFileWithChunks = async (fileState, fileIndex) => {
    const file = fileState.file;
    const chunks = createFileChunks(file);

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
        uploadId = `${batchId}-${fileIndex}-${Date.now()}`;
        const headers = {
          "Content-Type": "application/octet-stream",
          "X-Upload-Id": uploadId,
          "X-Chunk-Index": 0,
          "X-Total-Chunks": chunks.length,
          "X-File-Name": encodeURIComponent(file.name),
          "X-Mime-Type": file.type || "application/octet-stream",
          "X-Parent-Id": parentId || "",
          "X-Is-First-Chunk": "1",
          "X-Is-Last-Chunk": chunks.length === 1 ? "1" : "0",
          "X-File-Size": file.size,
          "X-Relative-Path": fileState.relativePath || "",
        };
        if (
          isFolder &&
          fileIndex === 0 &&
          emptyFolders &&
          emptyFolders.length > 0
        ) {
          headers["X-Empty-Folders"] = encodeURIComponent(
            JSON.stringify(emptyFolders)
          );
        }
        const response = await axiosClient.post("/api/upload", firstChunk, {
          headers,
        });
        const data = response.data;
        if (response.status !== 200 || !data.success) {
          throw new Error(data.error || "Tạo session upload thất bại");
        }
        uploadedChunks = data.uploadedChunks || [0];
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, uploadId, uploadedChunks } : f
          )
        );
      } catch (error) {
        console.error("Error creating upload session:", error);
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? { ...f, status: "error", error: error.message }
              : f
          )
        );
        return;
      }
    }

    // Upload các chunk còn lại
    for (let i = 1; i < chunks.length; i++) {
      if (uploadedChunks.includes(i)) continue;
      const currentFileState = fileStates[fileIndex];
      if (currentFileState?.isPaused) return;
      try {
        const chunk = chunks[i];
        const chunkData = await readFileChunk(file, chunk.start, chunk.end);
        const headers = {
          "Content-Type": "application/octet-stream",
          "X-Upload-Id": uploadId,
          "X-Chunk-Index": i,
          "X-Total-Chunks": chunks.length,
          "X-File-Name": encodeURIComponent(file.name),
          "X-Mime-Type": file.type || "application/octet-stream",
          "X-Parent-Id": parentId || "",
          "X-Is-First-Chunk": "0",
          "X-Is-Last-Chunk": i === chunks.length - 1 ? "1" : "0",
          "X-File-Size": file.size,
          "X-Relative-Path": fileState.relativePath || "",
        };
        const response = await axiosClient.post("/api/upload", chunkData, {
          headers,
        });
        const data = response.data;
        if (response.status !== 200 || !data.success) {
          throw new Error(data.error || `Upload chunk ${i} thất bại`);
        }
        uploadedChunks = data.uploadedChunks || [...uploadedChunks, i];
        const chunkProgress = Math.round(
          (uploadedChunks.length / chunks.length) * 100
        );
        const isCompleted = i === chunks.length - 1 && data.fileId;
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? {
                  ...f,
                  uploadedChunks,
                  progress: chunkProgress,
                  status: isCompleted ? "success" : "uploading",
                }
              : f
          )
        );
        if (isCompleted) {
          console.log(
            `File ${file.name} uploaded successfully with ID: ${data.fileId}`
          );
        }
      } catch (error) {
        console.error(`Error uploading chunk ${i}:`, error);
        setFileStates((prev) =>
          prev.map((f, idx) =>
            idx === fileIndex
              ? { ...f, status: "error", error: error.message }
              : f
          )
        );
        return;
      }
    }
  };

  // Hàm resume upload hoặc retry
  const resumeUpload = async (fileIndex) => {
    const fileState = fileStates[fileIndex];

    // Nếu file bị lỗi và không có uploadId, thử upload lại từ đầu
    if (fileState.status === "error" && !fileState.uploadId) {
      setFileStates((prev) =>
        prev.map((f, idx) =>
          idx === fileIndex ? { ...f, status: "uploading", error: null } : f
        )
      );

      setTimeout(() => {
        uploadFileWithChunks(fileState, fileIndex);
      }, 100);
      return;
    }

    // Nếu có uploadId, resume upload
    if (!fileState.uploadId) return;

    setFileStates((prev) =>
      prev.map((f, idx) =>
        idx === fileIndex ? { ...f, isPaused: false, status: "uploading" } : f
      )
    );

    // Gọi lại upload function với state hiện tại
    setTimeout(() => {
      uploadFileWithChunks(fileState, fileIndex);
    }, 100); // Delay nhỏ để đảm bảo state đã được cập nhật
  };

  // Hàm pause upload
  const pauseUpload = (fileIndex) => {
    setFileStates((prev) =>
      prev.map((f, idx) =>
        idx === fileIndex ? { ...f, isPaused: true, status: "paused" } : f
      )
    );
  };

  // Hàm cancel upload
  const cancelUpload = async (fileIndex) => {
    const fileState = fileStates[fileIndex];
    if (fileState.uploadId) {
      try {
        const response = await axiosClient.post("/api/upload/cancel", {
          uploadId: fileState.uploadId,
        });
        if (response.status !== 200) {
          const data = response.data;
          console.error("Error canceling upload:", data.error);
        }
      } catch (error) {
        console.error("Error canceling upload:", error);
      }
    }

    setFileStates((prev) =>
      prev.map((f, idx) =>
        idx === fileIndex ? { ...f, status: "cancelled" } : f
      )
    );
  };

  useEffect(() => {
    if (hasUploaded.current) return;
    hasUploaded.current = true;

    // Error boundary cho toàn bộ upload process
    const handleError = (error) => {
      console.error("Upload error:", error);
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
          await uploadFileWithChunks(fileStates[i], i);
        } catch (error) {
          console.error(`Error uploading file ${i}:`, error);
          // Tiếp tục với file tiếp theo nếu có lỗi
        }

        // Cập nhật progress tổng thể
        setProgress(calculateOverallProgress());
      }

      // Kiểm tra xem có file nào thành công không
      const successfulFiles = fileStates.filter(
        (f) => f.status === "success"
      ).length;
      const hasErrors = fileStates.some((f) => f.status === "error");

      setTimeout(() => {
        setIsVisible(false);
        if (onComplete)
          onComplete({
            success: successfulFiles > 0,
            totalFiles: fileStates.length,
            successfulFiles,
            hasErrors,
          });
      }, 2000);
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
          await uploadFileWithChunks(fileStates[i], i);
        } catch (error) {
          console.error(`Error uploading file ${i}:`, error);
          // Tiếp tục với file tiếp theo nếu có lỗi
        }
      }

      // Kiểm tra xem có file nào thành công không
      const successfulFiles = fileStates.filter(
        (f) => f.status === "success"
      ).length;
      const hasErrors = fileStates.some((f) => f.status === "error");

      setProgress(calculateOverallProgress());
      setTimeout(() => {
        setIsVisible(false);
        if (onComplete)
          onComplete({
            success: successfulFiles > 0,
            totalFiles: fileStates.length,
            successfulFiles,
            hasErrors,
          });
      }, 2000);
    };

    if (isFolder) {
      uploadBatchFolder();
    } else {
      uploadBatchFiles();
    }
    // eslint-disable-next-line
  }, [batchId]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      // Cleanup upload sessions nếu component bị unmount
      fileStates.forEach((fileState) => {
        if (fileState.uploadId && fileState.status === "uploading") {
          // Có thể gọi API để cancel session nếu cần
          console.log(`Cleaning up upload session: ${fileState.uploadId}`);
        }
      });
    };
  }, [fileStates]);

  if (!isVisible) return null;

  // Render for move
  if (batchType === "move") {
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
              ? `Đang di chuyển...`
              : status === "success"
              ? "Di chuyển thành công!"
              : "Di chuyển thất bại"}
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
              <div key={idx} className="flex items-center gap-2 text-xs">
                <img
                  src={
                    item.type === "folder"
                      ? "/images/icon/folder.png"
                      : "/images/icon/png.png"
                  }
                  alt="icon"
                  className="w-4 h-4 object-contain flex-shrink-0"
                />
                <span className="truncate flex-1 text-blue-700 font-semibold">
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
              ? `Đang tạo thư mục...`
              : status === "success"
              ? "Tạo thư mục thành công!"
              : "Tạo thư mục thất bại"}
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
            {result?.error || "Có lỗi xảy ra khi tạo thư mục."}
          </div>
        )}
      </div>
    );
  }

  // Render for delete
  if (batchType === "delete") {
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
              ? `Đang xóa...`
              : status === "success"
              ? "Xóa thành công!"
              : "Xóa thất bại"}
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
              <div key={idx} className="flex items-center gap-2 text-xs">
                <img
                  src={
                    item.type === "folder"
                      ? "/images/icon/folder.png"
                      : "/images/icon/png.png"
                  }
                  alt="icon"
                  className="w-4 h-4 object-contain flex-shrink-0"
                />
                <span className="truncate flex-1 text-red-700 font-semibold">
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
      className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg p-4 flex flex-col gap-3 min-w-[280px] max-w-sm border border-gray-200 z-[9999]"
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
            ? `Đang tải lên... ${progress}%`
            : fileStates.some((f) => f.status === "error")
            ? "Có file lỗi"
            : "Đã tải lên thành công!"}
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
            <div key={idx} className="flex items-center gap-2 text-xs">
              <img
                src={file.icon}
                alt="icon"
                className="w-4 h-4 object-contain flex-shrink-0"
              />
              <span
                className={`truncate flex-1 ${
                  file.status === "success"
                    ? "text-green-600"
                    : file.status === "error"
                    ? "text-red-600"
                    : file.status === "uploading"
                    ? "text-blue-600"
                    : file.status === "paused"
                    ? "text-yellow-600"
                    : "text-gray-500"
                }`}
              >
                {file.name}
                {file.chunks && file.chunks.length > 0 && (
                  <span className="text-xs text-gray-400 ml-1">
                    ({file.uploadedChunks?.length || 0}/{file.chunks.length}{" "}
                    chunks)
                  </span>
                )}
              </span>
              <div className="flex-shrink-0 flex items-center gap-1">
                {file.status === "success" ? (
                  <FiCheck className="text-green-500" size={14} />
                ) : file.status === "error" ? (
                  <FiX className="text-red-500" size={14} />
                ) : file.status === "uploading" ? (
                  <FiUpload className="text-blue-500 animate-pulse" size={14} />
                ) : file.status === "paused" ? (
                  <FiPause className="text-yellow-500" size={14} />
                ) : (
                  <FiClock className="text-gray-400" size={14} />
                )}

                {/* Action buttons for paused/error files */}
                {file.status === "paused" && (
                  <button
                    onClick={() => resumeUpload(idx)}
                    className="text-blue-500 hover:text-blue-700"
                    title="Resume upload"
                  >
                    <FiPlay size={12} />
                  </button>
                )}
                {file.status === "error" && (
                  <button
                    onClick={() => resumeUpload(idx)}
                    className="text-blue-500 hover:text-blue-700"
                    title="Retry upload"
                  >
                    <FiUpload size={12} />
                  </button>
                )}
                {file.status === "uploading" && (
                  <button
                    onClick={() => pauseUpload(idx)}
                    className="text-yellow-500 hover:text-yellow-700"
                    title="Pause upload"
                  >
                    <FiPause size={12} />
                  </button>
                )}
                {(file.status === "uploading" || file.status === "paused") && (
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
          ))
        )}
      </div>
      {fileStates.length > 0 && (
        <div className="text-xs text-gray-500 border-t pt-2">
          {fileStates.filter((f) => f.status === "success").length} /{" "}
          {fileStates.length} hoàn thành
        </div>
      )}
    </div>
  );
};

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
