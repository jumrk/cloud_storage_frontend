"use client";
import { useRef, useState, useEffect } from "react";
import axiosClient from "@/lib/axiosClient";

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
const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"
    />
  </svg>
);

function SpeakerCard({
  item,
  onChange,
  onRemove,
  voiceOptions,
  inheritVoice,
  previewer,
}) {
  const selected = item.voiceId
    ? voiceOptions.find((v) => v.id === item.voiceId)
    : inheritVoice;
  const isLoading = previewer.loadingId === item.id;
  const isPlaying = previewer.playingId === item.id;

  return (
    <div className="rounded-xl border border-slate-200 p-3 bg-white">
      <div className="flex items-center justify-between">
        <input
          value={item.name}
          onChange={(e) => onChange({ ...item, name: e.target.value })}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          placeholder="Tên loa"
        />
        <button
          onClick={onRemove}
          className="px-2 py-1 text-xs rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
        >
          Xoá
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">Giọng</label>
          <div className="flex items-center gap-2">
            <select
              value={item.voiceId || ""}
              onChange={(e) => onChange({ ...item, voiceId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">— Kế thừa giọng mặc định —</option>
              {voiceOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label || v.name || v.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                previewer.preview(item.id, item.voiceId || inheritVoice?.id)
              }
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              title={isPlaying ? "Tạm dừng" : "Nghe thử"}
            >
              {isLoading ? (
                <Spinner />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {item.voiceId
              ? ""
              : `Kế thừa giọng mặc định: ${
                  selected?.label || selected?.name || selected?.id || "—"
                }`}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs text-slate-500 mb-1">
          Nội dung cho {item.name}
        </label>
        <textarea
          value={item.text}
          onChange={(e) => onChange({ ...item, text: e.target.value })}
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Nhập lời thoại…"
        />
      </div>
    </div>
  );
}

export default function MultiVoice({
  stylePrompt,
  setStylePrompt,
  speakers,
  setSpeakers,
  voiceOptions,
  inheritVoice,
  modelId,
  stability,
  similarity,
}) {
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const abortRef = useRef(null);
  const [loadingId, setLoadingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const preview = async (rowId, voiceId) => {
    if (!voiceId) return;
    if (playingId === rowId && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    if (abortRef.current) abortRef.current.abort();

    setLoadingId(rowId);
    setPlayingId(null);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await axiosClient.post(
        "/api/tools/convert-text/get-voice-elevenlabs",
        {
          id: voiceId,
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
        audioRef.current.onended = () => setPlayingId(null);
      }
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const objectUrl = URL.createObjectURL(res.data);
      urlRef.current = objectUrl;

      audioRef.current.src = objectUrl;
      await audioRef.current.play();
      setPlayingId(rowId);
    } catch {
    } finally {
      setLoadingId(null);
    }
  };

  const previewer = { loadingId, playingId, preview };

  const addSpeaker = () => {
    const nextIdx = speakers.length + 1;
    setSpeakers([
      ...speakers,
      {
        id: `speaker_${nextIdx}`,
        name: `Loa ${nextIdx}`,
        voiceId: "",
        text: "",
      },
    ]);
  };
  const update = (idx, next) => {
    const copy = speakers.slice();
    copy[idx] = next;
    setSpeakers(copy);
  };
  const remove = (idx) => {
    const copy = speakers.slice();
    copy.splice(idx, 1);
    setSpeakers(copy);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <label className="block text-xs text-slate-500 mb-1">
          Hướng dẫn phong cách
        </label>
        <input
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2"
          placeholder="Read aloud in a warm, welcoming tone"
        />
        <p className="text-xs text-slate-500 mt-1">
          Giọng mặc định:{" "}
          {inheritVoice?.label || inheritVoice?.name || inheritVoice?.id || "—"}
        </p>
      </div>

      <div className="space-y-3">
        {speakers.map((sp, i) => (
          <SpeakerCard
            key={sp.id}
            item={sp}
            onChange={(next) => update(i, next)}
            onRemove={() => remove(i)}
            voiceOptions={voiceOptions}
            inheritVoice={inheritVoice}
            previewer={previewer}
          />
        ))}
      </div>

      <div className="mt-3">
        <button
          onClick={addSpeaker}
          className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
        >
          + Thêm hộp thoại
        </button>
      </div>
    </div>
  );
}
