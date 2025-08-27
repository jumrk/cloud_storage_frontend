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

const MAX_FILES = 10;
const MAX_FILE_SIZE = 200 * 1024 * 1024;
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || axiosClient.defaults.baseURL || "";

const cn = (...s) => s.filter(Boolean).join(" ");
const pretty = (n) => {
  if (n === 0) return "0 B";
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

function Pill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
      {children}
    </span>
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
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const [sid, setSid] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProg, setUploadProg] = useState({});
  const [uploaded, setUploaded] = useState([]);

  const [jobId, setJobId] = useState(null);
  const [mergePercent, setMergePercent] = useState(0);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [cleaned, setCleaned] = useState(false);

  const esRef = useRef(null);

  const totalSize = useMemo(
    () => files.reduce((s, f) => s + f.size, 0),
    [files]
  );
  const tooMany = files.length > MAX_FILES;
  const singleTooBig = files.some((f) => f.size > MAX_FILE_SIZE);
  const totalTooBig = totalSize > MAX_FILES * MAX_FILE_SIZE;
  const valid = files.length > 0 && !tooMany && !singleTooBig && !totalTooBig;

  const onFiles = useCallback((list) => {
    if (!list) return;
    const picked = Array.from(list).filter((f) => f.type.startsWith("video/"));
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES * 2));
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer?.files || null);
  };

  const openPicker = () => inputRef.current?.click();
  const removeAt = (i) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
  const moveUp = (i) =>
    setFiles((prev) =>
      i === 0
        ? prev
        : (() => {
            const a = [...prev];
            [a[i - 1], a[i]] = [a[i], a[i - 1]];
            return a;
          })()
    );
  const moveDown = (i) =>
    setFiles((prev) =>
      i === prev.length - 1
        ? prev
        : (() => {
            const a = [...prev];
            [a[i + 1], a[i]] = [a[i], a[i + 1]];
            return a;
          })()
    );
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
        if (evt.percent != null) setMergePercent(evt.percent);
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
      setError("Vui lòng kiểm tra lại tệp đã chọn.");
      return;
    }
    setError(null);
    setStatus("uploading");
    setUploading(true);
    setUploaded([]);
    setUploadProg({});
    setMergePercent(0);
    setDownloadUrl(null);
    setCleaned(false);

    try {
      const s = await createSession();
      setSid(s.sid);

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        await uploadOneToSession(s.sid, f, (p) =>
          setUploadProg((prev) => ({ ...prev, [i]: p }))
        );
        setUploaded((prev) => [...prev, { size: f.size, name: f.name }]);
      }

      const fin = await finalizeSession(s.sid);
      setJobId(fin.jobId);
      listenProgress(fin.jobId);

      const checkFinal = async () => {
        for (let k = 0; k < 30; k++) {
          const st = await getStatus(s.sid);
          if (st?.meta?.finalUrl) {
            setDownloadUrl(st.meta.finalUrl);
            setStatus("completed");
            return;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      };
      checkFinal().catch(() => {});
    } catch (e) {
      setStatus("failed");
      setError(
        e?.response?.data?.error ||
          e.message ||
          "Có lỗi khi tải lên/khởi tạo job"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload() {
    if (!downloadUrl || !sid) return;
    try {
      setDownloading(true);
      const url = `${downloadUrl}${
        downloadUrl.includes("?") ? "&" : "?"
      }cleanup=1`;
      const res = await axiosClient.get(url, { responseType: "blob" });
      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      let filename = "merged." + outFmt;
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

      setCleaned(true);
      setMessage("Đã tải xuống & dọn dẹp.");
    } catch (e) {
      setError("Tải xuống thất bại.");
    } finally {
      setDownloading(false);
    }
  }

  async function cancelSession() {
    if (!sid) return;
    try {
      await axiosClient.delete(`/api/tools/merge/${sid}`);
      setStatus("cancelled");
      setMessage("Đã huỷ phiên");
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {}
      }
    } catch {}
  }

  useEffect(
    () => () => {
      if (esRef.current) esRef.current.close();
    },
    []
  );

  return (
    <div className=" bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto w-full max-w-5xl px-4 ">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Pill>GHÉP VIDEO</Pill>
          {sid && <span className="text-xs text-gray-500">SID: {sid}</span>}
        </div>

        <h1 className="text-3xl text-center font-semibold tracking-tight text-gray-900">
          Upload video để ghép thành một
        </h1>
        <p className="mt-2 text-gray-600 text-center">
          Giới hạn 10 video, mỗi video ≤ 200MB. Hỗ trợ giữ nguyên chất lượng
          (stream copy) hoặc chuẩn hoá.
        </p>

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
            <img
              alt="folder"
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='gray' stroke-width='1.5'%3E%3Cpath d='M3 7h4l2 2h12v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3C/svg%3E"
              className="mb-3 opacity-70"
            />
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
                  Đã chọn <b>{files.length}</b> / {MAX_FILES} • Tổng:{" "}
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
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                      🎞️
                    </div>
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveUp(i)}
                        disabled={i === 0}
                        className={cn(
                          "rounded-lg border px-2 py-1 text-xs",
                          i === 0
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-gray-50"
                        )}
                      >
                        Lên
                      </button>
                      <button
                        onClick={() => moveDown(i)}
                        disabled={i === files.length - 1}
                        className={cn(
                          "rounded-lg border px-2 py-1 text-xs",
                          i === files.length - 1
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:bg-gray-50"
                        )}
                      >
                        Xuống
                      </button>
                      <button
                        onClick={() => removeAt(i)}
                        className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                      >
                        Xoá
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status === "uploading" && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => (
                <div key={`up-${i}`} className="text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>{f.name}</span>
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
              <div className="mt-3 flex gap-2">
                <button
                  onClick={cancelSession}
                  className="rounded-lg border px-3 py-1 text-xs hover:bg-gray-50"
                >
                  Huỷ phiên
                </button>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error || message || "Có lỗi xảy ra."}
            </div>
          )}

          {status === "completed" && downloadUrl && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 flex items-center justify-between">
              <span>
                {cleaned
                  ? "Đã sẵn sàng tải xuống (đã dọn dẹp sau khi tải)"
                  : "Hoàn tất. Bấm để tải xuống và dọn dẹp."}
              </span>
              <button
                onClick={handleDownload}
                disabled={downloading || cleaned}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium",
                  downloading || cleaned
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                )}
              >
                {downloading
                  ? "Đang tải…"
                  : cleaned
                  ? "Đã dọn dẹp"
                  : "Tải xuống"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Tip: <b>Giữ nguyên chất lượng</b> yêu cầu các clip cùng codec/kích
            thước/FPS.
          </div>
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
