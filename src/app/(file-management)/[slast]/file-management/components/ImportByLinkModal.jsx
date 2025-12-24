"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  FiX,
  FiChevronDown,
  FiAlertCircle,
  FiLink,
  FiLoader,
  FiCheck,
  FiUpload,
  FiFolder,
} from "react-icons/fi";
import axiosClient from "@/shared/lib/axiosClient";
import toast from "react-hot-toast";

function formatBytes(bytes) {
  if (bytes == null) return "--";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${sizes[i]}`;
}
const clampPct = (n) => Math.max(0, Math.min(100, Math.round(n || 0)));

export default function ImportByLinkModal({
  isOpen,
  onClose,
  onImported,
  endpoint = "/api/import-driver/download",
  requestExtras = {},
}) {
  const [link, setLink] = useState("");
  const [noteOpen, setNoteOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedFolderName, setSelectedFolderName] = useState("Thư mục gốc");
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folders, setFolders] = useState([]);
  const [folderLoading, setFolderLoading] = useState(false);

  const controllerRef = useRef(null);
  const bufferRef = useRef("");
  const prevTextLenRef = useRef(0);
  const closedBySuccessRef = useRef(false);
  const doneEventReceivedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) resetState();
  }, [isOpen]);

  // Check if all files are done and close modal
  useEffect(() => {
    if (!started || closedBySuccessRef.current || !doneEventReceivedRef.current)
      return;

    // Small delay to ensure all fileDone/fileError events have been processed
    const timeoutId = setTimeout(() => {
      // Check if all items are done (either successfully or with error)
      // An item is considered done if it has done: true OR error is set
      const allDone =
        items.length > 0 && items.every((it) => it.done === true || it.error);
      const successCount = items.filter((it) => it.done && !it.error).length;
      const errorCount = items.filter((it) => it.error).length;

      // Close modal if:
      // 1. All items are done, OR
      // 2. No items but done event was received (empty folder or all files failed before being tracked)
      if (
        (allDone || (items.length === 0 && doneEventReceivedRef.current)) &&
        !closedBySuccessRef.current
      ) {
        closedBySuccessRef.current = true;

        // Show success/error notification
        if (successCount > 0) {
          if (errorCount > 0) {
            // Some files succeeded, some failed
            toast.success(
              `Đã tải lên thành công ${successCount} file${
                successCount > 1 ? "s" : ""
              }${errorCount > 0 ? `, ${errorCount} file lỗi` : ""}`,
              { duration: 3000 }
            );
          } else {
            // All files succeeded
            toast.success(
              `Đã tải lên thành công ${successCount} file${
                successCount > 1 ? "s" : ""
              }!`,
              { duration: 3000 }
            );
          }
          // Delay to ensure DB writes are complete before refreshing
          setTimeout(() => {
            onImported?.();
            onClose?.();
          }, 1000);
        } else {
          // All files failed or no files processed
          if (errorCount > 0) {
            toast.error(
              `Không thể tải lên ${errorCount} file${
                errorCount > 1 ? "s" : ""
              }. Vui lòng kiểm tra quyền truy cập file/thư mục.`,
              { duration: 4000 }
            );
          } else if (items.length === 0) {
            // No files were processed (empty folder or error before fileStart)
            toast.error(
              "Không có file nào được tải lên. Vui lòng kiểm tra lại link hoặc quyền truy cập.",
              { duration: 4000 }
            );
          } else {
            toast.error("Không thể tải lên file. Vui lòng kiểm tra lại.", {
              duration: 4000,
            });
          }
          setTimeout(() => {
            onClose?.();
          }, 1000);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [items, started, onImported, onClose]);

  // Fetch folders
  // Fetch all folders recursively (flat list)
  const fetchAllFolders = React.useCallback(async () => {
    setFolderLoading(true);
    try {
      const allFolders = [];

      // Recursive function to fetch all folders
      const fetchFoldersRecursive = async (folderId = null, path = "") => {
        try {
          const params = folderId ? { folderId } : {};
          const response = await axiosClient.get("/api/files/browse", {
            params,
          });
          if (response.data?.success) {
            const folders = response.data.folders || [];
            for (const folder of folders) {
              const folderPath = path
                ? `${path} / ${folder.name}`
                : folder.name;
              allFolders.push({
                ...folder,
                displayPath: folderPath,
              });
              // Recursively fetch subfolders
              await fetchFoldersRecursive(folder._id, folderPath);
            }
          }
        } catch (err) {
          console.error("Error fetching folders recursively:", err);
        }
      };

      await fetchFoldersRecursive();
      setFolders(allFolders);
    } catch (err) {
      console.error("Error fetching all folders:", err);
    } finally {
      setFolderLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showFolderPicker) {
      fetchAllFolders();
    }
  }, [showFolderPicker, fetchAllFolders]);

  const handleFolderSelect = (folder) => {
    setSelectedFolderId(folder?._id || null);
    setSelectedFolderName(folder?.name || "Thư mục gốc");
    setShowFolderPicker(false);
  };

  function resetState() {
    setLink("");
    setNoteOpen(true);
    setIsSubmitting(false);
    setError("");
    setItems([]);
    setStarted(false);
    setSessionId(null);
    setSelectedFolderId(null);
    setSelectedFolderName("Thư mục gốc");
    setShowFolderPicker(false);
    setFolders([]);
    bufferRef.current = "";
    prevTextLenRef.current = 0;
    closedBySuccessRef.current = false;
    doneEventReceivedRef.current = false;
    controllerRef.current?.abort?.();
  }

  function ensureItem(index) {
    setItems((prev) => {
      const next = [...prev];
      if (!next[index]) {
        next[index] = {
          index,
          name: `Tệp #${index + 1}`,
          fileId: "",
          size: null,
          mimeType: "",
          dlReceived: 0,
          dlTotal: null,
          ulUploaded: 0,
          ulTotal: null,
          fileDbId: null,
          driveFileId: null,
          url: null,
          done: false,
          error: null,
        };
      }
      return next;
    });
  }

  function patchItem(index, patch) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] || {}), ...patch };
      return next;
    });
  }

  function consumeBufferLines() {
    let idx;
    while ((idx = bufferRef.current.indexOf("\n")) >= 0) {
      const line = bufferRef.current.slice(0, idx).trim();
      bufferRef.current = bufferRef.current.slice(idx + 1);
      if (!line) continue;

      try {
        const evt = JSON.parse(line);

        if (evt.event === "start") {
          setStarted(true);
          setIsSubmitting(true);
          if (evt.sessionId) {
            setSessionId(evt.sessionId);
          }
          if (evt.totalFiles && evt.totalFiles > 1) {
            setItems(
              Array.from({ length: evt.totalFiles }, (_, i) => ({
                index: i,
                name: `Tệp #${i + 1}`,
                fileId: "",
                size: null,
                mimeType: "",
                dlReceived: 0,
                dlTotal: null,
                ulUploaded: 0,
                ulTotal: null,
                fileDbId: null,
                driveFileId: null,
                url: null,
                done: false,
                error: null,
              }))
            );
          }
          continue;
        }

        if (evt.event === "fileStart") {
          const i = evt.index ?? 0;
          ensureItem(i);
          // Initialize file item when it starts processing
          // Backend sends fileName, size, mimeType in fileStart event
          patchItem(i, {
            fileId: evt.fileId || "",
            name: evt.fileName || `Tệp #${i + 1}`,
            size: evt.size ?? null,
            mimeType: evt.mimeType || "",
          });
          continue;
        }

        if (evt.event === "downloadProgress") {
          const i = evt.index ?? 0;
          ensureItem(i);
          patchItem(i, {
            fileId: evt.fileId || "",
            dlReceived: evt.received || 0,
            dlTotal: evt.total ?? null,
          });
          continue;
        }

        if (evt.event === "uploadProgress") {
          const i = evt.index ?? 0;
          ensureItem(i);
          patchItem(i, {
            ulUploaded: evt.uploaded || 0,
            ulTotal: evt.total ?? null,
          });
          continue;
        }

        if (evt.event === "fileDone") {
          const i = evt.index ?? 0;
          ensureItem(i);
          // Use functional update to avoid stale closure
          setItems((prev) => {
            const next = [...prev];
            if (!next[i]) {
              next[i] = {
                index: i,
                name: `Tệp #${i + 1}`,
                fileId: "",
                size: null,
                mimeType: "",
                dlReceived: 0,
                dlTotal: null,
                ulUploaded: 0,
                ulTotal: null,
                fileDbId: null,
                driveFileId: null,
                url: null,
                done: false,
                error: null,
              };
            }
            const current = next[i];
            next[i] = {
              ...current,
              fileDbId: evt.fileDbId || current.fileDbId || null,
              driveFileId: evt.driveFileId || current.driveFileId || null,
              url: evt.url || current.url || null,
              done: true,
              // Ensure progress is set to 100% when done
              ulUploaded:
                current.ulTotal ||
                current.dlTotal ||
                current.size ||
                current.ulUploaded ||
                0,
              ulTotal:
                current.ulTotal ||
                current.dlTotal ||
                current.size ||
                current.ulTotal ||
                null,
              // Update name, size, mimeType if provided in fileDone event
              name: evt.fileName || current.name,
              size: evt.size ?? current.size,
              mimeType: evt.mimeType || current.mimeType,
            };
            return next;
          });
          continue;
        }

        if (evt.event === "done") {
          setIsSubmitting(false);
          doneEventReceivedRef.current = true;
          if (evt.sessionId) {
            setSessionId(evt.sessionId);
          }
          continue;
        }

        if (evt.event === "error") {
          setError(evt.error || "Có lỗi xảy ra.");
          setIsSubmitting(false);
          doneEventReceivedRef.current = true; // Mark as done so modal can close
          if (evt.sessionId) {
            setSessionId(evt.sessionId);
          }
          // Mark all items as done with error so completion check works
          setItems((prev) =>
            prev.map((it) => ({
              ...it,
              done: true,
              error: it.error || evt.error || "Lỗi không xác định",
            }))
          );
          break;
        }

        if (evt.event === "fileWarning") {
          const i = evt.index ?? 0;
          ensureItem(i);
          // Warning doesn't stop the process, just log it
          // Could optionally show a warning indicator in UI
          continue;
        }

        // Handle folder events (for folder imports)
        if (evt.event === "folderStart") {
          // Folder processing started - could show folder name in UI
          continue;
        }

        if (evt.event === "folderError") {
          // Folder processing error - log but continue
          console.warn("Folder error:", evt.error);
          continue;
        }

        if (evt.event === "folderDone") {
          // Folder processing completed - log but continue
          continue;
        }

        if (evt.event === "fileError") {
          const i = evt.index ?? 0;
          ensureItem(i);
          // Mark file as done with error so UI can properly handle completion
          patchItem(i, {
            error: evt.error || "Lỗi không xác định",
            done: true, // Mark as done so it's counted in completion check
          });
          // Don't stop the entire process, continue with next file
          continue;
        }

        if (evt.fileName || evt.size || evt.mimeType) {
          const i = evt.index ?? 0;
          ensureItem(i);
          patchItem(i, {
            name: evt.fileName || items[i]?.name,
            size: evt.size ?? items[i]?.size,
            mimeType: evt.mimeType || items[i]?.mimeType,
          });
        }
      } catch {}
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault?.();
    setError("");

    if (!link.trim()) {
      setError("Vui lòng dán liên kết Google Drive.");
      return;
    }

    setIsSubmitting(true);
    setItems([]);
    setStarted(false);
    setSessionId(null);
    bufferRef.current = "";
    prevTextLenRef.current = 0;
    closedBySuccessRef.current = false;
    doneEventReceivedRef.current = false; // Reset done flag

    try {
      controllerRef.current = new AbortController();

      const resp = await axiosClient.post(
        `${endpoint}?progress=ndjson`,
        {
          link: link.trim(),
          folderId: selectedFolderId,
          ...requestExtras,
        },
        {
          signal: controllerRef.current.signal,
          responseType: "text",
          onDownloadProgress: (pe) => {
            const xhr = pe?.event?.currentTarget || pe?.target;
            if (!xhr) return;
            const text = xhr.responseText || "";
            const chunk = text.slice(prevTextLenRef.current);
            if (!chunk) return;
            prevTextLenRef.current = text.length;
            bufferRef.current += chunk;
            consumeBufferLines();
          },
          transformResponse: [(data) => data],
          headers: {
            Accept: "application/x-ndjson, application/json;q=0.9, */*;q=0.8",
          },
        }
      );

      // Handle non-stream mode response (shouldn't happen with progress=ndjson, but handle gracefully)
      if (!started && items.length === 0) {
        try {
          const data =
            typeof resp.data === "string" ? JSON.parse(resp.data) : resp.data;
          if (data?.success === false) {
            setError(data?.error || "Có lỗi xảy ra khi tải bằng liên kết.");
            doneEventReceivedRef.current = true; // Mark as done so modal can close
          } else if (data?.items && data.items.length > 0) {
            const successCount = data.items.length;
            toast.success(
              `Đã tải lên thành công ${successCount} file${
                successCount > 1 ? "s" : ""
              }!`,
              { duration: 3000 }
            );
            if (!closedBySuccessRef.current) {
              closedBySuccessRef.current = true;
              doneEventReceivedRef.current = true;
              setTimeout(() => {
                onImported?.();
                onClose?.();
              }, 1000);
            }
          }
        } catch (parseErr) {
          // If parsing fails, it might be NDJSON stream - that's expected
          // Only log if it's a real error
          if (
            resp.data &&
            typeof resp.data === "string" &&
            !resp.data.includes("\n")
          ) {
            console.warn("Failed to parse response:", parseErr);
          }
        }
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Không thể kết nối máy chủ."
        );
        doneEventReceivedRef.current = true; // Mark as done so modal can close on error
        // Mark all items as done with error
        setItems((prev) =>
          prev.length > 0
            ? prev.map((it) => ({
                ...it,
                done: true,
                error: it.error || err?.message || "Lỗi kết nối",
              }))
            : []
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    controllerRef.current?.abort?.();
    setIsSubmitting(false);
  }

  function filePerc(it) {
    const dlPct = it.dlTotal ? (it.dlReceived / it.dlTotal) * 100 : 0;
    const ulPct = it.ulTotal ? (it.ulUploaded / it.ulTotal) * 100 : 0;
    if (it.done) return 100;
    if (it.dlTotal && !it.ulTotal) return clampPct(dlPct);
    if (!it.dlTotal && it.ulTotal) return clampPct(ulPct);
    return clampPct((dlPct + ulPct) / 2);
  }

  const overall = useMemo(() => {
    if (!items.length) return { percent: 0 };

    // Calculate progress based on ALL files in the items array
    // This ensures progress doesn't drop when new files start
    // Formula: (sum of all file progress) / total files
    const totalProgress = items.reduce((sum, it) => {
      // If file is done, count as 100%
      if (it.done) return sum + 100;
      // Otherwise, use the actual progress percentage (0% if not started yet)
      return sum + filePerc(it);
    }, 0);

    // Calculate average progress across all files
    // This way, when a file finishes (100%) and a new one starts (0%),
    // the overall progress reflects the true average
    const pct = totalProgress / items.length;

    return { percent: clampPct(pct) };
  }, [items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-black/60 to-black/30 px-3">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col">
        <div className="relative bg-gradient-brand p-5 shrink-0">
          <h3 className="text-brand text-xl font-semibold drop-shadow-sm">
            Tải lên bằng liên kết
          </h3>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition"
            aria-label="Đóng"
          >
            <FiX />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-5 grid md:grid-cols-5 gap-6 flex-1 overflow-hidden h-full"
        >
          <div className="md:col-span-3 flex flex-col h-full min-h-0 space-y-4">
            <div className="shrink-0">
              <label className="block text-sm font-medium text-text-strong mb-1">
                Liên kết Google Drive
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="Dán link file/thư mục Google Drive (đã mở công khai)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-400"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !link.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white hover:opacity-95 disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiLink />
                  )}
                  {isSubmitting ? "Đang xử lý" : "Bắt đầu"}
                </button>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Hỗ trợ link <span className="font-medium">file</span> hoặc{" "}
                <span className="font-medium">thư mục</span>.
              </p>
            </div>

            <div className="shrink-0">
              <label className="block text-sm font-medium text-text-strong mb-1">
                Thư mục đích
              </label>
              <button
                type="button"
                onClick={() => setShowFolderPicker(true)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-surface-50 flex items-center justify-between text-left"
              >
                <span className="flex items-center gap-2">
                  <FiFolder className="text-brand" />
                  <span className="text-text-strong">{selectedFolderName}</span>
                </span>
                <FiChevronDown className="text-text-muted" />
              </button>
            </div>

            {error && (
              <div className="shrink-0 flex flex-col gap-2 text-danger-700 bg-danger-50 border border-danger-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="mt-0.5" />
                  <p className="text-sm flex-1">{error}</p>
                </div>
              </div>
            )}

            {items.length > 0 && (
              <div className="shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-text-strong">
                    Tiến trình tổng
                  </div>
                  <div className="text-xs text-text-muted">
                    <span className="ml-1 font-medium">{overall.percent}%</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-surface-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand transition-[width] duration-300"
                    style={{ width: `${overall.percent}%` }}
                  />
                </div>
              </div>
            )}

            {items.length > 0 && (
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3">
                {items.map((it) => {
                  const dlPct = it.dlTotal
                    ? clampPct((it.dlReceived / it.dlTotal) * 100)
                    : 0;
                  const ulPct = it.ulTotal
                    ? clampPct((it.ulUploaded / it.ulTotal) * 100)
                    : 0;
                  const combined = filePerc(it);

                  return (
                    <div
                      key={it.index}
                      className="border border-border rounded-xl p-3 hover:shadow-sm transition bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {it.done ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success-100 text-success-600">
                              <FiCheck />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-50 text-brand">
                              {(it.index ?? 0) + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium truncate text-text-strong">
                              {it.name}
                            </div>
                            {it.driveFileId && (
                              <span className="text-[10px] uppercase tracking-wide bg-brand-50 text-brand px-2 py-0.5 rounded inline-flex items-center gap-1">
                                <FiUpload /> DONE
                              </span>
                            )}
                            {it.error && (
                              <span className="text-[10px] uppercase tracking-wide bg-danger-50 text-danger-600 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                <FiAlertCircle /> LỖI
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-muted mt-0.5">
                            {it.size != null
                              ? `${formatBytes(it.size)} · `
                              : ""}
                            {it.mimeType || "application/octet-stream"}
                          </div>
                          {it.error && (
                            <div className="mt-2 text-xs text-danger-600 bg-danger-50 border border-danger-200 rounded-lg p-2">
                              <div className="flex items-start gap-2">
                                <FiAlertCircle className="mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <div className="font-medium">
                                    Lỗi: {it.error}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-3">
                            <div className="w-full h-2.5 bg-surface-50 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  it.done ? "bg-success" : "bg-brand"
                                } transition-[width] duration-300`}
                                style={{ width: `${combined}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-text-muted mt-1">
                              <span>Tổng</span>
                              <span className="font-medium">{combined}%</span>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
                              <span>Tải xuống</span>
                              <span>
                                {it.dlTotal
                                  ? `${formatBytes(
                                      it.dlReceived || 0
                                    )} / ${formatBytes(it.dlTotal)}`
                                  : `${dlPct}%`}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-surface-50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-accent transition-[width] duration-300"
                                style={{ width: `${dlPct}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
                              <span>Tải lên</span>
                              <span>
                                {it.ulTotal
                                  ? `${formatBytes(
                                      it.ulUploaded || 0
                                    )} / ${formatBytes(it.ulTotal)}`
                                  : `${ulPct}%`}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-surface-50 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  it.done ? "bg-success" : "bg-brand"
                                } transition-[width] duration-300`}
                                style={{ width: `${ulPct}%` }}
                              />
                            </div>
                          </div>

                          {it.url && (
                            <div className="mt-2 text-xs">
                              <a
                                href={it.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-600 hover:underline"
                              >
                                Mở trên Google Drive
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col h-full min-h-0">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setNoteOpen((v) => !v)}
                className="w-full flex items-center justify-between text-text-strong"
              >
                <span className="text-sm font-semibold">
                  Lưu ý trước khi dán liên kết
                </span>
                <FiChevronDown
                  className={`transition-transform ${
                    noteOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {noteOpen && (
                <div className="mt-3 space-y-2 text-sm text-text-strong">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="mt-0.5 text-warning-500" />
                    <p>
                      File/thư mục cần{" "}
                      <b>mở quyền “Bất kỳ ai có đường liên kết”</b>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="mt-0.5 text-warning-500" />
                    <p>
                      Nếu là thư mục, hệ thống sẽ tải tất cả file bên trong (bỏ
                      qua thư mục rỗng).
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-4 shrink-0">
              {!isSubmitting ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-surface-50 hover:bg-white text-text-strong border border-border"
                >
                  Đóng
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl bg-danger text-white hover:opacity-95"
                >
                  Hủy tiến trình
                </button>
              )}
              {!isSubmitting && (
                <button
                  onClick={handleSubmit}
                  disabled={!link.trim()}
                  className="px-4 py-2.5 rounded-xl bg-brand text-white hover:opacity-95 disabled:opacity-50 inline-flex items-center gap-2 shadow-sm"
                >
                  <FiLink />
                  Bắt đầu tải
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Folder Picker Modal */}
        {showFolderPicker && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-3">
            <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[80vh]">
              <div className="relative bg-gradient-brand p-5 shrink-0">
                <h3 className="text-brand text-xl font-semibold">
                  Chọn thư mục đích
                </h3>
                <button
                  onClick={() => {
                    setShowFolderPicker(false);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition"
                >
                  <FiX />
                </button>
              </div>

              {/* Folder List */}
              <div className="flex-1 overflow-y-auto p-4 sidebar-scrollbar max-h-[400px]">
                {folderLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <FiLoader className="animate-spin text-brand text-2xl" />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => handleFolderSelect(null)}
                      className={`w-full p-3 rounded-lg border ${
                        selectedFolderId === null
                          ? "border-brand bg-brand-50"
                          : "border-border hover:bg-surface-50"
                      } flex items-center gap-3 text-left`}
                    >
                      <FiFolder className="text-brand" />
                      <span className="text-text-strong">Thư mục gốc</span>
                      {selectedFolderId === null && (
                        <FiCheck className="ml-auto text-brand" />
                      )}
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder._id}
                        onClick={() => handleFolderSelect(folder)}
                        className={`w-full p-3 rounded-lg border ${
                          selectedFolderId === folder._id
                            ? "border-brand bg-brand-50"
                            : "border-border hover:bg-surface-50"
                        } flex items-center gap-3 text-left`}
                      >
                        <FiFolder className="text-brand" />
                        <span className="text-text-strong flex-1">
                          {folder.displayPath || folder.name}
                        </span>
                        {selectedFolderId === folder._id && (
                          <FiCheck className="text-brand" />
                        )}
                      </button>
                    ))}
                    {folders.length === 0 && !folderLoading && (
                      <div className="text-center py-8 text-text-muted">
                        Không có thư mục
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-border shrink-0 flex gap-2">
                <button
                  onClick={() => {
                    setShowFolderPicker(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface-50 hover:bg-white text-text-strong border border-border"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
