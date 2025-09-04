// Page.jsx
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axiosClient from "@/lib/axiosClient";
import toast from "react-hot-toast";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || axiosClient.defaults.baseURL || "";

const cn = (...s) => s.filter(Boolean).join(" ");
const pretty = (n) => {
  if (!n) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${(n / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

function Stepper({ current = 1 }) {
  const steps = [
    { id: 1, label: "Tải lên" },
    { id: 2, label: "Ghép video" },
    { id: 3, label: "Hoàn tất" },
  ];

  return (
    <div className="flex items-center justify-center gap-3 text-sm select-none">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 border",
              s.id === current
                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                : "bg-gray-50 text-gray-600 border-gray-200"
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  s.id === current ? "rgb(99 102 241)" : "rgb(209 213 219)",
              }}
            />
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="text-gray-300">—</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function MergePage() {
  const [mode, setMode] = useState("copy");
  const [outFmt, setOutFmt] = useState("mp4");
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [fps, setFps] = useState(30);

  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const [sid, setSid] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProg, setUploadProg] = useState({});
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [mergePercent, setMergePercent] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const esRef = useRef(null);

  const totalSize = useMemo(
    () => files.reduce((s, f) => s + f.size, 0),
    [files]
  );
  const valid = files.length > 0;

  const onFiles = useCallback((list) => {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("video/"));
    setFiles((prev) => [...prev, ...picked]);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer?.files || null);
  };

  const openPicker = () => inputRef.current?.click();
  const clearAll = () => setFiles([]);

  async function createSession() {
    const payload = {
      mode,
      outFmt,
      ...(mode === "normalize" ? { normalize: { width, height, fps } } : {}),
    };
    const { data } = await axiosClient.post(
      "/api/tools/merge/session",
      payload
    );
    return data;
  }

  async function uploadOneToSession(sid, file, onProgress) {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await axiosClient.post(
      `/api/tools/merge/${sid}/upload`,
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const percent = Math.round((evt.loaded * 100) / evt.total);
          onProgress?.(percent);
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );
    return data;
  }

  async function finalizeSession(sid) {
    const { data } = await axiosClient.post(
      `/api/tools/merge/${sid}/finalize`,
      {}
    );
    return data;
  }

  async function getStatus(sid) {
    const { data } = await axiosClient.get(`/api/tools/merge/${sid}/status`);
    return data;
  }

  function listenProgress(id) {
    if (esRef.current) {
      try {
        esRef.current.close();
      } catch {}
    }
    const url = `${API_BASE.replace(/\/$/, "")}/api/tools/merge/progress/${id}`;
    const es = new EventSource(url, { withCredentials: true });
    es.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data || "{}");
        if (typeof evt.percent === "number") setMergePercent(evt.percent);
        if (evt.message) setMessage(evt.message);
        if (evt.status === "completed") {
          setStatus("completed");
          es.close();
          esRef.current = null;
        } else if (evt.status === "failed") {
          setStatus("failed");
          setMessage(evt.message || "Thất bại");
          es.close();
          esRef.current = null;
        } else {
          setStatus("merging");
        }
      } catch {}
    };
    es.onerror = () => {};
    esRef.current = es;
  }

  async function handleSubmit() {
    if (!valid) {
      toast.error("Chưa chọn video");
      return;
    }
    setStatus("uploading");
    setUploadProg({});
    setMergePercent(0);
    setDownloadUrl(null);
    setExpiresAt(null);

    try {
      const s = await createSession();
      setSid(s.sid);

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        await uploadOneToSession(s.sid, f, (p) =>
          setUploadProg((prev) => ({ ...prev, [i]: p }))
        );
      }

      const fin = await finalizeSession(s.sid);
      listenProgress(fin.jobId);

      const poll = async () => {
        for (let k = 0; k < 120; k++) {
          const st = await getStatus(s.sid);
          const url = st?.meta?.finalUrl || null;
          const exp = st?.meta?.expiresAt || null;
          if (url) {
            setDownloadUrl(url);
            setExpiresAt(exp);
            setStatus("completed");
            return;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      };
      poll().catch(() => {});
    } catch (e) {
      setStatus("failed");
      toast.error(
        e?.response?.data?.error || e.message || "Có lỗi khi ghép video"
      );
    }
  }

  async function handleDownload() {
    if (!downloadUrl) return;
    try {
      setDownloading(true);
      const res = await axiosClient.get(downloadUrl, { responseType: "blob" });
      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      let filename = `merged.${outFmt}`;
      const cd =
        res.headers["content-disposition"] ||
        res.headers["Content-Disposition"];
      if (cd) {
        const m = /filename\*?=(?:UTF-8'')?["']?([^;"']+)/i.exec(cd);
        if (m) filename = decodeURIComponent(m[1].replace(/["']/g, ""));
      }

      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      if (e?.response?.status === 404)
        toast.error("File không tồn tại, vui lòng thử lại");
      else toast.error("Tải xuống thất bại");
    } finally {
      setDownloading(false);
    }
  }

  useEffect(
    () => () => {
      if (esRef.current) esRef.current.close();
    },
    []
  );

  const expiresCountdown = useMemo(() => {
    if (!expiresAt) return "";
    const ms = Math.max(0, expiresAt - now);
    if (ms <= 0) return "Đã hết hạn";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  }, [expiresAt, now]);

  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => setMessage((m) => m), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const dragFrom = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const reorder = (arr, from, to) => {
    if (from === to || from == null || to == null) return arr;
    const a = [...arr];
    const [m] = a.splice(from, 1);
    a.splice(to, 0, m);
    return a;
  };
  const onItemDragStart = (index) => (e) => {
    dragFrom.current = index;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };
  const onItemDragOver = (index) => (e) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const onItemDrop = (index) => (e) => {
    e.preventDefault();
    const from = dragFrom.current;
    setFiles((prev) => reorder(prev, from, index));
    dragFrom.current = null;
    setDragOverIndex(null);
  };
  const onItemDragEnd = () => {
    dragFrom.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="text-3xl text-center font-semibold tracking-tight text-gray-900">
          Ghép video
        </h1>

        <div className="mt-5">
          <Stepper
            current={
              status === "completed" ? 3 : status?.startsWith("merg") ? 2 : 1
            }
          />
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-600">Chế độ ghép</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="copy">Giữ nguyên chất lượng</option>
                <option value="normalize">
                  Chuẩn hoá (đồng bộ kích thước/FPS)
                </option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm text-gray-600">
                Định dạng xuất
              </label>
              <select
                value={outFmt}
                onChange={(e) => setOutFmt(e.target.value)}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="mp4">MP4</option>
                <option value="mkv">MKV</option>
              </select>
            </div>

            <div
              className={cn(
                "flex flex-col",
                mode === "copy" && "opacity-50 pointer-events-none"
              )}
            >
              <label className="mb-1 text-sm text-gray-600">
                Độ phân giải (W×H)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={16}
                  value={width}
                  onChange={(e) =>
                    setWidth(parseInt(e.target.value || "0", 10))
                  }
                  className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  min={16}
                  value={height}
                  onChange={(e) =>
                    setHeight(parseInt(e.target.value || "0", 10))
                  }
                  className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div
              className={cn(
                "flex flex-col",
                mode === "copy" && "opacity-50 pointer-events-none"
              )}
            >
              <label className="mb-1 text-sm text-gray-600">FPS</label>
              <input
                type="number"
                min={1}
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value || "0", 10))}
                className="h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white/60 p-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition",
              dragOver
                ? "border-indigo-400 bg-indigo-50/60"
                : "border-gray-200 bg-white"
            )}
          >
            <p className="text-gray-700">Kéo video vào đây</p>
            <p className="mt-1 text-sm text-gray-500">hoặc</p>
            <button
              onClick={openPicker}
              className="mt-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Chọn tệp…
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              accept="video/*"
              onChange={(e) => onFiles(e.target.files)}
            />
            <p className="mt-3 text-xs text-gray-500">Hỗ trợ tệp lớn</p>
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Đã chọn <b>{files.length}</b> • Tổng:{" "}
                  <b>{pretty(totalSize)}</b>
                </div>
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Xoá tất cả
                </button>
              </div>

              <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
                {files.map((f, i) => {
                  const isOver = dragOverIndex === i;
                  return (
                    <li
                      key={`${f.name}-${i}`}
                      draggable
                      onDragStart={onItemDragStart(i)}
                      onDragOver={onItemDragOver(i)}
                      onDrop={onItemDrop(i)}
                      onDragEnd={onItemDragEnd}
                      className={cn(
                        "flex items-center gap-3 p-3 select-none",
                        isOver && "bg-indigo-50"
                      )}
                    >
                      <button
                        type="button"
                        className="shrink-0 h-9 w-9 grid place-items-center rounded-lg border border-gray-200 text-gray-500 cursor-grab active:cursor-grabbing"
                        title="Kéo để sắp xếp"
                      >
                        ☰
                      </button>

                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-medium text-gray-900"
                          title={f.name}
                        >
                          {f.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {pretty(f.size)}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        Xoá
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {status === "uploading" && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => (
                <div key={`up-${i}`} className="text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="truncate" title={f.name}>
                      {f.name}
                    </span>
                    <span>{uploadProg[i] || 0}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
                    <div
                      className="h-2 bg-indigo-500"
                      style={{ width: `${uploadProg[i] || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {status === "merging" && (
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-sm text-gray-700">
                <span>{message || "Đang ghép…"}</span>
                <span>{mergePercent}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded bg-gray-200">
                <div
                  className="h-3 bg-indigo-600 transition-all"
                  style={{ width: `${mergePercent}%` }}
                />
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {message || "Có lỗi xảy ra."}
            </div>
          )}

          {status === "completed" && downloadUrl && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-center justify-between">
              <span>
                Hoàn tất. Link tồn tại 5 phút
                {expiresAt ? ` • còn ${expiresCountdown}` : ""}.
              </span>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium",
                  downloading
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                )}
              >
                {downloading ? "Đang tải…" : "Tải xuống"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end">
          <button
            onClick={handleSubmit}
            disabled={!valid || uploading || status === "merging"}
            className={cn(
              "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium shadow-sm",
              !valid || uploading || status === "merging"
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            )}
          >
            {status === "uploading"
              ? "Đang tải lên…"
              : status === "merging"
              ? "Đang ghép…"
              : "Upload & Ghép"}
          </button>
        </div>
      </div>
    </div>
  );
}
