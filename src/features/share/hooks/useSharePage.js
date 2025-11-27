"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import shareService from "../services/shareService";

function formatSize(size) {
  if (!size) return "-";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + " MB";
  return (size / 1024 / 1024 / 1024).toFixed(1) + " GB";
}

export default function useSharePage() {
  const { id } = useParams();
  const router = useRouter();

  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadBatch, setDownloadBatch] = useState(null);
  const downloadBatchIdRef = useRef(0);

  const fetchShareInfo = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await shareService.getShareInfo(id);
      const data = res.data;
      setItem(data);
      if (data.type === "folder") {
        setBreadcrumb((prev) => {
          const idx = prev.findIndex((b) => b.id === data.id);
          if (idx !== -1) return prev.slice(0, idx + 1);
          return [...prev, { id: data.id, name: data.name }];
        });
      }
    } catch (err) {
      let msg = "Không tìm thấy file hoặc thư mục";
      if (err.response && err.response.data && err.response.data.error) {
        msg = err.response.data.error;
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleEnterFolder = useCallback(
    (folder) => {
      router.push(`/share/${folder.id}`);
    },
    [router]
  );

  const handleBreadcrumbClick = useCallback(
    (idx) => {
      if (idx === breadcrumb.length - 1) return;
      const target = breadcrumb[idx];
      router.push(`/share/${target.id}`);
      setBreadcrumb(breadcrumb.slice(0, idx + 1));
    },
    [breadcrumb, router]
  );

  const copyShareLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Đã copy link chia sẻ!");
    setTimeout(() => setCopied(false), 1500);
  }, []);

  // Tải xuống một file
  const downloadSingleFile = useCallback(
    async (file, relativePath = "") => {
      try {
        const res = await shareService.downloadShareFile(id, file.id);
        const blob = new Blob([res.data]);
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = relativePath || file.name;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(link.href);
          document.body.removeChild(link);
        }, 200);
        return { success: true };
      } catch (err) {
        const errorMsg =
          err?.response?.data?.error || "Lỗi tải xuống: " + err.message;
        return { success: false, error: errorMsg };
      }
    },
    [id]
  );

  // Tải xuống folder (từng file)
  const downloadFolder = useCallback(
    async (folderItem) => {
      try {
        setDownloadingId(folderItem.id);

        // Lấy danh sách file trong folder
        const res = await shareService.getShareFolderFiles(id);
        if (
          !res.data?.success ||
          !res.data?.files ||
          res.data.files.length === 0
        ) {
          toast.error("Thư mục không có file để tải");
          setDownloadingId(null);
          return;
        }

        const files = res.data.files;
        const folderName = res.data.folderName || folderItem.name;

        // Tạo batch download
        const batchId = `share-download-${Date.now()}-${++downloadBatchIdRef.current}`;
        const downloadFiles = files.map((file) => ({
          file: {
            name: file.name,
            size: file.size,
            type: file.mimeType,
          },
          name: file.name,
          id: file.id,
          relativePath: file.relativePath,
          size: file.size,
        }));

        setDownloadBatch({
          batchId,
          files: downloadFiles.map((f) => ({
            ...f,
            status: "pending",
            progress: 0,
            error: null,
          })),
          folderName,
          status: "downloading",
        });

        // Tải từng file
        let successCount = 0;
        let errorCount = 0;

        // Đảm bảo downloadBatch được set trước khi bắt đầu tải
        await new Promise((resolve) => setTimeout(resolve, 100));

        for (let i = 0; i < downloadFiles.length; i++) {
          const fileState = downloadFiles[i];

          // Cập nhật trạng thái đang tải
          setDownloadBatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              files: prev.files.map((f, idx) =>
                idx === i ? { ...f, status: "downloading", progress: 50 } : f
              ),
            };
          });

          try {
            const result = await downloadSingleFile(
              { id: fileState.id, name: fileState.name },
              fileState.relativePath
            );

            if (result.success) {
              successCount++;
              setDownloadBatch((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  files: prev.files.map((f, idx) =>
                    idx === i ? { ...f, status: "success", progress: 100 } : f
                  ),
                };
              });
            } else {
              errorCount++;
              setDownloadBatch((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  files: prev.files.map((f, idx) =>
                    idx === i
                      ? {
                          ...f,
                          status: "error",
                          error: result.error,
                          progress: 0,
                        }
                      : f
                  ),
                };
              });
            }
          } catch (err) {
            errorCount++;
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                files: prev.files.map((f, idx) =>
                  idx === i
                    ? { ...f, status: "error", error: err.message, progress: 0 }
                    : f
                ),
              };
            });
          }

          // Delay nhỏ giữa các file để tránh quá tải
          if (i < downloadFiles.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

        // Hoàn thành
        setTimeout(() => {
          setDownloadBatch(null);
          setDownloadingId(null);
          if (successCount > 0) {
            toast.success(
              `Đã tải xuống ${successCount} file${successCount > 1 ? "s" : ""}`
            );
          }
          if (errorCount > 0) {
            toast.error(
              `${errorCount} file${
                errorCount > 1 ? "s" : ""
              } tải xuống thất bại`
            );
          }
        }, 2000);
      } catch (err) {
        const errorMsg =
          err?.response?.data?.error || "Lỗi tải xuống: " + err.message;
        toast.error(errorMsg);
        setDownloadBatch(null);
        setDownloadingId(null);
      }
    },
    [id, downloadSingleFile]
  );

  const handleDownload = useCallback(
    async (targetItem) => {
      if (!targetItem.canDownload) {
        toast.error("Bạn không có quyền tải xuống nội dung này");
        return;
      }

      if (targetItem.type === "folder") {
        // Tải folder (từng file)
        await downloadFolder(targetItem);
      } else {
        // Tải file đơn - cũng hiển thị progress
        try {
          setDownloadingId(targetItem.id);

          // Tạo batch download cho file đơn
          const batchId = `share-download-${Date.now()}-${++downloadBatchIdRef.current}`;
          const downloadFiles = [
            {
              name: targetItem.name,
              id: targetItem.id,
              size: targetItem.size,
              status: "pending",
              progress: 0,
            },
          ];

          setDownloadBatch({
            batchId,
            files: downloadFiles,
            folderName: null,
            status: "downloading",
          });

          // Đảm bảo downloadBatch được set trước khi bắt đầu tải
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Cập nhật trạng thái đang tải
          setDownloadBatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              files: prev.files.map((f) => ({
                ...f,
                status: "downloading",
                progress: 50,
              })),
            };
          });

          const result = await downloadSingleFile(targetItem);

          if (result.success) {
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                files: prev.files.map((f) => ({
                  ...f,
                  status: "success",
                  progress: 100,
                })),
              };
            });

            setTimeout(() => {
              setDownloadBatch(null);
              setDownloadingId(null);
              toast.success("Tải xuống thành công!");
            }, 1500);
          } else {
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                files: prev.files.map((f) => ({
                  ...f,
                  status: "error",
                  error: result.error,
                  progress: 0,
                })),
              };
            });

            setTimeout(() => {
              setDownloadBatch(null);
              setDownloadingId(null);
              toast.error(result.error);
            }, 2000);
          }
        } catch (err) {
          setDownloadBatch(null);
          setDownloadingId(null);
          toast.error("Lỗi tải xuống: " + err.message);
        }
      }
    },
    [downloadFolder, downloadSingleFile]
  );

  const clearDownloadBatch = useCallback(() => {
    setDownloadBatch(null);
  }, []);

  return {
    id,
    item,
    error,
    loading,
    copied,
    breadcrumb,
    downloadingId,
    downloadBatch,
    formatSize,
    fetchShareInfo,
    handleEnterFolder,
    handleBreadcrumbClick,
    copyShareLink,
    handleDownload,
    clearDownloadBatch,
  };
}
