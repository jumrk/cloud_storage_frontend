"use client";
import { uploadInChunks } from "@/lib/tool/chunkUpload";
import { useCallback, useMemo, useRef, useState } from "react";

export default function SeparateSubtitles() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState("");

  const [mode, setMode] = useState("auto");
  const [format, setFormat] = useState("srt");
  const [srcLang, setSrcLang] = useState("auto");

  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(null);

  const [result, setResult] = useState(null);
  const [downloadingIndex, setDownloadingIndex] = useState(-1);

  const startRef = useRef(null);
  const cancelCtrlRef = useRef(null);

  const sizeText = useMemo(() => (file ? formatBytes(file.size) : "—"), [file]);
  const percent = Math.max(0, Math.min(100, Math.round(progress)));
  const speedText = speed ? `${formatBytes(speed)}/s` : "";
  const etaText = eta != null ? formatETA(eta) : "";
  const hasAction = uploading || processing;

  const onPick = useCallback((f) => {
    setErr("");
    setProgress(0);
    setUploadedBytes(0);
    setSpeed(0);
    setEta(null);
    setResult(null);
    setProcessing(false);
    setFile(f);
  }, []);

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  }
  function onBrowse(e) {
    const f = e.target.files?.[0];
    if (f) onPick(f);
  }

  function cancelUpload() {
    try {
      cancelCtrlRef.current?.cancel();
    } catch {}
    setUploading(false);
  }

  function resetUI() {
    setFile(null);
    setResult(null);
    setErr("");
    setUploading(false);
    setProcessing(false);
    setProgress(0);
    setUploadedBytes(0);
    setSpeed(0);
    setEta(null);
    setDownloadingIndex(-1);
  }

  async function downloadAndCleanup(f, idx) {
    try {
      setDownloadingIndex(idx);
      const base = f.downloadUrl || f.url;
      const url = base.includes("?") ? `${base}&delete=1` : `${base}?delete=1`;
      const resp = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);

      const blob = await resp.blob();
      const cd = resp.headers.get("Content-Disposition") || "";
      const fromHeader = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd)?.[1];
      const safe = decodeURIComponent(
        fromHeader || f.name || `subtitle.${f.format || "srt"}`
      );

      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = safe;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(objUrl);
        a.remove();
      }, 0);

      resetUI();
    } catch (e) {
      setDownloadingIndex(-1);
      setErr(e.message || "Tải xuống thất bại");
    }
  }

  async function startUpload() {
    if (!file) {
      setErr("Hãy chọn một video trước.");
      return;
    }
    setErr("");
    setResult(null);
    setProcessing(false);
    setUploading(true);
    setProgress(0);
    setUploadedBytes(0);
    setSpeed(0);
    setEta(null);
    startRef.current = Date.now();

    const extraInitPayload = { mode, format, srcLang };
    const ctrl = uploadInChunks({
      file,
      initUrl: "/api/tools/sub/init",
      chunkUrl: "/api/tools/sub/chunk",
      completeUrl: "/api/tools/sub/complete",
      extraInitPayload,
      concurrency: 4,
      onStageChange: (stage) => {
        if (stage === "upload") {
          setUploading(true);
          setProcessing(false);
        }
        if (stage === "complete") {
          setUploading(false);
          setProcessing(true);
        }
      },
      onProgress: ({ sent, totalBytes, percent }) => {
        setUploadedBytes(sent);
        setProgress(percent);
        const elapsed = (Date.now() - startRef.current) / 1000;
        const spd = sent / Math.max(0.001, elapsed);
        setSpeed(spd);
        const remain = Math.max(0, totalBytes - sent);
        setEta(remain / Math.max(1, spd));
      },
    });

    cancelCtrlRef.current = ctrl;

    try {
      const outJson = await ctrl.start();
      setResult(outJson || null);
      setProcessing(false);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Upload thất bại";
      setErr(msg);
      setProcessing(false);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-3 md:px-0">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm">
          <span>💬</span> <span>TÁCH SUBTITLE</span>
        </div>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Upload video để trích phụ đề
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Hỗ trợ soft-sub (trích trực tiếp) và ASR (tạo sub từ giọng nói).
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs">
        <Step
          label="Tải lên"
          active={uploading || progress > 0}
          done={!uploading && progress === 100}
        />
        <span className="text-slate-300">—</span>
        <Step
          label="Tách phụ đề"
          active={processing}
          done={!processing && !!result}
        />
        <span className="text-slate-300">—</span>
        <Step label="Hoàn tất" active={!!result} done={false} />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-500">Chế độ</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="auto">Tự động</option>
              <option value="soft-only">Chỉ trích soft-sub</option>
              <option value="asr">ASR (tạo từ giọng nói)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Định dạng</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="srt">SRT</option>
              <option value="vtt">WebVTT</option>
              <option value="ass">ASS</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Ngôn ngữ gốc</label>
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
        </div>
      </div>

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
          <SelectedFileCard
            file={file}
            onClear={() => (!hasAction ? setFile(null) : null)}
          />
        ) : (
          <div className="text-center">
            <div className="text-5xl">📁</div>
            <div className="mt-2 font-medium text-slate-800">
              Kéo video vào đây
            </div>
            <div className="text-sm text-slate-500">hoặc</div>
            <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 cursor-pointer bg-white hover:bg-slate-50 shadow-sm">
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={onBrowse}
              />
              <span>Chọn tệp…</span>
            </label>
            <div className="mt-2 text-xs text-slate-500">Hỗ trợ tệp lớn</div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={startUpload}
          disabled={!file || uploading || processing}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-3 text-sm font-semibold shadow hover:shadow-md disabled:opacity-60"
        >
          {uploading
            ? "Đang tải chunks…"
            : processing
            ? "Đang tách phụ đề…"
            : "Upload & Tách"}
        </button>

        {uploading && (
          <button
            onClick={cancelUpload}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium hover:bg-slate-50"
          >
            Huỷ
          </button>
        )}

        <div className="text-sm text-slate-500">
          {file
            ? `${formatBytes(uploadedBytes)} / ${sizeText} • ${percent}%`
            : "Chưa chọn tệp"}
        </div>
      </div>

      {uploading && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="text-slate-700">Đang tải lên</div>
            <div className="text-slate-500">{percent}%</div>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-3">
            <span>Tốc độ: {speedText || "—"}</span>
            <span>• Còn lại: {etaText || "—"}</span>
          </div>
        </div>
      )}

      {processing && !uploading && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Spinner />
            <div>
              <div className="text-sm font-medium text-slate-800">
                Đang tách phụ đề…
              </div>
              <div className="text-xs text-slate-500">
                Giữ tab mở đến khi hoàn tất.
              </div>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-800">Hoàn tất</div>
          {Array.isArray(result.files) && result.files.length > 0 && (
            <div className="mt-3 space-y-2">
              {result.files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      title={f.name || f.label}
                    >
                      {f.label || f.name || `Subtitle ${i + 1}`}{" "}
                      {f.lang ? `• ${f.lang}` : ""}{" "}
                      {f.format ? `• ${f.format.toUpperCase()}` : ""}
                    </div>
                    {!!f.name && (
                      <div className="text-xs text-slate-500 truncate">
                        {f.name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => downloadAndCleanup(f, i)}
                    disabled={downloadingIndex === i}
                    className={
                      "rounded-lg px-3 py-1.5 text-xs font-semibold shadow " +
                      (downloadingIndex === i
                        ? "bg-slate-200 text-slate-500"
                        : "bg-blue-600 text-white hover:shadow-md")
                    }
                  >
                    {downloadingIndex === i ? "Đang tải…" : "Tải xuống"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!!err && <p className="mt-3 text-sm text-red-600">{err}</p>}
    </div>
  );
}

function Step({ label, active, done }) {
  return (
    <div
      className={
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border " +
        (done
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : active
          ? "bg-amber-50 border-amber-200 text-amber-700"
          : "bg-slate-50 border-slate-200 text-slate-500")
      }
    >
      <span className="text-xs">{done ? "✔" : active ? "●" : "○"}</span>
      <span>{label}</span>
    </div>
  );
}
function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  );
}
function SelectedFileCard({ file, onClear }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl">
          🎬
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate" title={file.name}>
            {file.name}
          </div>
          <div className="text-xs text-slate-500">
            {file.type || "video"} • {formatBytes(file.size)}
          </div>
        </div>
      </div>
      <button
        className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
        onClick={onClear}
        disabled={false}
      >
        Đổi tệp
      </button>
    </div>
  );
}
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
