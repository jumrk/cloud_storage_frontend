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

  // Download a single file
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
    clearDownloadBatch,
  };
}
