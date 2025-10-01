import axiosClient from "@/lib/axiosClient";
import {
  createCloneVoice,
  deleteMyVoice,
  getVoiceElevenlabs,
} from "@/lib/services/toolsService";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

function useControlNav(
  globalVoice,
  setGlobalVoice,
  modelId,
  stability,
  similarity,
  voiceOptions,
  loadingVoices,
  voiceSource,
  setVoiceSource,
  myVoices,
  loadingMyVoices,
  refreshMyVoices
) {
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
  const MAX_UPLOAD_BYTES = 11 * 1024 * 1024;
  const [voiceName, setVoiceName] = useState("");
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const abortRef = useRef(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const recStreamRef = useRef(null);
  const recRef = useRef(null);
  const recChunksRef = useRef([]);
  const recAudioURLRef = useRef(null);
  const recPlayRef = useRef(null);
  const recTimerRef = useRef(null);
  const [recState, setRecState] = useState("idle");
  const [recIsPlaying, setRecIsPlaying] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [uploadingClone, setUploadingClone] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recError, setRecError] = useState("");
  const fileInputRef = useRef(null);

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

      const res = await getVoiceElevenlabs(
        globalVoice,
        modelId,
        stability,
        similarity,
        controller
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
  const handleDeleteCurrent = async () => {
    if (voiceSource !== "cloned" || !globalVoice) return;
    if (!confirm("Xoá giọng này? Hành động không thể hoàn tác.")) return;
    try {
      await deleteMyVoice(globalVoice);
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
      console.log(e);
    }
  };
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
      const res = await createCloneVoice(form, setUploadProgress);
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
  return {
    voiceName,
    audioRef,
    urlRef,
    abortRef,
    isLoadingPreview,
    isPlayingPreview,
    recStreamRef,
    recAudioURLRef,
    recState,
    recIsPlaying,
    recSecs,
    uploadingClone,
    uploadProgress,
    recError,
    fileInputRef,
    MODELS,
    setVoiceName,
    openFilePicker,
    handlePreviewGlobalVoice,
    handleDeleteCurrent,
    setRecState,
    setRecIsPlaying,
    handleUploadCloneFile,
    setRecSecs,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearTimer,
    togglePlayRecorded,
    handleUploadRecorded,
  };
}
export default useControlNav;
