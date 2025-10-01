import { useMemo, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import { AnalyzeDownload, HandleDownload } from "@/lib/services/toolsService";

export function useDownloadPage() {
  const [url, setUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [mode, setMode] = useState("auto");
  const [muxedId, setMuxedId] = useState("");
  const [videoId, setVideoId] = useState("");
  const [audioId, setAudioId] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState({
    state: "idle",
    progress: 0,
    result: null,
    failedReason: null,
  });
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const qualities = useMemo(
    () => analysis?.meta?.qualities || { video: [], audio: [], muxed: [] },
    [analysis]
  );
  const progress = Math.max(0, Math.min(100, Math.round(status.progress || 0)));
  const isDone = status.state === "completed";
  const isFail = status.state === "failed";
  function buildFormat() {
    const q = analysis?.meta?.qualities || { video: [], audio: [], muxed: [] };
    if (mode === "muxed") {
      const id = muxedId || (q.muxed?.[0]?.id ?? "");
      return id || null;
    }
    if (mode === "pair") {
      const v = videoId || (q.video?.[0]?.id ?? "");
      const a = audioId || (q.audio?.[0]?.id ?? "");
      return v && a ? `${v}+${a}` : null;
    }
    return null;
  }

  async function handleAnalyze() {
    setErr("");
    setAnalysis(null);
    setJobId(null);
    setStatus({ state: "idle", progress: 0, result: null, failedReason: null });
    const link = url.trim();
    if (!/^https?:\/\//i.test(link)) {
      setErr("Link chưa hợp lệ. Hãy nhập link bắt đầu bằng http(s)://");
      return;
    }
    try {
      setChecking(true);
      const { data } = await AnalyzeDownload(link);
      setAnalysis(data);
    } catch (e) {
      setAnalysis(e?.response?.data || { error: "Analyze failed" });
      setErr(e?.response?.data?.error || e.message || "Có lỗi khi phân tích");
    } finally {
      setChecking(false);
    }
  }

  async function handleDownload() {
    if (!analysis?.ok) return;
    try {
      setDownloading(true);
      const format = buildFormat();
      const { data } = await HandleDownload(url, format);
      setJobId(data.jobId);
      setStatus({
        state: "queued",
        progress: 0,
        result: null,
        failedReason: null,
      });
    } catch (e) {
      setErr(
        e?.response?.data?.error || e.message || "Không tạo được job tải xuống"
      );
    } finally {
      setDownloading(false);
    }
  }
  return {
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
  };
}
