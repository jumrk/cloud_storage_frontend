"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  FiX,
  FiChevronDown,
  FiAlertCircle,
  FiLink,
  FiLoader,
  FiCheck,
  FiUpload,
} from "react-icons/fi";
import axiosClient from "@/lib/axiosClient";

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
  helpImageSrc,
}) {
  const [link, setLink] = useState("");
  const [noteOpen, setNoteOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [started, setStarted] = useState(false);

  const controllerRef = useRef(null);
  const bufferRef = useRef("");
  const prevTextLenRef = useRef(0);
  const closedBySuccessRef = useRef(false);

  useEffect(() => {
    if (!isOpen) resetState();
  }, [isOpen]);

  function resetState() {
    setLink("");
    setNoteOpen(true);
    setIsSubmitting(false);
    setError("");
    setItems([]);
    setStarted(false);
    bufferRef.current = "";
    prevTextLenRef.current = 0;
    closedBySuccessRef.current = false;
    controllerRef.current?.abort?.();
    controllerRef.current = null;
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
              }))
            );
          }
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
          patchItem(i, {
            fileDbId: evt.fileDbId || null,
            driveFileId: evt.driveFileId || null,
            url: evt.url || null,
            done: true,
            ulUploaded:
              (items[i]?.ulTotal || items[i]?.dlTotal || items[i]?.size) ??
              items[i]?.ulUploaded,
            ulTotal:
              (items[i]?.ulTotal || items[i]?.dlTotal || items[i]?.size) ??
              items[i]?.ulTotal,
          });
          continue;
        }

        if (evt.event === "done") {
          if (!closedBySuccessRef.current) {
            closedBySuccessRef.current = true;
            onImported?.();
            onClose?.();
          }
          continue;
        }

        if (evt.event === "error") {
          setError(evt.error || "Có lỗi xảy ra.");
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
    bufferRef.current = "";
    prevTextLenRef.current = 0;
    closedBySuccessRef.current = false;

    try {
      controllerRef.current = new AbortController();

      const resp = await axiosClient.post(
        `${endpoint}?progress=ndjson`,
        { link: link.trim(), ...requestExtras },
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

      if (!started && items.length === 0) {
        try {
          const data =
            typeof resp.data === "string" ? JSON.parse(resp.data) : resp.data;
          if (data?.success === false) {
            setError(data?.error || "Có lỗi xảy ra khi tải bằng liên kết.");
          } else if (data?.items) {
            setItems(
              (data.items || []).map((it, i) => ({
                index: i,
                name: it.fileName || it.name || `Tệp #${i + 1}`,
                fileId: it.fileId || "",
                size: it.size ?? null,
                mimeType: it.mimeType || "application/octet-stream",
                dlReceived: it.size ?? null,
                dlTotal: it.size ?? null,
                ulUploaded: it.size ?? null,
                ulTotal: it.size ?? null,
                fileDbId: it.fileDbId || null,
                driveFileId: it.driveFileId || null,
                url: it.url || null,
                done: true,
              }))
            );
            if (!closedBySuccessRef.current) {
              closedBySuccessRef.current = true;
              onImported?.();
              onClose?.();
            }
          }
        } catch {}
      }
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Không thể kết nối máy chủ."
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
    const pct =
      items.reduce((s, it) => s + filePerc(it), 0) / Math.max(1, items.length);
    return { percent: clampPct(pct) };
  }, [items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex  items-center justify-center bg-gradient-to-br from-black/60 to-black/30 px-3">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col">
        <div className="relative bg-gradient-to-r from-sky-500 to-cyan-500 p-5 shrink-0">
          <h3 className="text-white text-xl font-semibold drop-shadow-sm">
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

        {/* CONTENT */}
        <form
          onSubmit={handleSubmit}
          className="p-5 grid md:grid-cols-5 gap-6 flex-1 overflow-hidden h-full"
        >
          {/* LEFT: flex column + min-h-0 để vùng danh sách có thể scroll */}
          <div className="md:col-span-3 flex flex-col h-full min-h-0 space-y-4">
            <div className="shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Liên kết Google Drive
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="Dán link file/thư mục Google Drive (đã mở công khai)"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !link.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:bg-gray-300 shadow-sm"
                >
                  {isSubmitting ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiLink />
                  )}
                  {isSubmitting ? "Đang xử lý" : "Bắt đầu"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Hỗ trợ link <span className="font-medium">file</span> hoặc{" "}
                <span className="font-medium">thư mục</span>.
              </p>
            </div>

            {error && (
              <div className="shrink-0 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                <FiAlertCircle className="mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {items.length > 0 && (
              <div className="shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    Tiến trình tổng
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="ml-1 font-medium">{overall.percent}%</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-[width] duration-300"
                    style={{ width: `${overall.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* LIST: vùng cuộn chính */}
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
                      className="border border-gray-200 rounded-xl p-3 hover:shadow-sm transition bg-white"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {it.done ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                              <FiCheck />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-100 text-sky-600">
                              {(it.index ?? 0) + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-medium truncate">
                              {it.name}
                            </div>
                            {it.driveFileId && (
                              <span className="text-[10px] uppercase tracking-wide bg-blue-50 text-blue-600 px-2 py-0.5 rounded inline-flex items-center gap-1">
                                <FiUpload /> DONE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {it.size != null
                              ? `${formatBytes(it.size)} · `
                              : ""}
                            {it.mimeType || "application/octet-stream"}
                          </div>

                          <div className="mt-3">
                            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  it.done ? "bg-emerald-500" : "bg-sky-500"
                                } transition-[width] duration-300`}
                                style={{ width: `${combined}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                              <span>Tổng</span>
                              <span className="font-medium">{combined}%</span>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                              <span>Tải xuống</span>
                              <span>
                                {it.dlTotal
                                  ? `${formatBytes(
                                      it.dlReceived || 0
                                    )} / ${formatBytes(it.dlTotal)}`
                                  : `${dlPct}%`}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-500 transition-[width] duration-300"
                                style={{ width: `${dlPct}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                              <span>Tải lên</span>
                              <span>
                                {it.ulTotal
                                  ? `${formatBytes(
                                      it.ulUploaded || 0
                                    )} / ${formatBytes(it.ulTotal)}`
                                  : `${ulPct}%`}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  it.done ? "bg-emerald-500" : "bg-indigo-500"
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
                                className="text-sky-600 hover:underline"
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

          {/* RIGHT */}
          <div className="md:col-span-2 flex flex-col h-full min-h-0">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setNoteOpen((v) => !v)}
                className="w-full flex items-center justify-between"
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
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="mt-0.5 text-amber-500" />
                    <p>
                      File/thư mục cần{" "}
                      <b>mở quyền “Bất kỳ ai có đường liên kết”</b>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="mt-0.5 text-amber-500" />
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
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Đóng
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                >
                  Hủy tiến trình
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !link.trim()}
                className="px-4 py-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 disabled:bg-gray-300 inline-flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <FiLink />
                )}
                Bắt đầu tải
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
