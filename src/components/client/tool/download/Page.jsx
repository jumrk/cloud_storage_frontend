"use client";
import { useEffect } from "react";
import Image from "next/image";
import { useDownloadPage } from "@/hooks/leader/tools/download/useDownloadPage";

export default function DownloadTool({ logoList = [] }) {
  const {
    checking,
    analysis,
    mode,
    muxedId,
    videoId,
    audioId,
    downloading,
    jobId,
    status,
    url,
    err,
    copied,
    qualities,
    progress,
    isDone,
    isFail,
    handleAnalyze,
    handleDownload,
    setErr,
    setCopied,
    setMuxedId,
    setVideoId,
    setAudioId,
    setStatus,
    setUrl,
    setAnalysis,
    setMode,
  } = useDownloadPage();

  useEffect(() => {
    if (!analysis?.ok) {
      setMode("auto");
      setMuxedId("");
      setVideoId("");
      setAudioId("");
      return;
    }
    const q = analysis.meta?.qualities || { video: [], audio: [], muxed: [] };
    if (q.muxed?.length) {
      setMode("muxed");
      setMuxedId(q.muxed[0].id || "");
      setVideoId("");
      setAudioId("");
    } else if (q.video?.length || q.audio?.length) {
      setMode("pair");
      setVideoId(q.video[0]?.id || "");
      setAudioId(q.audio[0]?.id || "");
      setMuxedId("");
    } else {
      setMode("auto");
      setMuxedId("");
      setVideoId("");
      setAudioId("");
    }
  }, [analysis]);

  useEffect(() => {
    if (!jobId) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/tools/download/jobs/${jobId}`);
        const s = await r.json();
        if (!stop) {
          setStatus(s);
          if (s.state !== "completed" && s.state !== "failed")
            setTimeout(tick, 1100);
        }
      } catch {
        if (!stop) setTimeout(tick, 1500);
      }
    };
    tick();
    return () => {
      stop = true;
    };
  }, [jobId]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm">
          <span>⬇️</span> <span>CÔNG CỤ</span>
        </div>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          TẢI VIDEO{" "}
          <span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
            NHANH VÀ ỔN ĐỊNH
          </span>
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Bước 1: <b>Kiểm tra</b> — Bước 2: <b>Tải xuống</b>.
        </p>

        {!!logoList.length && (
          <div className="mt-4 flex justify-center gap-3 md:gap-4 flex-wrap">
            {logoList.map((src, i) => (
              <div
                key={i}
                className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow transition"
              >
                <Image
                  src={src}
                  alt="logo"
                  className="max-w-[70%] max-h-[70%] object-contain"
                  width={28}
                  height={28}
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,..."
                  priority
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Link video
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-10 outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400 text-slate-900"
              placeholder="https://ví dụ.com/video/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            />
            {url ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setUrl("");
                  setAnalysis(null);
                  setErr("");
                }}
                aria-label="Xoá"
              >
                ×
              </button>
            ) : null}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={checking}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white px-5 md:px-6 py-3 font-semibold shadow hover:shadow-md active:scale-[.98] transition disabled:opacity-60"
          >
            {checking ? "Đang kiểm tra..." : "Kiểm tra"}
          </button>
        </div>
        {!!err && <p className="text-sm text-red-600 mt-2">{err}</p>}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">Kết quả</h2>
          <span className="text-xs text-slate-400">
            {analysis?.site ? `Site: ${analysis.site}` : "—"}
          </span>
        </div>

        {analysis?.ok ? (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0 w-full md:w-48 aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              {analysis.meta?.thumbnail ? (
                <Image
                  src={analysis.meta.thumbnail}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                  width={192}
                  height={108}
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,..."
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                  No thumbnail
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="text-base font-semibold text-slate-800 line-clamp-2">
                {analysis.meta?.title || "-"}
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-medium">Video ID:</span>{" "}
                {analysis.meta?.id || "-"}
              </div>
              {analysis.meta?.duration_text && (
                <div className="text-sm text-slate-600">
                  <span className="font-medium">Thời lượng:</span>{" "}
                  {analysis.meta.duration_text}
                </div>
              )}

              <div className="mt-1 space-y-3">
                <div className="text-sm font-medium text-slate-800">
                  Chọn chất lượng
                </div>

                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setMode("muxed")}
                    disabled={!qualities.muxed?.length}
                    className={
                      "px-3 py-1.5 rounded-md transition " +
                      (mode === "muxed"
                        ? "bg-white shadow border text-slate-800"
                        : "text-slate-600 hover:text-slate-800") +
                      (!qualities.muxed?.length
                        ? " opacity-50 cursor-not-allowed"
                        : "")
                    }
                  >
                    Một file
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("pair")}
                    disabled={
                      !qualities.video?.length && !qualities.audio?.length
                    }
                    className={
                      "px-3 py-1.5 rounded-md transition " +
                      (mode === "pair"
                        ? "bg-white shadow border text-slate-800"
                        : "text-slate-600 hover:text-slate-800") +
                      (!qualities.video?.length && !qualities.audio?.length
                        ? " opacity-50 cursor-not-allowed"
                        : "")
                    }
                  >
                    Ghép V+A
                  </button>
                </div>

                {mode === "muxed" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
                      value={muxedId}
                      onChange={(e) => setMuxedId(e.target.value)}
                    >
                      {qualities.muxed.map((f) => (
                        <option key={`m-${f.id}`} value={f.id}>
                          {f.id} — {formatLabelShort(f)}{" "}
                          {f.ext ? ` • ${f.ext}` : ""}
                        </option>
                      ))}
                    </select>
                    {qualities.muxed.length > 0 && (
                      <SummaryChip list={qualities.muxed} currentId={muxedId} />
                    )}
                  </div>
                )}

                {mode === "pair" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <select
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
                        value={videoId}
                        onChange={(e) => setVideoId(e.target.value)}
                      >
                        {qualities.video.map((f) => (
                          <option key={`v-${f.id}`} value={f.id}>
                            {f.id} — {formatLabelShort(f)}{" "}
                            {f.ext ? ` • ${f.ext}` : ""}
                          </option>
                        ))}
                      </select>
                      <select
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
                        value={audioId}
                        onChange={(e) => setAudioId(e.target.value)}
                      >
                        {qualities.audio.map((f) => (
                          <option key={`a-${f.id}`} value={f.id}>
                            {f.id} — {formatLabelShort(f)}{" "}
                            {f.ext ? ` • ${f.ext}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Chip
                        title="Video"
                        value={formatLabelShort(
                          qualities.video.find((x) => x.id === videoId) || {}
                        )}
                      />
                      <Chip
                        title="Audio"
                        value={formatLabelShort(
                          qualities.audio.find((x) => x.id === audioId) || {}
                        )}
                      />
                    </div>
                  </div>
                )}

                {!qualities.muxed?.length &&
                  !qualities.video?.length &&
                  !qualities.audio?.length && (
                    <div className="text-xs text-slate-500">
                      ⛔ Không có danh sách chất lượng (có thể nội dung bị
                      DRM/không hỗ trợ).
                    </div>
                  )}
              </div>

              <div className="pt-1">
                <button
                  onClick={handleDownload}
                  disabled={downloading || !!jobId}
                  className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold shadow hover:shadow-md disabled:opacity-60"
                >
                  {downloading
                    ? "Đang tạo job..."
                    : jobId
                    ? "Đã tạo job"
                    : "Tải xuống"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            {analysis?.error
              ? `Không thể phân tích: ${analysis.error}`
              : "Chưa có kết quả. Hãy bấm “Kiểm tra”."}
          </div>
        )}
      </div>

      {jobId && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Tiến trình tải
            </h2>
            <span className="text-xs text-slate-400">Job ID: {jobId}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 border " +
                (isDone
                  ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                  : isFail
                  ? "border-rose-200 text-rose-700 bg-rose-50"
                  : "border-amber-200 text-amber-700 bg-amber-50")
              }
            >
              <span className="text-xs">●</span>
              {isDone
                ? "Hoàn tất"
                : isFail
                ? "Thất bại"
                : status.state || "đang xử lý"}
            </span>
            {!isDone && !isFail && (
              <span className="text-slate-500">— {progress}%</span>
            )}
          </div>

          {!isDone && !isFail && (
            <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {isDone && status.result?.fileUrl ? (
            <div className="mt-4 text-sm">
              <div className="text-slate-700 break-all">
                <span className="font-medium text-slate-800">File:</span>{" "}
                <a
                  className="text-blue-600 underline"
                  href={status.result.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {status.result.fileUrl}
                </a>
              </div>
              <div className="flex gap-2 pt-2">
                <a
                  href={status.result.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold shadow hover:shadow-md"
                >
                  Mở / Tải xuống
                </a>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        status.result.fileUrl
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1200);
                    } catch {}
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  {copied ? "Đã copy" : "Copy link"}
                </button>
              </div>
            </div>
          ) : null}

          {isFail && (
            <div className="mt-2 text-sm text-red-600">
              Lỗi: {status.failedReason || "Không rõ nguyên nhân"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ title, value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 bg-slate-50">
      <span className="font-semibold">{title}:</span> {value}
    </span>
  );
}

function SummaryChip({ list = [], currentId }) {
  const f = list.find((x) => x.id === currentId);
  if (!f) return null;
  return (
    <span className="inline-flex items-center justify-start rounded-lg border border-slate-200 px-3 py-2 text-xs md:text-sm text-slate-700 bg-slate-50">
      <span className="font-semibold mr-2">Tóm tắt:</span>
      {formatLabelShort(f)} {f.ext ? ` • ${f.ext}` : ""}
    </span>
  );
}

function formatLabelShort(f) {
  const bits = [];
  if (f.height) bits.push(`${f.height}p`);
  if (f.fps) bits.push(`${f.fps}fps`);
  if (f.vcodec && f.vcodec !== "none") bits.push(f.vcodec);
  if (f.acodec && f.acodec !== "none") bits.push(f.acodec);
  if (f.size_text) bits.push(f.size_text);
  return bits.join(" • ");
}
