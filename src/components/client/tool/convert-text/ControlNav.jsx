"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "@/lib/axiosClient";
import toast from "react-hot-toast";

/* ===== constants ===== */
const MAX_UPLOAD_BYTES = 11 * 1024 * 1024; // 11MB

/* ===== small helpers ===== */
function FieldHeader({ label, value }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {value != null && (
        <span className="text-xs tabular-nums text-slate-500">{value}</span>
      )}
    </div>
  );
}
function Chip({ children, tone = "default", title }) {
  const tones = {
    default: "border-slate-200 text-slate-600 bg-slate-50 ring-slate-200/60",
    emerald:
      "border-emerald-200 text-emerald-700 bg-emerald-50 ring-emerald-200/70",
    violet: "border-violet-200 text-violet-700 bg-violet-50 ring-violet-200/70",
  };
  return (
    <span
      title={title}
      className={`px-2 py-0.5 rounded-md border text-[11px] ring-1 ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
const PlayIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
    <path d="M4 3.5v13l12-6.5-12-6.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
    <path d="M5 4h4v12H5zM11 4h4v12h-4z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4">
    <path
      d="M6 6h8l-1 11H7L6 6zm7-3H7l-1 2H4v2h12V5h-2l-1-2z"
      fill="currentColor"
    />
  </svg>
);
const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"
    />
  </svg>
);
const trunc = (s = "", n = 40) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/* ===== component ===== */
export default function ControlNav({
  // global config
  globalVoice,
  setGlobalVoice,
  modelId,
  setModelId,
  speed,
  setSpeed,
  stability,
  setStability,
  similarity,
  setSimilarity,
  format,
  setFormat,
  sampleRate,
  setSampleRate,

  // default voices (ElevenLabs public)
  voiceOptions,
  loadingVoices,

  // lifted-from-parent clone source + data
  voiceSource, // "default" | "cloned"
  setVoiceSource, // from Page
  myVoices, // [{voiceId,name,...}]
  loadingMyVoices, // boolean
  refreshMyVoices, // () => Promise<void>

  onReset,
}) {
  // user-defined name for new voice (recorded or file)
  const [voiceName, setVoiceName] = useState("");

  // ======= merged options to show in <select> =======
  const allVoices = useMemo(() => {
    if (voiceSource === "default") {
      return (voiceOptions || []).map((v) => ({
        id: v.id,
        full: v.label || v.name || v.id,
        label: trunc(v.label || v.name || v.id),
      }));
    }
    return (myVoices || []).map((v) => ({
      id: v.voiceId,
      full: v.name || v.voiceId,
      label: trunc(v.name || v.voiceId),
    }));
  }, [voiceSource, voiceOptions, myVoices]);

  // when switching source, ensure globalVoice is valid
  useEffect(() => {
    if (!allVoices.length) return;
    const exists = allVoices.some((v) => v.id === globalVoice);
    if (!exists) setGlobalVoice(allVoices[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceSource, JSON.stringify(allVoices)]);

  // ===== preview =====
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const abortRef = useRef(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handlePreviewGlobalVoice = async () => {
    if (
      !globalVoice ||
      loadingVoices ||
      (voiceSource === "cloned" && loadingMyVoices)
    )
      return;

    if (isPlayingPreview && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
      return;
    }

    if (audioRef.current) audioRef.current.pause();
    if (abortRef.current) abortRef.current.abort();

    setIsLoadingPreview(true);
    setIsPlayingPreview(false);
    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await axiosClient.post(
        "/api/tools/convert-text/get-voice-elevenlabs",
        {
          id: globalVoice,
          model_id: modelId,
          voice_settings: {
            stability: Number(stability),
            similarity_boost: Number(similarity),
          },
        },
        { responseType: "blob", signal: controller.signal }
      );

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.onended = () => setIsPlayingPreview(false);
      }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const objectUrl = URL.createObjectURL(res.data);
      urlRef.current = objectUrl;
      audioRef.current.src = objectUrl;
      await audioRef.current.play();
      setIsPlayingPreview(true);
    } catch (e) {
      toast.error("Nghe thử thất bại");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // ===== delete current clone (only in cloned mode) =====
  const handleDeleteCurrent = async () => {
    if (voiceSource !== "cloned" || !globalVoice) return;
    if (!confirm("Xoá giọng này? Hành động không thể hoàn tác.")) return;
    try {
      await axiosClient.delete(
        `/api/tools/convert-text/voices/${encodeURIComponent(globalVoice)}`
      );
      toast.success("Đã xoá giọng");
      await refreshMyVoices?.();
      const left = (myVoices || []).filter((v) => v.voiceId !== globalVoice);
      if (left[0]) setGlobalVoice(left[0].voiceId);
      else {
        setVoiceSource?.("default");
        if (voiceOptions?.[0]) setGlobalVoice(voiceOptions[0].id);
      }
    } catch (e) {
      toast.error("Xoá giọng thất bại");
    }
  };

  // ===== recorder + upload =====
  const recStreamRef = useRef(null);
  const recRef = useRef(null);
  const recChunksRef = useRef([]);
  const recAudioURLRef = useRef(null);
  const [recState, setRecState] = useState("idle"); // idle | recording | paused | recorded
  const [recIsPlaying, setRecIsPlaying] = useState(false);
  const recPlayRef = useRef(null);
  const [recSecs, setRecSecs] = useState(0);
  const [uploadingClone, setUploadingClone] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recError, setRecError] = useState("");
  const recTimerRef = useRef(null);

  function clearTimer() {
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
  }
  function startTimer() {
    clearTimer();
    setRecSecs(0);
    recTimerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
  }
  function stopTimer() {
    clearTimer();
  }

  async function startRecording() {
    try {
      setRecError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recStreamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const rec = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined
      );
      recRef.current = rec;
      recChunksRef.current = [];
      rec.ondataavailable = (e) => e.data && recChunksRef.current.push(e.data);
      rec.onstop = () => {
        stopTimer();
        const blob = new Blob(recChunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        if (recAudioURLRef.current) URL.revokeObjectURL(recAudioURLRef.current);
        recAudioURLRef.current = URL.createObjectURL(blob);
        setRecState("recorded");
        setRecIsPlaying(false);
      };
      rec.start(250);
      startTimer();
      setRecState("recording");
      if (!voiceName) {
        setVoiceName(`Giọng của tôi ${new Date().toLocaleString()}`);
      }
    } catch (e) {
      setRecError("Không truy cập được micro. Kiểm tra quyền trình duyệt.");
    }
  }
  function pauseRecording() {
    try {
      recRef.current?.pause();
      setRecState("paused");
      stopTimer();
    } catch {}
  }
  function resumeRecording() {
    try {
      recRef.current?.resume();
      setRecState("recording");
      startTimer();
    } catch {}
  }
  function stopRecording() {
    try {
      recRef.current?.stop();
      recStreamRef.current?.getTracks().forEach((t) => t.stop());
      recStreamRef.current = null;
    } catch {}
  }
  useEffect(() => {
    return () => {
      try {
        recStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      if (recAudioURLRef.current) URL.revokeObjectURL(recAudioURLRef.current);
      clearTimer();
    };
  }, []);
  function togglePlayRecorded() {
    if (!recAudioURLRef.current) return;
    if (!recPlayRef.current) {
      recPlayRef.current = new Audio();
      recPlayRef.current.onended = () => setRecIsPlaying(false);
    }
    if (recIsPlaying) {
      recPlayRef.current.pause();
      setRecIsPlaying(false);
    } else {
      recPlayRef.current.src = recAudioURLRef.current;
      recPlayRef.current.play();
      setRecIsPlaying(true);
    }
  }
  async function webmToWavBlob(webmBlob) {
    const arrayBuf = await webmBlob.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuf);

    const ch = audioBuffer.numberOfChannels;
    const len = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const mono = new Float32Array(len);
    for (let c = 0; c < ch; c++) {
      const data = audioBuffer.getChannelData(c);
      for (let i = 0; i < len; i++) mono[i] += data[i] / ch;
    }

    function encodeWav(samples, sRate) {
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);
      const writeString = (off, str) => {
        for (let i = 0; i < str.length; i++)
          view.setUint8(off + i, str.charCodeAt(i));
      };
      const floatTo16 = (out, off, input) => {
        for (let i = 0; i < input.length; i++, off += 2) {
          let s = Math.max(-1, Math.min(1, input[i]));
          s = s < 0 ? s * 0x8000 : s * 0x7fff;
          out.setInt16(off, s, true);
        }
      };
      writeString(0, "RIFF");
      view.setUint32(4, 36 + samples.length * 2, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sRate, true);
      view.setUint32(28, sRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, "data");
      view.setUint32(40, samples.length * 2, true);
      floatTo16(view, 44, samples);
      return new Blob([view], { type: "audio/wav" });
    }

    const wavBlob = encodeWav(mono, sampleRate);
    ctx.close?.();
    return wavBlob;
  }
  async function handleUploadRecorded() {
    if (!recAudioURLRef.current) return;
    try {
      setUploadingClone(true);
      setUploadProgress(0);

      const webmBlob = await (await fetch(recAudioURLRef.current)).blob();
      const wavBlob = await webmToWavBlob(webmBlob);

      if (wavBlob.size > MAX_UPLOAD_BYTES) {
        toast.error(
          "Bản ghi sau chuyển WAV vượt 11MB. Hãy ghi ngắn hơn hoặc giảm chất lượng."
        );
        setUploadingClone(false);
        return;
      }

      const file = new File([wavBlob], (voiceName || "MyVoice") + ".wav", {
        type: "audio/wav",
      });
      const form = new FormData();
      form.append("file", file);
      form.append("name", voiceName || "My Voice");

      const res = await axiosClient.post(
        "/api/tools/convert-text/clone-voice",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total)
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
          },
        }
      );

      await refreshMyVoices?.();
      const newId = res.data?.voice?.voiceId;
      setVoiceSource?.("cloned");
      if (newId) setGlobalVoice(newId);
      toast.success("Đã thêm giọng từ bản ghi");

      // reset
      setRecState("idle");
      setRecIsPlaying(false);
      setRecSecs(0);
      setUploadProgress(0);
      if (recAudioURLRef.current) {
        URL.revokeObjectURL(recAudioURLRef.current);
        recAudioURLRef.current = null;
      }
    } catch (e) {
      toast.error("Upload thất bại");
    } finally {
      setUploadingClone(false);
    }
  }

  // upload file
  const fileInputRef = useRef(null);
  const openFilePicker = () => fileInputRef.current?.click();

  const handleUploadCloneFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("File > 11MB. Hãy cắt ngắn hoặc giảm chất lượng.");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("name", voiceName || file.name.replace(/\.[^/.]+$/, ""));

    setUploadingClone(true);
    setUploadProgress(0);
    try {
      const res = await axiosClient.post(
        "/api/tools/convert-text/clone-voice",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total)
              setUploadProgress(Math.round((e.loaded / e.total) * 100));
          },
        }
      );
      await refreshMyVoices?.();
      const newId = res.data?.voice?.voiceId;
      setVoiceSource?.("cloned");
      if (newId) setGlobalVoice(newId);
      toast.success("Đã thêm giọng từ file");
    } catch (err) {
      toast.error("Upload thất bại");
    } finally {
      setUploadingClone(false);
      setUploadProgress(0);
    }
  };

  /* -------- models meta -------- */
  const MODELS = [
    {
      id: "eleven_v3",
      name: "D2Mbox v3",
      desc: "Diễn cảm, 70+ ngôn ngữ. Alpha.",
      badge: { text: "Alpha", tone: "violet" },
      langs: ["Tiếng Việt", "English", "Japanese", "Korean", "Chinese", "…"],
    },
    {
      id: "eleven_flash_v2_5",
      name: "D2Mbox v2.5",
      desc: "Độ trễ thấp cho hội thoại/thời gian thực.",
      badge: { text: "Tốt nhất", tone: "emerald" },
      langs: ["Vietnamese", "English", "Japanese", "Korean", "Chinese", "…"],
    },
    {
      id: "eleven_multilingual_v2",
      name: "D2Mbox v2",
      desc: "Ổn định, nội dung dài, hỗ trợ clone.",
      badge: null,
      langs: ["English", "Japanese", "Chinese", "Korean", "Vietnamese", "…"],
    },
  ];

  const currentVoiceLabel = useMemo(() => {
    const from = allVoices.find((v) => v.id === globalVoice);
    return trunc(from?.label || from?.name || globalVoice || "—", 48);
  }, [allVoices, globalVoice]);

  const renderLangChips = (langs = [], max = 5) => {
    const shown = langs.slice(0, max);
    const more = Math.max(0, langs.length - shown.length);
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {shown.map((l) => (
          <Chip key={l}>{l}</Chip>
        ))}
        {more > 0 && <Chip title={langs.join(", ")}>+{more} nữa</Chip>}
      </div>
    );
  };
  const ModelCard = ({ m }) => {
    const selected = modelId === m.id;
    return (
      <button
        type="button"
        onClick={() => setModelId(m.id)}
        className={[
          "w-full text-left rounded-2xl border p-4 transition-all",
          "bg-white/90 backdrop-blur-sm",
          selected
            ? "border-slate-900 ring-2 ring-slate-200 shadow-sm"
            : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-slate-900">{m.name}</div>
              {m.badge && (
                <Chip tone={m.badge.tone === "emerald" ? "emerald" : "violet"}>
                  {m.badge.text}
                </Chip>
              )}
            </div>
            <p className="text-[13px] leading-5 text-slate-600 mt-1">
              {m.desc}
            </p>
            {renderLangChips(m.langs)}
          </div>
          <div
            className={[
              "shrink-0 mt-1 rounded-full border w-5 h-5 grid place-items-center",
              selected ? "bg-slate-900 border-slate-900" : "border-slate-300",
            ].join(" ")}
            aria-hidden
          >
            {selected && (
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-white">
                <path
                  d="M7.5 13.3 4.7 10.5l-1.2 1.2 4 4 9-9-1.2-1.2z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Thiết lập</h3>
        <p className="text-xs text-slate-500 mt-1">
          Chọn giọng & model. Có thể chuyển giữa giọng mặc định và giọng clone
          của bạn.
        </p>
      </div>

      <div className="space-y-6">
        {/* Source + naming + upload buttons */}
        <section className="space-y-3">
          <FieldHeader label="Kho giọng" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceSource?.("default")}
              className={[
                "px-3 py-1.5 rounded-xl border text-sm transition",
                voiceSource === "default"
                  ? "border-slate-900 text-slate-900 bg-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Mặc định
            </button>
            <button
              type="button"
              onClick={async () => {
                setVoiceSource?.("cloned");
                await refreshMyVoices?.();
              }}
              className={[
                "px-3 py-1.5 rounded-xl border text-sm transition",
                voiceSource === "cloned"
                  ? "border-slate-900 text-slate-900 bg-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Giọng của tôi
            </button>

            {voiceSource === "cloned" && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50"
                  title="Tải file audio (<= 11MB)"
                >
                  Tải file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleUploadCloneFile}
                />
              </div>
            )}
          </div>

          {voiceSource === "cloned" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-xs text-slate-600">Tên giọng</label>
                <input
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  placeholder="Ví dụ: Giọng Nam A"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-slate-200"
                />
              </div>
              {uploadingClone && (
                <div className="flex items-end">
                  <div className="w-full">
                    <div className="text-xs text-slate-600 mb-1">
                      Đang tải lên… {uploadProgress}%
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-emerald-500"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Recorder */}
        {voiceSource === "cloned" && (
          <section className="rounded-xl border border-slate-200 p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-800">
                Ghi âm trực tiếp
              </div>
              <div className="text-xs text-slate-500">
                {recState === "recording" && "Đang ghi…"}
                {recState === "paused" && "Tạm dừng"}
                {recState === "recorded" && "Đã ghi xong"}
                {recState === "idle" && "Sẵn sàng"}
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              {recState === "idle" && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  Bắt đầu ghi
                </button>
              )}
              {recState === "recording" && (
                <>
                  <button
                    type="button"
                    onClick={pauseRecording}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
                  >
                    Tạm dừng
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
                  >
                    Dừng
                  </button>
                </>
              )}
              {recState === "paused" && (
                <>
                  <button
                    type="button"
                    onClick={resumeRecording}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
                  >
                    Tiếp tục
                  </button>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
                  >
                    Dừng
                  </button>
                </>
              )}
              {recState === "recorded" && (
                <>
                  <button
                    type="button"
                    onClick={togglePlayRecorded}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
                  >
                    {recIsPlaying ? "Tạm dừng" : "Nghe lại"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecState("idle");
                      setRecIsPlaying(false);
                      if (recAudioURLRef.current) {
                        URL.revokeObjectURL(recAudioURLRef.current);
                        recAudioURLRef.current = null;
                      }
                      setRecSecs(0);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
                  >
                    Ghi lại
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadRecorded}
                    disabled={uploadingClone}
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                  >
                    {uploadingClone ? "Đang tải…" : "Lưu lên"}
                  </button>
                </>
              )}

              <div className="ml-auto text-xs text-slate-500 tabular-nums">
                {recState === "recording" ||
                recState === "paused" ||
                recState === "recorded"
                  ? `${String(Math.floor(recSecs / 60)).padStart(
                      2,
                      "0"
                    )}:${String(recSecs % 60).padStart(2, "0")}`
                  : "00:00"}
              </div>
            </div>

            {recError && (
              <div className="mt-2 text-xs text-rose-600">{recError}</div>
            )}
          </section>
        )}

        {/* Voice picker (select) + preview + delete (cloned only) */}
        <section>
          <FieldHeader label="Giọng (voice)" />
          <div className="flex items-center gap-2">
            <select
              value={globalVoice}
              onChange={(e) => setGlobalVoice(e.target.value)}
              className="w-full max-w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-slate-200 transition"
              disabled={
                loadingVoices || (voiceSource === "cloned" && loadingMyVoices)
              }
            >
              {allVoices.map((v) => (
                <option key={v.id} value={v.id} title={v.full}>
                  {v.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handlePreviewGlobalVoice}
              disabled={
                !globalVoice ||
                loadingVoices ||
                isLoadingPreview ||
                (voiceSource === "cloned" && loadingMyVoices)
              }
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-[.98] transition disabled:opacity-60"
              title={isPlayingPreview ? "Tạm dừng" : "Nghe thử"}
            >
              {isLoadingPreview ? (
                <Spinner />
              ) : isPlayingPreview ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>

            {voiceSource === "cloned" && (
              <button
                type="button"
                onClick={handleDeleteCurrent}
                disabled={!globalVoice || loadingMyVoices}
                className="px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 active:scale-[.98] transition disabled:opacity-60"
                title="Xoá giọng này"
              >
                <TrashIcon />
              </button>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Đang chọn: <span className="font-medium">{currentVoiceLabel}</span>
            {voiceSource === "cloned" && (
              <span className="ml-2">
                • Có {(myVoices || []).length} giọng đã clone
              </span>
            )}
          </div>
        </section>

        {/* Models */}
        <section>
          <FieldHeader label="Model" />
          <div className="space-y-2.5">
            {MODELS.map((m) => (
              <ModelCard key={m.id} m={m} />
            ))}
          </div>
        </section>

        {/* Sliders */}
        <section className="grid grid-cols-1 gap-5">
          <div>
            <FieldHeader label="Tốc độ" value={`${speed.toFixed(2)}×`} />
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-slate-800"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Chậm</span>
              <span>Nhanh hơn</span>
            </div>
          </div>
          <div>
            <FieldHeader label="Sự ổn định" value={stability.toFixed(2)} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={stability}
              onChange={(e) => setStability(parseFloat(e.target.value))}
              className="w-full accent-slate-800"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Biến đổi nhiều hơn</span>
              <span>Ổn định hơn</span>
            </div>
          </div>
          <div>
            <FieldHeader label="Giống nhau" value={similarity.toFixed(2)} />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={similarity}
              onChange={(e) => setSimilarity(parseFloat(e.target.value))}
              className="w-full accent-slate-800"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>Thấp</span>
              <span>Cao</span>
            </div>
          </div>
        </section>

        {/* Reset + Output */}
        <section className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-slate-700 border border-slate-300 rounded-xl px-3 py-2 hover:bg-slate-50 active:scale-[.98] transition"
          >
            Đặt lại giá trị
          </button>
        </section>

        <section className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <FieldHeader label="Định dạng" />
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-slate-200 transition"
            >
              <option value="wav">WAV</option>
              <option value="mp3">MP3</option>
            </select>
          </div>
          <div>
            <FieldHeader label="Sample rate" />
            <input
              type="number"
              step="1000"
              min="16000"
              max="48000"
              value={sampleRate}
              onChange={(e) => setSampleRate(parseInt(e.target.value || "0"))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-slate-200 transition"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
