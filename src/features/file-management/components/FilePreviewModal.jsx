import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
export default function FilePreviewModal({ file, fileUrl, onClose, onOpen }) {
  const t = useTranslations();
  const ext = file.name.split(".").pop().toLowerCase();
  const isText = ["txt", "md", "js", "json", "log", "csv"].includes(ext);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewText, setPreviewText] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Determine file type for appropriate preview
  const mimeType = file?.mimeType || "";
  const isVideo =
    mimeType.startsWith("video/") ||
    ["mp4", "webm", "ogg", "mov", "avi", "mkv"].includes(ext);
  const isImage =
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
  const isPDF = mimeType === "application/pdf" || ext === "pdf";
  const isTextFile =
    isText ||
    mimeType.startsWith("text/") ||
    ["txt", "md", "js", "json", "log", "csv", "xml", "html", "css"].includes(
      ext
    );
  // Office files that can be previewed via Google Docs Viewer
  const isOfficeFile =
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp"].includes(
      ext
    ) ||
    mimeType.includes("application/msword") ||
    mimeType.includes("application/vnd.openxmlformats-officedocument") ||
    mimeType.includes("application/vnd.ms-excel") ||
    mimeType.includes("application/vnd.ms-powerpoint") ||
    mimeType.includes("application/vnd.oasis.opendocument");
  // Files that cannot be previewed (executables, archives, etc.)
  const cannotPreview =
    [
      "exe",
      "msi",
      "dmg",
      "pkg",
      "deb",
      "rpm",
      "zip",
      "rar",
      "7z",
      "tar",
      "gz",
      "bz2",
    ].includes(ext) ||
    mimeType.includes("application/x-msdownload") ||
    mimeType.includes("application/x-executable") ||
    mimeType.includes("application/zip") ||
    mimeType.includes("application/x-rar-compressed");

  // Check if file is still uploading
  const isUploading =
    file?.driveUploadStatus === "uploading" ||
    file?.driveUploadStatus === "pending" ||
    (!file?.driveFileId && (file?.tempDownloadUrl || file?.tempFilePath));

  // Close chat when modal opens
  useEffect(() => {
    if (onOpen && file) {
      onOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]); // Only run when file changes (modal opens)

  // Get preview URL - use backend proxy for Google Drive files
  useEffect(() => {
    let currentBlobUrl = null;

    if (!file?._id || isUploading) {
      setPreviewUrl(null);
      setPreviewBlobUrl(null);
      setPreviewText(null);
      setPreviewError(null);
      setIsLoadingPreview(false);
      return;
    }

    // Get API base URL from environment variable
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

    // If it's a Google Drive URL, always use backend proxy
    // Google Drive blocks direct embedding from external domains
    // Always use backend proxy if file has driveFileId, or if fileUrl contains drive.google.com
    const needsBackendProxy =
      file?.driveFileId || (fileUrl && fileUrl.includes("drive.google.com"));

    if (needsBackendProxy) {
      // For files that cannot be previewed, don't fetch
      if (cannotPreview) {
        setPreviewUrl(null);
        setPreviewBlobUrl(null);
        setPreviewText(null);
        setPreviewError(null);
        setIsLoadingPreview(false);
        return;
      }

      // For video, image, PDF: use direct proxy URL
      if (isVideo || isImage || isPDF) {
        setPreviewUrl(`${apiBase}/api/download/file/${file._id}?preview=true`);
        setPreviewBlobUrl(null);
        setPreviewText(null);
        setPreviewError(null);
        setIsLoadingPreview(false);
      } else if (isOfficeFile) {
        // For Office files, use Google Docs Viewer
        // Works for both Google Drive and non-Google Drive files
        const proxyUrl = `${apiBase}/api/download/file/${file._id}?preview=true`;
        const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
          proxyUrl
        )}&embedded=true`;
        setPreviewUrl(googleDocsViewerUrl);
        setPreviewBlobUrl(null);
        setPreviewText(null);
        setPreviewError(null);
        setIsLoadingPreview(false);
      } else {
        // For other files (text, documents, etc.): fetch and create blob URL
        setIsLoadingPreview(true);
        const fetchFile = async () => {
          try {
            const token =
              typeof window !== "undefined"
                ? localStorage.getItem("token")
                : null;
            const response = await fetch(
              `${apiBase}/api/download/file/${file._id}?preview=true`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              }
            );

            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.status}`);
            }

            // For text files, read as text
            if (isTextFile) {
              const text = await response.text();
              setPreviewText(text);
              setPreviewBlobUrl(null);
            } else {
              // For other files, create blob URL
              const blob = await response.blob();
              const blobUrl = URL.createObjectURL(blob);
              currentBlobUrl = blobUrl;
              setPreviewBlobUrl(blobUrl);
              setPreviewText(null);
            }
            setPreviewUrl(null);
            setPreviewError(null);
            setIsLoadingPreview(false);
          } catch (error) {
            console.error("Error fetching file for preview:", error);
            setPreviewError(error.message);
            setPreviewUrl(null);
            setPreviewBlobUrl(null);
            setPreviewText(null);
            setIsLoadingPreview(false);
          }
        };

        fetchFile();
      }
    } else {
      // Use direct URL for non-Google Drive files
      // But if fileUrl is not available, still use backend proxy
      if (!fileUrl) {
        // If no fileUrl, use backend proxy for all files
        if (isVideo || isImage || isPDF) {
          setPreviewUrl(
            `${apiBase}/api/download/file/${file._id}?preview=true`
          );
          setPreviewBlobUrl(null);
          setPreviewText(null);
          setPreviewError(null);
          setIsLoadingPreview(false);
        } else if (isOfficeFile) {
          const proxyUrl = `${apiBase}/api/download/file/${file._id}?preview=true`;
          const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
            proxyUrl
          )}&embedded=true`;
          setPreviewUrl(googleDocsViewerUrl);
          setPreviewBlobUrl(null);
          setPreviewText(null);
          setPreviewError(null);
          setIsLoadingPreview(false);
        } else if (cannotPreview) {
          setPreviewUrl(null);
          setPreviewBlobUrl(null);
          setPreviewText(null);
          setPreviewError(null);
          setIsLoadingPreview(false);
        } else {
          // For other files, fetch and create blob URL
          setIsLoadingPreview(true);
          const fetchFile = async () => {
            try {
              const token =
                typeof window !== "undefined"
                  ? localStorage.getItem("token")
                  : null;
              const response = await fetch(
                `${apiBase}/api/download/file/${file._id}?preview=true`,
                {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
              );

              if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status}`);
              }

              if (isTextFile) {
                const text = await response.text();
                setPreviewText(text);
                setPreviewBlobUrl(null);
              } else {
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                currentBlobUrl = blobUrl;
                setPreviewBlobUrl(blobUrl);
                setPreviewText(null);
              }
              setPreviewUrl(null);
              setPreviewError(null);
              setIsLoadingPreview(false);
            } catch (error) {
              console.error("Error fetching file for preview:", error);
              setPreviewError(error.message);
              setPreviewUrl(null);
              setPreviewBlobUrl(null);
              setPreviewText(null);
              setIsLoadingPreview(false);
            }
          };
          fetchFile();
        }
      } else {
        // Use direct fileUrl if available
        if (isVideo || isImage || isPDF) {
          setPreviewUrl(fileUrl);
          setPreviewBlobUrl(null);
          setPreviewText(null);
          setPreviewError(null);
          setIsLoadingPreview(false);
        } else if (isOfficeFile) {
          const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(
            fileUrl
          )}&embedded=true`;
          setPreviewUrl(googleDocsViewerUrl);
          setPreviewBlobUrl(null);
          setPreviewText(null);
          setPreviewError(null);
          setIsLoadingPreview(false);
        } else if (cannotPreview) {
          setPreviewUrl(null);
          setPreviewBlobUrl(null);
          setPreviewText(null);
          setPreviewError(null);
          setIsLoadingPreview(false);
        } else {
          // For other files from non-Google Drive, show cannot preview message
          setPreviewUrl(null);
          setPreviewBlobUrl(null);
          setPreviewText(null);
          setPreviewError(null);
          setIsLoadingPreview(false);
        }
      }
    }

    // Cleanup blob URL on unmount or when file changes
    return () => {
      if (currentBlobUrl && currentBlobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [
    file?._id,
    fileUrl,
    isUploading,
    file?.driveFileId,
    isVideo,
    isImage,
    isPDF,
    isTextFile,
    isOfficeFile,
    cannotPreview,
  ]);

  // Handle click on overlay (background) to close modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative">
        <button
          className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-gray-700 z-10"
          onClick={onClose}
          title={t("file.preview.close")}
        >
          ×
        </button>
        <div className="p-6 flex-1 flex flex-col h-full overflow-hidden">
          <div className="mb-4 font-semibold text-lg text-center break-all shrink-0">
            {file.name}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {isUploading && !fileUrl ? (
              <div className="flex flex-col items-center justify-center gap-3 mt-6 flex-1">
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="font-medium">
                    File đang được upload lên Google Drive
                  </span>
                </div>
                <div className="text-gray-500 text-sm">
                  Vui lòng đợi upload hoàn thành để xem trước file
                </div>
              </div>
            ) : previewError ? (
              <div className="flex flex-col items-center justify-center gap-3 mt-6 flex-1">
                <div className="text-red-500">
                  Không thể tải file để xem trước: {previewError}
                </div>
                <a
                  href={fileUrl}
                  download={file.name}
                  className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition"
                >
                  {t("file.action.download")}
                </a>
              </div>
            ) : isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center gap-3 mt-6 flex-1">
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="font-medium">
                    Đang tải file để xem trước...
                  </span>
                </div>
              </div>
            ) : previewText ? (
              /* Text files - display text content */
              <div className="w-full h-full overflow-auto bg-gray-50 p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {previewText}
                </pre>
              </div>
            ) : isVideo && (previewUrl || previewBlobUrl) ? (
              /* Video files - use HTML5 video tag */
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <video
                  src={previewUrl || previewBlobUrl}
                  controls
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error("Video load error:", e);
                    setPreviewError("Không thể tải video");
                  }}
                >
                  Trình duyệt của bạn không hỗ trợ video tag.
                </video>
              </div>
            ) : isImage && (previewUrl || previewBlobUrl) ? (
              /* Image files - use img tag */
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src={previewUrl || previewBlobUrl}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error("Image load error:", e);
                    setPreviewError("Không thể tải hình ảnh");
                  }}
                />
              </div>
            ) : isPDF && (previewUrl || previewBlobUrl) ? (
              /* PDF files - use embed tag */
              <div className="w-full h-full overflow-hidden">
                <embed
                  src={previewUrl || previewBlobUrl}
                  type="application/pdf"
                  className="w-full h-full"
                  onError={(e) => {
                    console.error("PDF load error:", e);
                    setPreviewError("Không thể tải PDF");
                  }}
                />
              </div>
            ) : isOfficeFile && previewUrl ? (
              /* Office files - use Google Docs Viewer in iframe */
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={previewUrl}
                  title={file.name}
                  width="100%"
                  height="100%"
                  className="border-0 flex-1"
                  onError={(e) => {
                    console.error("Office file preview error:", e);
                    setPreviewError(
                      "Không thể tải file Office qua Google Docs Viewer"
                    );
                  }}
                  onLoad={(e) => {
                    // Check if Google Docs Viewer failed to load
                    try {
                      const iframe = e.target;
                      // If iframe content is empty or shows error, it might have failed
                      // Note: Cross-origin restrictions prevent checking iframe content
                      // So we rely on the iframe's onError and timeout
                    } catch (err) {
                      console.error("Error checking iframe content:", err);
                    }
                  }}
                />
                <div className="p-2 bg-gray-50 border-t text-xs text-gray-500 text-center">
                  Đang sử dụng Google Docs Viewer. Nếu không hiển thị, vui lòng
                  tải file xuống.
                </div>
              </div>
            ) : previewBlobUrl && !cannotPreview ? (
              /* Other files - use object tag with blob URL */
              <object
                data={previewBlobUrl}
                type={mimeType || "application/octet-stream"}
                className="w-full h-full"
                onError={(e) => {
                  console.error("Object load error:", e);
                  setPreviewError("Không thể tải file");
                }}
              >
                <div className="flex flex-col items-center justify-center gap-3 mt-6 flex-1">
                  <div className="text-gray-500">
                    Không thể xem trước file này. Vui lòng tải xuống để xem.
                  </div>
                  <a
                    href={previewBlobUrl}
                    download={file.name}
                    className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition"
                  >
                    {t("file.action.download")}
                  </a>
                </div>
              </object>
            ) : (
              <div className="flex flex-col items-center gap-3 mt-6">
                <div className="text-gray-500">
                  {t("file.preview.cannot_preview")}
                </div>
                <a
                  href={fileUrl}
                  download={file.name}
                  className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition"
                >
                  {t("file.action.download")}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
