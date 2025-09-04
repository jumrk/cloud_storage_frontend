"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "@/lib/axiosClient";

export default function TranslateSubtitles() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [srcLang, setSrcLang] = useState("auto");
  const [dstLang, setDstLang] = useState("vi");

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(null);

  const [result, setResult] = useState(null);
  const [serverSteps, setServerSteps] = useState(null);
  const [err, setErr] = useState("");
  const [downloading, setDownloading] = useState(false);

  const startAt = useRef(0);
  const uploadIdRef = useRef(null);
  const pollTimer = useRef(null);

  const percent = Math.max(0, Math.min(100, Math.round(progress)));
  const sizeText = useMemo(() => (file ? formatBytes(file.size) : "—"), [file]);

  useEffect(
    () => () => pollTimer.current && clearInterval(pollTimer.current),
    []
  );

  function onBrowse(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    resetStates();
  }
  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    setFile(f);
    resetStates();
  }
  function resetStates() {
    setErr("");
    setProgress(0);
    setUploaded(0);
    setSpeed(0);
    setEta(null);
    setResult(null);
    setServerSteps(null);
  }

  async function startUpload() {
    try {
      if (!file) return setErr("Hãy chọn tệp phụ đề trước.");
      setErr("");
      setUploading(true);
      setProcessing(false);
      startAt.current = Date.now();

      // 1) INIT (axiosClient)
      const { data: initJson } = await axiosClient.post(
        "/api/tools/subtrans/init",
        {
          filename: file.name,
          size: file.size,
          mime: file.type || "",
          srcLang,
          dstLang,
        }
      );
      uploadIdRef.current = initJson.uploadId;
      if (initJson.steps) setServerSteps(initJson.steps);

      const chunkSize =
        Number(initJson.recommendedChunkSize) > 0
          ? Number(initJson.recommendedChunkSize)
          : 1024 * 1024;
      const total = Math.ceil(file.size / chunkSize);

      for (let i = 0; i < total; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const slice = file.slice(start, end);

        const fd = new FormData();
        fd.append("uploadId", uploadIdRef.current);
        fd.append("index", String(i));
        fd.append("total", String(total));
        fd.append("chunk", slice, `${i}.part`);

        await axiosClient.post("/api/tools/subtrans/chunk", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // progress
        const sent = end;
        setUploaded(sent);
        setProgress(((i + 1) / total) * 100);
        const elapsed = (Date.now() - startAt.current) / 1000;
        const spd = sent / Math.max(0.001, elapsed);
        setSpeed(spd);
        const remain = Math.max(0, file.size - sent);
        setEta(remain / Math.max(1, spd));
      }

      setUploading(false);
      setProcessing(true);

      // Poll trạng thái từ server (tùy chọn)
      if (uploadIdRef.current) {
        pollTimer.current = setInterval(async () => {
          try {
            const { data: j } = await axiosClient.get(
              "/api/tools/subtrans/status",
              {
                params: { uploadId: uploadIdRef.current },
              }
            );
            setServerSteps(j);
            if (j.status === "done" || String(j.status).startsWith("error_")) {
              clearInterval(pollTimer.current);
              pollTimer.current = null;
            }
          } catch {}
        }, 800);
      }

      // 3) COMPLETE (axiosClient)
      const { data: cJson } = await axiosClient.post(
        "/api/tools/subtrans/complete",
        {
          uploadId: uploadIdRef.current,
          srcLang,
          dstLang,
        }
      );
      setResult(cJson);
      if (cJson.steps) setServerSteps(cJson.steps);
      setProcessing(false);
    } catch (e) {
      setUploading(false);
      setProcessing(false);
      setErr(apiErr(e));
    }
  }

  async function downloadAndCleanup() {
    try {
      if (!result?.files?.[0]) return;
      setDownloading(true);
      const f = result.files[0];

      // build URL kèm delete=1
      const base = f.downloadUrl || f.url;
      const url = base.includes("?") ? `${base}&delete=1` : `${base}?delete=1`;

      // tải bằng axiosClient (override withCredentials để tránh CORS cookie nếu cần)
      const { data: blob, headers } = await axiosClient.get(url, {
        responseType: "blob",
        withCredentials: false,
      });

      const cd = headers?.["content-disposition"] || "";
      const fromHeader = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd)?.[1];
      const name = decodeURIComponent(fromHeader || f.name || `subtitle.srt`);

      const obj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = obj;
      a.download = name;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(obj);
        a.remove();
      }, 0);

      // reset
      setFile(null);
      setResult(null);
      setServerSteps(null);
      setErr("");
      setProgress(0);
      setUploaded(0);
      setSpeed(0);
      setEta(null);
      setDownloading(false);
    } catch (e) {
      setDownloading(false);
      setErr(apiErr(e) || "Tải xuống thất bại.");
    }
  }

  // Ưu tiên trạng thái từ server
  const stepStates = useMemo(() => {
    if (serverSteps?.steps) {
      const m = Object.fromEntries(
        serverSteps.steps.map((s) => [s.key, s.state])
      );
      return {
        upload: m.upload || "idle",
        translate: m.translate || "idle",
        done: m.done || "idle",
      };
    }
    if (err) return { upload: "error", translate: "error", done: "error" };
    if (result?.files?.length)
      return { upload: "success", translate: "success", done: "success" };
    if (processing)
      return { upload: "success", translate: "running", done: "idle" };
    if (uploading)
      return { upload: "running", translate: "idle", done: "idle" };
    return { upload: "idle", translate: "idle", done: "idle" };
  }, [serverSteps, err, result, processing, uploading]);

  return (
    <div className="w-full max-w-3xl mx-auto px-3 md:px-0">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm">
          <span>💬</span>
          <span>DỊCH SUBTITLE</span>
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900">
          Tải tệp phụ đề để dịch
        </h1>
        <p className="mt-2 text-slate-600">
          Hỗ trợ <b>SRT</b>, <b>ASS/SSA</b>, <b>VTT</b>. Giữ nguyên timecode &
          định dạng.
        </p>
        <StepPills states={stepStates} />
      </div>

      {/* Chọn ngôn ngữ */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500">Ngôn ngữ nguồn</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
            value={srcLang}
            onChange={(e) => setSrcLang(e.target.value)}
          >
            <option value="auto">Tự động</option>
            <option value="vi">Tiếng Việt</option>
            <option value="en">Tiếng Anh</option>
            <option value="zh">Tiếng Trung</option>
            <option value="ja">Tiếng Nhật</option>
            <option value="ko">Tiếng Hàn</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500">Dịch sang</label>
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
            value={dstLang}
            onChange={(e) => setDstLang(e.target.value)}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">Tiếng Anh</option>
            <option value="zh">Tiếng Trung</option>
            <option value="ja">Tiếng Nhật</option>
            <option value="ko">Tiếng Hàn</option>
          </select>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={
          "mt-5 rounded-2xl border-2 border-dashed bg-white p-8 transition shadow-sm " +
          (dragOver
            ? "border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-100"
            : "border-slate-200")
        }
      >
        {file ? (
          <SelectedFile file={file} onClear={() => setFile(null)} />
        ) : (
          <div className="text-center">
            <div className="text-5xl">📄</div>
            <div className="mt-2 font-medium text-slate-800">
              Kéo thả tệp phụ đề (.srt, .ass/.ssa, .vtt)
            </div>
            <div className="text-sm text-slate-500">hoặc</div>
            <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 cursor-pointer bg-white hover:bg-slate-50 shadow-sm">
              <input
                type="file"
                accept=".srt,.ass,.ssa,.vtt"
                className="hidden"
                onChange={onBrowse}
              />
              <span>Chọn tệp…</span>
            </label>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={startUpload}
          disabled={!file || uploading || processing}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-3 text-sm font-semibold shadow hover:shadow-md disabled:opacity-60"
        >
          {uploading
            ? "Đang tải lên…"
            : processing
            ? "Đang dịch…"
            : "Upload & Dịch"}
        </button>

        <div className="text-sm text-slate-500">
          {file
            ? `${formatBytes(uploaded)} / ${sizeText} • ${percent}%`
            : "Chưa chọn tệp"}
        </div>
      </div>

      {/* Progress */}
      {(uploading || processing) && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="text-slate-700">
              {uploading ? "Đang tải lên" : "Đang dịch"}
            </div>
            <div className="text-slate-500">
              {uploading ? `${percent}%` : serverSteps?.status || "…"}
            </div>
          </div>
          {uploading && (
            <>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 topurple-600 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-3">
                <span>Tốc độ: {speed ? `${formatBytes(speed)}/s` : "—"}</span>
                <span>• Còn lại: {eta != null ? formatETA(eta) : "—"}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Result */}
      {result?.files?.[0] && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-800">Hoàn tất</div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {result.files[0].name}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {result.files[0].label || "Subtitle"} •{" "}
                {result.files[0].format?.toUpperCase() || "SRT"}
              </div>
            </div>
            <button
              onClick={downloadAndCleanup}
              disabled={downloading}
              className={
                "rounded-lg px-3 py-1.5 text-xs font-semibold shadow " +
                (downloading
                  ? "bg-slate-200 text-slate-500"
                  : "bg-emerald-600 text-white hover:shadow-md")
              }
            >
              {downloading ? "Đang tải…" : "Tải xuống & dọn dẹp"}
            </button>
          </div>
        </div>
      )}

      {!!err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
    </div>
  );
}

/* ====== UI bits ====== */
function StepPills({ states }) {
  const items = [
    { key: "upload", title: "Tải lên" },
    { key: "translate", title: "Dịch" },
    { key: "done", title: "Hoàn tất" },
  ];
  return (
    <div className="mt-4 flex items-center justify-center gap-2 text-sm">
      {items.map((it, idx) => (
        <div key={it.key} className="flex items-center gap-2">
          <StatusPill title={it.title} state={states[it.key]} />
          {idx < items.length - 1 && <span className="text-slate-300">—</span>}
        </div>
      ))}
    </div>
  );
}
function StatusPill({ title, state }) {
  const map = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    running: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    idle: "bg-slate-50 text-slate-600 border-slate-200",
  };
  const dot = { success: "✓", running: "•", error: "!", idle: "○" };
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
        map[state] || map.idle
      }`}
    >
      <span className="font-bold">{dot[state] || dot.idle}</span>
      <span>{title}</span>
    </span>
  );
}
function SelectedFile({ file, onClear }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl">
          📄
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate" title={file.name}>
            {file.name}
          </div>
          <div className="text-xs text-slate-500">
            {file.type || "text"} • {formatBytes(file.size)}
          </div>
        </div>
      </div>
      <button
        className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        onClick={onClear}
      >
        Đổi tệp
      </button>
    </div>
  );
}

/* ====== utils ====== */
function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(bytes >= 1024 ? 2 : 0)} ${units[i]}`;
}
function formatETA(sec) {
  const s = Math.ceil(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}
function apiErr(e) {
  return e?.response?.data?.error || e?.message || "Lỗi không xác định";
}
