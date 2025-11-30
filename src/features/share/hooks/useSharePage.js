"use client";

import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
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
  const { id } = useParams(); // This is the share token
  
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadBatch, setDownloadBatch] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null); // Track current subfolder
  const [rootFolderId, setRootFolderId] = useState(null); // Track root shared folder
  const downloadBatchIdRef = useRef(0);

  // Fetch share info or subfolder info
  const fetchShareInfo = useCallback(async (subfolderId = null) => {
    if (!id) return;
    setLoading(true);
    try {
      let res;
      if (subfolderId) {
        // Fetch subfolder content
        res = await shareService.getShareSubfolderInfo(id, subfolderId);
      } else {
        // Fetch root share info
        res = await shareService.getShareInfo(id);
      }
      
      const data = res.data;
      setItem(data);
      setCurrentFolderId(subfolderId);
      
      if (data.type === "folder") {
        // Set root folder ID if this is the first load
        if (!subfolderId) {
          setRootFolderId(data.id);
          setBreadcrumb([{ id: data.id, name: data.name }]);
        }
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

  // Enter a subfolder
  const handleEnterFolder = useCallback(
    async (folder) => {
      setLoading(true);
      try {
        const res = await shareService.getShareSubfolderInfo(id, folder.id);
        const data = res.data;
        setItem(data);
        setCurrentFolderId(folder.id);
        
        // Update breadcrumb
        setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
      } catch (err) {
        let msg = "Không thể mở thư mục";
        if (err.response && err.response.data && err.response.data.error) {
          msg = err.response.data.error;
        }
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  // Navigate via breadcrumb
  const handleBreadcrumbClick = useCallback(
    async (idx) => {
      if (idx === breadcrumb.length - 1) return; // Already at this folder
      
      const target = breadcrumb[idx];
      setLoading(true);
      
      try {
        let res;
        if (idx === 0) {
          // Go back to root
          res = await shareService.getShareInfo(id);
          setCurrentFolderId(null);
        } else {
          // Go to a subfolder
          res = await shareService.getShareSubfolderInfo(id, target.id);
          setCurrentFolderId(target.id);
        }
        
        const data = res.data;
        setItem(data);
        setBreadcrumb(breadcrumb.slice(0, idx + 1));
      } catch (err) {
        let msg = "Không thể mở thư mục";
        if (err.response && err.response.data && err.response.data.error) {
          msg = err.response.data.error;
        }
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [breadcrumb, id]
  );

  const copyShareLink = useCallback(async () => {
    // Always copy the original share link (without subfolder path)
    const baseUrl = window.location.origin + `/share/${id}`;
    await navigator.clipboard.writeText(baseUrl);
    setCopied(true);
    toast.success("Đã copy link chia sẻ!");
    setTimeout(() => setCopied(false), 1500);
  }, [id]);

  // Helper function to get Google Drive download URL from file data
  const getDriveDownloadUrl = useCallback((file) => {
    if (!file) return null;
    const driveUrl = file.driveUrl || file.url;
    if (!driveUrl) return null;
    
    const patterns = [
      /\/d\/([\w-]+)\//,
      /[?&]id=([\w-]+)/,
      /\/file\/d\/([\w-]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = driveUrl.match(pattern);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }
    
    return driveUrl;
  }, []);

  // Download a single file with timeout and fallback
  const downloadSingleFile = useCallback(
    async (file, relativePath = "", onProgress) => {
      try {
        const fileSize = file.size || 0;
        const timeoutMs = fileSize > 100 * 1024 * 1024 ? 5 * 60 * 1000 : 2 * 60 * 1000;
        
        let lastProgressTime = Date.now();
        let lastProgressValue = 0;
        let progressStalledTimeout = null;

        // Create abort controller for timeout
        const downloadController = new AbortController();
        const timeout = setTimeout(() => {
          downloadController.abort();
        }, timeoutMs);

        // Monitor for stalled progress
        const checkProgressStall = () => {
          const now = Date.now();
          const timeSinceLastProgress = now - lastProgressTime;
          const currentProgress = typeof onProgress === 'function' ? lastProgressValue : 0;
          
          if (timeSinceLastProgress > 30000 && currentProgress > 0 && currentProgress < 100) {
            downloadController.abort();
          }
        };

        progressStalledTimeout = setInterval(checkProgressStall, 5000);

        const res = await shareService.downloadShareFile(id, file.id, (progressEvent) => {
          lastProgressTime = Date.now();
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            lastProgressValue = percentCompleted;
            onProgress(percentCompleted);
          }
        });
        
        clearTimeout(timeout);
        if (progressStalledTimeout) clearInterval(progressStalledTimeout);
        
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
        // Check if we should fallback to Google Drive URL
        const driveUrl = getDriveDownloadUrl(file);
        const isTimeout = err?.code === "ECONNABORTED" || 
                          err?.name === "AbortError" ||
                          err?.message?.includes("timeout");

        if (driveUrl && (isTimeout || err?.response?.status >= 500)) {
          // Fallback to Google Drive direct download
          const link = document.createElement("a");
          link.href = driveUrl;
          link.rel = "noopener noreferrer";
          link.target = "_blank";
          link.download = relativePath || file.name || "download";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return { success: true, fallback: true };
        }

        const errorMsg =
          err?.response?.data?.error || "Lỗi tải xuống: " + err.message;
        return { success: false, error: errorMsg };
      }
    },
    [id, getDriveDownloadUrl]
  );

  // Download folder (all files)
  const downloadFolder = useCallback(
    async (folderItem) => {
      try {
        setDownloadingId(folderItem.id);

        // Get list of files in folder
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

        // Create batch download
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

        // Download each file
        let successCount = 0;
        let errorCount = 0;

        await new Promise((resolve) => setTimeout(resolve, 100));

        for (let i = 0; i < downloadFiles.length; i++) {
          const fileState = downloadFiles[i];

          setDownloadBatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              files: prev.files.map((f, idx) =>
                idx === i ? { ...f, status: "downloading", progress: 0 } : f
              ),
            };
          });

          // For large files, show a simulated progress to indicate processing
          const fileSize = fileState.size || 0;
          const isLargeFile = fileSize > 100 * 1024 * 1024; // > 100MB
          let simulatedProgressInterval = null;
          
          if (isLargeFile) {
            // Simulate initial progress (0-5%) to show that download is starting
            let simulatedProgress = 0;
            simulatedProgressInterval = setInterval(() => {
              simulatedProgress = Math.min(simulatedProgress + 0.5, 5);
              setDownloadBatch((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  files: prev.files.map((f, idx) =>
                    idx === i ? { ...f, progress: simulatedProgress } : f
                  ),
                };
              });
              if (simulatedProgress >= 5) {
                clearInterval(simulatedProgressInterval);
              }
            }, 200);
          }

          try {
            const result = await downloadSingleFile(
              { id: fileState.id, name: fileState.name },
              fileState.relativePath,
              (progress) => {
                // Clear simulated progress when real progress starts
                if (simulatedProgressInterval) {
                  clearInterval(simulatedProgressInterval);
                  simulatedProgressInterval = null;
                }
                setDownloadBatch((prev) => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    files: prev.files.map((f, idx) =>
                      idx === i ? { ...f, progress: progress } : f
                    ),
                  };
                });
              }
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

          if (i < downloadFiles.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }

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

  // Download via URL (open in new tab)
  const handleDownloadUrl = useCallback(
    async (targetItem) => {
      if (!item?.canDownload) {
        toast.error("Bạn không có quyền tải xuống nội dung này");
        return;
      }

      if (targetItem.type === "folder") {
        toast.error("Tính năng này chỉ dành cho file");
        return;
      }

      try {
        setDownloadingId(targetItem.id);
        const res = await shareService.getShareFileUrl(id, targetItem.id);
        const downloadUrl = res.data?.url || res.data?.originalUrl;
        
        if (downloadUrl) {
          window.open(downloadUrl, "_blank");
          toast.success("Đã mở link tải xuống trong tab mới!");
        } else {
          toast.error("Không thể lấy URL tải xuống");
        }
      } catch (err) {
        const errorMsg = err?.response?.data?.error || "Lỗi lấy URL: " + err.message;
        toast.error(errorMsg);
      } finally {
        setDownloadingId(null);
      }
    },
    [id, item?.canDownload]
  );

  const handleDownload = useCallback(
    async (targetItem) => {
      // Check download permission from current item (which has canDownload from share)
      if (!item?.canDownload) {
        toast.error("Bạn không có quyền tải xuống nội dung này");
        return;
      }

      if (targetItem.type === "folder") {
        await downloadFolder(targetItem);
      } else {
        try {
          setDownloadingId(targetItem.id);

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

          await new Promise((resolve) => setTimeout(resolve, 100));

          setDownloadBatch((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              files: prev.files.map((f) => ({
                ...f,
                status: "downloading",
                progress: 0,
              })),
            };
          });

          // For large files, show a simulated progress to indicate processing
          const fileSize = targetItem.size || 0;
          const isLargeFile = fileSize > 100 * 1024 * 1024; // > 100MB
          let simulatedProgressInterval = null;
          
          if (isLargeFile) {
            // Simulate initial progress (0-5%) to show that download is starting
            let simulatedProgress = 0;
            simulatedProgressInterval = setInterval(() => {
              simulatedProgress = Math.min(simulatedProgress + 0.5, 5);
              setDownloadBatch((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  files: prev.files.map((f) => ({
                    ...f,
                    progress: simulatedProgress,
                  })),
                };
              });
              if (simulatedProgress >= 5) {
                clearInterval(simulatedProgressInterval);
              }
            }, 200);
          }

          const result = await downloadSingleFile(targetItem, "", (progress) => {
            // Clear simulated progress when real progress starts
            if (simulatedProgressInterval) {
              clearInterval(simulatedProgressInterval);
              simulatedProgressInterval = null;
            }
            setDownloadBatch((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                files: prev.files.map((f) => ({
                  ...f,
                  progress: progress,
                })),
              };
            });
          });

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
    [downloadFolder, downloadSingleFile, item?.canDownload]
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
    currentFolderId,
    rootFolderId,
    formatSize,
    fetchShareInfo,
    handleEnterFolder,
    handleBreadcrumbClick,
    copyShareLink,
    handleDownload,
    handleDownloadUrl,
    clearDownloadBatch,
  };
}
