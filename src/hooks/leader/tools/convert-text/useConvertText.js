import axiosClient from "@/lib/axiosClient";
import {
  getVoiceDefault,
  getVoicesMy,
  resultGenerate,
  startGenerateTimeline,
} from "@/lib/services/toolsService";
import { useCallback, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

function useConvertText() {
  const [mode, setMode] = useState("single");
  const [voices, setVoices] = useState([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [voiceSource, setVoiceSource] = useState("default");
  const [myVoices, setMyVoices] = useState([]);
  const [loadingMyVoices, setLoadingMyVoices] = useState(false);
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
  const sseRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
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
  const [uploadSnapshot, setUploadSnapshot] = useState(null);

  const effectiveVoiceOptions = useMemo(() => {
    if (voiceSource === "cloned") {
      return myVoices.map((v) => ({
        id: v.voiceId,
        label: v.name || v.voiceId,
      }));
    }
    return voices;
  }, [voiceSource, myVoices, voices]);

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

  const refreshMyVoices = useCallback(async () => {
    try {
      setLoadingMyVoices(true);
      const res = await getVoicesMy();
      setMyVoices(res.data?.voices || []);
    } catch (e) {
      toast.error("Không tải được danh sách giọng của bạn");
    } finally {
      setLoadingMyVoices(false);
    }
  }, []);
  const handleUploadSnapshot = useCallback(
    (snap) => setUploadSnapshot(snap),
    []
  );

  const fetchDefaultVoice = () => {
    let ignore = false;
    (async () => {
      try {
        setLoadingVoices(true);
        const res = await getVoiceDefault();
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
  };
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

  const buildPayload = () => {
    if (mode === "single") {
      return {
        mode: "single",
        provider: "elevenlabs",
        voiceId: globalVoice,
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
        defaultVoiceId: globalVoice,
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
        const startRes = await startGenerateTimeline(payload);
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
              const resFinal = await resultGenerate(jobId);
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

  return {
    mode,
    voices,
    loadingVoices,
    voiceSource,
    myVoices,
    loadingMyVoices,
    globalVoice,
    modelId,
    speed,
    stability,
    similarity,
    format,
    sampleRate,
    isGenerating,
    outputUrl,
    outputMime,
    genError,
    urlRef,
    sseRef,
    isProcessing,
    progress,
    singleStyle,
    singleText,
    multiStyle,
    multiSpeakers,
    effectiveVoiceOptions,
    inheritVoice,
    canRender,
    setMode,
    setVoiceSource,
    setGlobalVoice,
    setModelId,
    resetAll,
    setSpeed,
    setStability,
    setSimilarity,
    setFormat,
    setSampleRate,
    setSingleStyle,
    setSingleText,
    setMultiStyle,
    setMultiSpeakers,
    refreshMyVoices,
    handleUploadSnapshot,
    fetchDefaultVoice,
    handleGenerate,
  };
}
export default useConvertText;
