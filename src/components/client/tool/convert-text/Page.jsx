"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axiosClient from "@/lib/axiosClient";
import toast from "react-hot-toast";
import ModeTabs from "./ModeTabs";
import MultiVoice from "./MultiVoice";
import UploadPanel from "./UploadPanel";
import ControlNav from "./ControlNav";
import SingleVoice from "./SingleVoice";

export default function Convert_Text_To_Voice() {
  const [mode, setMode] = useState("single");

  // ===== default (public) voices from ElevenLabs =====
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(true);

  // ===== cloned voices (user's) =====
  const [voiceSource, setVoiceSource] = useState("default"); // "default" | "cloned"
  const [myVoices, setMyVoices] = useState([]); // server returns {voiceId,name,...}
  const [loadingMyVoices, setLoadingMyVoices] = useState(false);

  const refreshMyVoices = useCallback(async () => {
    try {
      setLoadingMyVoices(true);
      const res = await axiosClient.get("/api/tools/convert-text/voices/my");
      setMyVoices(res.data?.voices || []);
    } catch (e) {
      toast.error("Không tải được danh sách giọng của bạn");
    } finally {
      setLoadingMyVoices(false);
    }
  }, []);

  useEffect(() => {
    if (voiceSource === "cloned") refreshMyVoices();
  }, [voiceSource, refreshMyVoices]);

  // ===== Global controls =====
  const [globalVoice, setGlobalVoice] = useState("");
  const [modelId, setModelId] = useState("eleven_multilingual_v2");
  const [speed, setSpeed] = useState(1);
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [format, setFormat] = useState("wav");
  const [sampleRate, setSampleRate] = useState(24000);

  const [isGenerating, setIsGenerating] = useState(false);
  const [outputUrl, setOutputUrl] = useState("");
  const [outputMime, setOutputMime] = useState("");
  const [genError, setGenError] = useState("");
  const urlRef = useRef("");

  // Progress (upload mode) + SSE
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const sseRef = useRef(null);

  // Single / Multi data
  const [singleStyle, setSingleStyle] = useState(
    "Read aloud in a warm and friendly tone:"
  );
  const [singleText, setSingleText] = useState("");

  const [multiStyle, setMultiStyle] = useState(
    "Read aloud in a warm, welcoming tone"
  );
  const [multiSpeakers, setMultiSpeakers] = useState([
    { id: "speaker_1", name: "Loa 1", voiceId: "", text: "" },
    { id: "speaker_2", name: "Loa 2", voiceId: "", text: "" },
  ]);

  // Upload snapshot từ UploadPanel
  const [uploadSnapshot, setUploadSnapshot] = useState(null);
  const handleUploadSnapshot = useCallback(
    (snap) => setUploadSnapshot(snap),
    []
  );

  // fetch default voices once
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoadingVoices(true);
        const res = await axiosClient.get("/api/tools/convert-text/voices", {
          params: { provider: "elevenlabs" },
        });
        const list = res?.data?.voices || [];
        if (ignore) return;
        setVoices(list);
        if (!list.find((v) => v.id === globalVoice)) {
          setGlobalVoice(list[0]?.id || "");
        }
      } catch (e) {
        toast.error("Không tải được danh sách giọng mặc định");
      } finally {
        if (!ignore) setLoadingVoices(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // hiệu lực: danh sách giọng cho các panel (tuỳ theo voiceSource)
  const effectiveVoiceOptions = useMemo(() => {
    if (voiceSource === "cloned") {
      return myVoices.map((v) => ({
        id: v.voiceId,
        label: v.name || v.voiceId,
      }));
    }
    return voices;
  }, [voiceSource, myVoices, voices]);

  // giọng mặc định kế thừa cho multi/upload (phụ thuộc nguồn)
  const inheritVoice = useMemo(() => {
    if (voiceSource === "cloned") {
      const mv = myVoices.find((v) => v.voiceId === globalVoice);
      return mv ? { id: mv.voiceId, label: mv.name || mv.voiceId } : null;
    }
    return voices.find((v) => v.id === globalVoice) || null;
  }, [voiceSource, myVoices, voices, globalVoice]);

  const canRender =
    (mode === "single" && singleText.trim().length > 0) ||
    (mode === "multi" && multiSpeakers.some((s) => s.text.trim().length > 0)) ||
    (mode === "upload" && (uploadSnapshot?.segments?.length || 0) > 0);

  const voice_settings = useMemo(
    () => ({
      stability: Number(stability),
      similarity_boost: Number(similarity),
    }),
    [stability, similarity]
  );

  const resetAll = () => {
    setMode("single");
    setSingleText("");
    setMultiSpeakers([
      { id: "speaker_1", name: "Loa 1", voiceId: "", text: "" },
      { id: "speaker_2", name: "Loa 2", voiceId: "", text: "" },
    ]);
    setUploadSnapshot(null);
    if (sseRef.current) sseRef.current.close();
    setIsProcessing(false);
    setProgress(0);
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    }
    setOutputUrl("");
    setOutputMime("");
    setGenError("");
  };

  // ===== BUILD PAYLOAD =====
  const buildPayload = () => {
    if (mode === "single") {
      return {
        mode: "single",
        provider: "elevenlabs",
        voiceId: globalVoice, // có thể là default hoặc clone ID
        style: singleStyle,
        text: singleText,
        modelId,
        voice_settings,
        speed,
        format,
        sampleRate,
      };
    }

    if (mode === "multi") {
      return {
        provider: "elevenlabs",
        defaultVoiceId: globalVoice, // có thể là clone ID
        style: multiStyle,
        speakers: multiSpeakers.map((s) => ({
          id: s.id,
          name: s.name,
          voiceId: s.voiceId || null,
          text: s.text || "",
        })),
        modelId,
        voice_settings,
        speed,
        format,
        sampleRate,
      };
    }

    // ===== UPLOAD MODE =====
    const segsRaw = Array.isArray(uploadSnapshot?.segments)
      ? uploadSnapshot.segments
      : [];
    const vm = uploadSnapshot?.voiceMap || {};

    const segments = segsRaw
      .filter((s) => (s?.text || "").trim().length > 0)
      .map((s) => {
        const speaker = s?.speaker || null;
        const vFromSeg = (s?.voiceId || "").trim();
        const vFromMap = speaker ? (vm[speaker]?.voiceId || "").trim() : "";
        const finalVoiceId = vFromSeg || vFromMap;
        const startMs = Math.max(0, Math.round(Number(s.start ?? 0) * 1000));
        const endMs = Math.max(
          startMs + 1,
          Math.round(Number(s.end ?? 0) * 1000)
        );
        return { text: s.text, voiceId: finalVoiceId, startMs, endMs };
      })
      .filter(
        (x) =>
          x.voiceId &&
          x.text &&
          Number.isFinite(x.startMs) &&
          Number.isFinite(x.endMs) &&
          x.endMs > x.startMs
      );

    return {
      provider: "elevenlabs",
      modelId,
      voice_settings,
      format,
      sampleRate,
      segments,
    };
  };

  const handleGenerate = async () => {
    if (!canRender || isGenerating || isProcessing) return;
    setIsGenerating(true);
    setGenError("");
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    }
    setOutputUrl("");
    setOutputMime("");
    setProgress(0);

    try {
      const payload = buildPayload();

      // upload mode: dùng job + SSE
      if (mode === "upload") {
        const bad = (payload.segments || []).find(
          (s) =>
            !Number.isFinite(s.startMs) ||
            !Number.isFinite(s.endMs) ||
            s.endMs <= s.startMs
        );
        if (bad) {
          const msg =
            "Một số dòng thiếu hoặc sai timeline (start/end). Vui lòng kiểm tra SRT/ASS.";
          setGenError(msg);
          toast.error(msg);
          setIsGenerating(false);
          return;
        }

        setIsProcessing(true);
        const startRes = await axiosClient.post(
          "/api/tools/convert-text/generate-timeline/start",
          payload
        );
        const jobId = startRes?.data?.jobId;
        if (!jobId) {
          const m = "Không nhận được jobId";
          toast.error(m);
          throw new Error(m);
        }

        const es = new EventSource(
          `${process.env.NEXT_PUBLIC_API_BASE}/api/tools/convert-text/generate-timeline/progress?jobId=${jobId}`
        );
        sseRef.current = es;

        es.onmessage = async (ev) => {
          try {
            const data = JSON.parse(ev.data);
            setProgress(Number(data.progress || 0));
            if (data.status === "done") {
              es.close();
              const resFinal = await axiosClient.get(
                `/api/tools/convert-text/generate-timeline/result/${jobId}`,
                { responseType: "blob" }
              );
              const blob = resFinal.data;
              const url = URL.createObjectURL(blob);
              urlRef.current = url;
              setOutputUrl(url);
              setOutputMime(
                blob.type || (format === "mp3" ? "audio/mpeg" : "audio/wav")
              );
              setIsProcessing(false);
              setIsGenerating(false);
              toast.success("Hoàn tất xuất file");
            } else if (data.status === "error") {
              es.close();
              const m = data.message || "Phân tích thất bại.";
              setGenError(m);
              setIsProcessing(false);
              setIsGenerating(false);
              toast.error(m);
            }
          } catch {
            // ignore
          }
        };

        es.onerror = () => {
          es.close();
          const m = "Mất kết nối tiến trình.";
          setGenError(m);
          setIsProcessing(false);
          setIsGenerating(false);
          toast.error(m);
        };

        return;
      }

      // single & multi
      const endpoint =
        mode === "multi"
          ? "/api/tools/convert-text/generate-multi"
          : "/api/tools/convert-text/generate";

      const res = await axiosClient.post(endpoint, payload, {
        responseType: "blob",
      });
      const blob = res?.data;
      if (!(blob instanceof Blob)) {
        const m = "Phản hồi không phải audio.";
        setGenError(m);
        toast.error(m);
        return;
      }
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setOutputUrl(url);
      setOutputMime(
        blob.type || (format === "mp3" ? "audio/mpeg" : "audio/wav")
      );
      toast.success("Tạo giọng thành công");
    } catch (e) {
      let msg = "Tạo thất bại.";
      const data = e?.response?.data;
      if (data instanceof Blob) {
        try {
          msg = await data.text();
        } catch {}
      } else if (typeof data === "object" && data !== null) {
        try {
          msg = JSON.stringify(data);
        } catch {}
      } else if (data) msg = String(data);
      else if (e?.message) msg = e.message;
      setGenError(msg);
      toast.error(msg);
    } finally {
      if (mode !== "upload") setIsGenerating(false);
    }
  };

  // flag disable toàn UI
  const disabledAll = isProcessing || isGenerating;

  return (
    <div className="relative px-6 py-6">
      {/* overlay khóa UI khi đang xử lý */}
      {disabledAll && (
        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-start justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div className="font-medium text-slate-800 mb-2">
              {isProcessing ? "Đang xử lý" : "Đang tạo…"}
            </div>
            {isProcessing && (
              <div className="w-72">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-slate-600 text-right">
                  {progress}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Chuyển đổi văn bản
          </h1>
          <p className="text-sm text-slate-500">
            Chọn chế độ nhập liệu ở trên. Bên phải là thiết lập giọng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 disabled:opacity-50"
            onClick={resetAll}
            disabled={disabledAll}
          >
            Làm mới
          </button>
          <button
            disabled={!canRender || disabledAll}
            className={`px-4 py-2 rounded-xl ${
              canRender && !disabledAll
                ? "bg-slate-800 hover:bg-slate-900 text-white"
                : "bg-slate-300 text-white"
            }`}
            onClick={handleGenerate}
          >
            {isProcessing
              ? `Đang phân tích… ${progress}%`
              : isGenerating
              ? "Đang tạo…"
              : "Tạo giọng"}
          </button>
        </div>
      </div>

      <ModeTabs mode={mode} setMode={setMode} />

      <div className="grid grid-cols-12 gap-6 mt-4">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {mode === "single" && (
            <SingleVoice
              stylePrompt={singleStyle}
              setStylePrompt={setSingleStyle}
              text={singleText}
              setText={setSingleText}
            />
          )}

          {mode === "multi" && (
            <MultiVoice
              stylePrompt={multiStyle}
              setStylePrompt={setMultiStyle}
              speakers={multiSpeakers}
              setSpeakers={setMultiSpeakers}
              voiceOptions={effectiveVoiceOptions}
              inheritVoice={inheritVoice}
              modelId={modelId}
              stability={stability}
              similarity={similarity}
            />
          )}

          {mode === "upload" && (
            <UploadPanel
              voiceOptions={effectiveVoiceOptions}
              inheritVoice={inheritVoice}
              onSnapshot={handleUploadSnapshot}
              modelId={modelId}
              stability={stability}
              similarity={similarity}
            />
          )}

          {outputUrl && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-medium text-slate-800 mb-3">Kết quả</h3>
              {genError && (
                <div className="text-sm text-red-600 mb-2">{genError}</div>
              )}
              <div className="space-y-3">
                <audio src={outputUrl} controls className="w-full" />
                <div className="flex items-center gap-3">
                  <a
                    href={outputUrl}
                    download={`tts-${mode}.${
                      outputMime.includes("mpeg") ? "mp3" : "wav"
                    }`}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
                  >
                    Tải xuống
                  </a>
                  <span className="text-xs text-slate-500">
                    Định dạng:{" "}
                    {outputMime ||
                      (format === "mp3" ? "audio/mpeg" : "audio/wav")}
                  </span>
                </div>
              </div>
            </div>
          )}
          {!outputUrl && genError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
              {genError}
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <ControlNav
            globalVoice={globalVoice}
            setGlobalVoice={setGlobalVoice}
            modelId={modelId}
            setModelId={setModelId}
            speed={speed}
            setSpeed={setSpeed}
            stability={stability}
            setStability={setStability}
            similarity={similarity}
            setSimilarity={setSimilarity}
            format={format}
            setFormat={setFormat}
            sampleRate={sampleRate}
            setSampleRate={setSampleRate}
            voiceOptions={voices}
            loadingVoices={loadingVoices}
            voiceSource={voiceSource}
            setVoiceSource={setVoiceSource}
            myVoices={myVoices}
            loadingMyVoices={loadingMyVoices}
            refreshMyVoices={refreshMyVoices}
            onReset={() => {
              setModelId("eleven_multilingual_v2");
              setSpeed(1);
              setStability(0.5);
              setSimilarity(0.75);
            }}
          />
        </div>
      </div>
    </div>
  );
}
