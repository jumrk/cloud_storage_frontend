"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import axiosClient from "@/lib/axiosClient";
import { parseSRT, parseASS } from "@/utils/subtitle";
import SegmentTable from "./SegmentTable";

// Icons nhỏ
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
    ></path>
  </svg>
);

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toSec(v) {
  if (v == null) return null;
  return typeof v === "number" ? v : Number(v) || 0;
}
function normSpeakerId(raw) {
  if (!raw) return null;
  const m = String(raw).match(/(\d{1,3})/);
  if (m) return `NV${pad2(+m[1])}`;
  return String(raw).trim().replace(/\s+/g, "_");
}
function withIdxAndTime(arr) {
  console.log(arr);

  return arr.map((s, i) => ({
    ...s,
    idx: s.idx ?? i + 1,
    start: s.start ?? (s.startMs != null ? s.startMs / 1000 : null),
    end: s.end ?? (s.endMs != null ? s.endMs / 1000 : null),
    text: s.text ?? "",
  }));
}

export default function UploadPanel({
  voiceOptions,
  inheritVoice,
  onSnapshot,
  modelId,
  stability,
  similarity,
}) {
  const [fileInfo, setFileInfo] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [segments, setSegments] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [speakerMap, setSpeakerMap] = useState({});
  const [filterText, setFilterText] = useState("");

  // audio preview state
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const abortRef = useRef(null);
  const [loadingId, setLoadingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  const onSnapshotRef = useRef(onSnapshot);
  useEffect(() => {
    onSnapshotRef.current = onSnapshot;
  }, [onSnapshot]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const recount = useCallback(
    (segs) => {
      const c = new Map();
      for (const s of segs) {
        const sp = s.speaker || null;
        if (!sp) continue;
        c.set(sp, (c.get(sp) || 0) + 1);
      }
      const list = Array.from(c.entries()).map(([id, count]) => ({
        id,
        label: id,
        count,
      }));
      const mapOld = new Map(speakers.map((x) => [x.id, x]));
      const merged = Array.from(
        new Set([...list.map((x) => x.id), ...speakers.map((x) => x.id)])
      ).map((id) => ({
        id,
        label: mapOld.get(id)?.label || id,
        count: list.find((x) => x.id === id)?.count || 0,
      }));
      return merged;
    },
    [speakers]
  );

  const ensureAtLeastOneSpeaker = useCallback((spks) => {
    if (spks.length) return spks;
    return [{ id: "NV01", label: "NV01", count: 0 }];
  }, []);

  const applyDefaultToEmpty = useCallback(
    (id) => {
      if (!id) return;
      setSegments((prev) => {
        const next = prev.map((s) => (s.speaker ? s : { ...s, speaker: id }));
        setSpeakers(recount(next));
        return next;
      });
    },
    [recount]
  );

  // ----- Parse & normalize -----
  const normalizeASS = useCallback(
    ({ segments: ss }) => {
      const base = withIdxAndTime(ss);
      const normSegs = base.map((s) => {
        let sp = s.speaker;
        sp = normSpeakerId(sp) || null;
        return { ...s, speaker: sp };
      });
      const spks = ensureAtLeastOneSpeaker(recount(normSegs));
      setSegments(normSegs);
      setSpeakers(spks);
      setSpeakerMap({});
      setFileType("ass");
    },
    [ensureAtLeastOneSpeaker, recount]
  );

  const normalizeSRT = useCallback(
    (segs) => {
      const base = withIdxAndTime(segs);
      const normSegs = base.map((s) => ({ ...s, speaker: s.speaker || null }));
      const spks = ensureAtLeastOneSpeaker(recount(normSegs));
      setSegments(normSegs);
      setSpeakers(spks);
      setSpeakerMap({});
      setFileType("srt");
    },
    [ensureAtLeastOneSpeaker, recount]
  );

  const handleFile = async (file) => {
    setFileInfo({ name: file.name, size: file.size });
    const raw = await file.text();
    const name = file.name.toLowerCase();
    if (name.endsWith(".srt")) {
      const segs = parseSRT(raw);
      normalizeSRT(segs);
    } else if (name.endsWith(".ass")) {
      const parsed = parseASS(raw);
      normalizeASS(parsed);
    }
  };

  // ----- Preview -----
  const previewSpeaker = async (rowId, voiceId) => {
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
    } finally {
      setLoadingId(null);
    }
  };

  const previewRow = async (row) => {
    const v =
      (row.speaker && speakerMap[row.speaker]?.voiceId) ||
      inheritVoice?.id ||
      "";
    if (!v) return;
    if (playingId === row.idx && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    if (abortRef.current) abortRef.current.abort();

    setLoadingId(row.idx);
    setPlayingId(null);
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await axiosClient.post(
        "/api/tools/convert-text/generate",
        {
          mode: "single",
          provider: "elevenlabs",
          voiceId: v,
          text: row.text,
          modelId,
          voice_settings: {
            stability: Number(stability),
            similarity_boost: Number(similarity),
          },
          format: "mp3",
          sampleRate: 24000,
          speed: 1,
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
      setPlayingId(row.idx);
    } finally {
      setLoadingId(null);
    }
  };

  const updateSpeakerMap = (id, patch) => {
    setSpeakerMap((m) => ({ ...m, [id]: { ...(m[id] || {}), ...patch } }));
  };
  const addSpeaker = () => {
    const nums = speakers
      .map((s) => (s.id.match(/NV(\d{2,3})/) || [])[1])
      .filter(Boolean)
      .map(Number);
    const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
    const id = `NV${pad2(nextNum)}`;
    setSpeakers([...speakers, { id, label: id, count: 0 }]);
  };
  const removeSpeaker = (id) => {
    setSpeakers(speakers.filter((s) => s.id !== id));
    const nextSegs = segments.map((s) =>
      s.speaker === id ? { ...s, speaker: null } : s
    );
    setSegments(nextSegs);
  };
  const renameSpeaker = (id, label) => {
    setSpeakers(speakers.map((s) => (s.id === id ? { ...s, label } : s)));
  };
  const setRowSpeaker = (rowIdx, newSpeakerId) => {
    setSegments((prev) => {
      const next = prev.map((s) =>
        s.idx === rowIdx ? { ...s, speaker: newSpeakerId || null } : s
      );
      setSpeakers(recount(next));
      return next;
    });
  };

  // ----- đẩy snapshot lên Page (đã fix: luôn phản ứng khi đổi voice) -----
  const prevSnapKeyRef = useRef("");
  useEffect(() => {
    const segmentsWithVoice = segments.map((s) => ({
      ...s,
      voiceId: s.speaker ? speakerMap[s.speaker]?.voiceId || null : null,
      start: toSec(s.start),
      end: toSec(s.end),
    }));

    // fingerprint bao gồm cả voiceId/speaker/label → đổi voice là cập nhật
    const fingerprint = JSON.stringify({
      t: fileType || "",
      seg: segmentsWithVoice.map((s) => [
        s.idx,
        s.speaker || "",
        s.voiceId || "",
        s.text || "",
      ]),
      sp: speakers.map((sp) => [sp.id, sp.label || "", sp.count || 0]),
      vm: Object.entries(speakerMap)
        .map(([id, m]) => [id, m.label || "", m.voiceId || ""])
        .sort(),
    });

    if (prevSnapKeyRef.current !== fingerprint) {
      prevSnapKeyRef.current = fingerprint;
      onSnapshotRef.current?.({
        type: fileType,
        segments: segmentsWithVoice,
        speakers,
        voiceMap: speakerMap,
      });
    }
  }, [segments, speakers, speakerMap, fileType]);

  const filteredSegments = useMemo(() => {
    if (!filterText) return segments;
    const q = filterText.toLowerCase();
    return segments.filter(
      (s) =>
        (s.text || "").toLowerCase().includes(q) ||
        (s.speaker || "").toLowerCase().includes(q)
    );
  }, [segments, filterText]);

  const labelOf = (id) =>
    speakerMap[id]?.label ??
    speakers.find((s) => s.id === id)?.label ??
    id ??
    "—";

  return (
    <>
      {/* Chọn file */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-800">Tải tệp phụ đề</h3>
            <p className="text-xs text-slate-500">
              Hỗ trợ .srt / .ass • Ưu tiên Name/Actor của .ass
            </p>
          </div>
          {fileInfo && (
            <div className="text-xs text-slate-500">
              {fileInfo.name} • {(fileInfo.size / 1024).toFixed(0)} KB
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-300 cursor-pointer hover:bg-slate-50 text-slate-700">
            <input
              type="file"
              accept=".srt,.ass"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            Chọn tệp…
          </label>

          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Tìm theo text/nhân vật…"
            className="px-3 py-2 text-sm rounded-xl border border-slate-300"
          />
        </div>
      </div>

      {/* Nhân vật & giọng */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-slate-800">Nhân vật & giọng</h3>
          <div className="text-xs text-slate-500">
            Giọng mặc định:{" "}
            {inheritVoice?.label ||
              inheritVoice?.name ||
              inheritVoice?.id ||
              "—"}
          </div>
        </div>

        {!speakers.length && (
          <div className="text-sm text-slate-600 mb-2">
            Chưa có nhân vật từ file — hãy thêm nhân vật để gán giọng cho các
            dòng.
          </div>
        )}

        <div className="grid grid-cols-1 overflow-auto max-h-[560px] gap-3">
          {speakers.map((sp) => {
            const cur = speakerMap[sp.id] || {};
            const chosenId = cur.voiceId || inheritVoice?.id;
            const isLoading = loadingId === sp.id;
            const isPlaying = playingId === sp.id;
            return (
              <div
                key={sp.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={cur.label ?? sp.label}
                      onChange={(e) => {
                        renameSpeaker(sp.id, e.target.value);
                        updateSpeakerMap(sp.id, { label: e.target.value });
                      }}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      placeholder={sp.id}
                    />
                    <span className="text-xs text-slate-500">
                      ({sp.count} dòng)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-80">
                    <select
                      value={cur.voiceId || ""}
                      onChange={(e) =>
                        updateSpeakerMap(sp.id, { voiceId: e.target.value })
                      }
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
                      onClick={() => previewSpeaker(sp.id, chosenId)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
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
                    <button
                      type="button"
                      onClick={() => removeSpeaker(sp.id)}
                      className="px-2 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-rose-50"
                      title="Xoá nhân vật"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={addSpeaker}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            + Thêm nhân vật
          </button>

          {speakers.length > 0 && (
            <>
              <span className="text-sm text-slate-500">
                Gán cho dòng trống:
              </span>
              <select
                onChange={(e) => {
                  applyDefaultToEmpty(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="" disabled>
                  Chọn nhân vật…
                </option>
                {speakers.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {speakerMap[sp.id]?.label ?? sp.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Bảng thoại */}
      <div className="rounded-2xl border border-slate-200 bg-white mt-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-medium text-slate-800">Bảng thoại</h3>
          <div className="text-xs text-slate-500">{segments.length} dòng</div>
        </div>

        <SegmentTable
          segments={filteredSegments}
          speakers={speakers}
          speakerMap={speakerMap}
          onChangeRowSpeaker={setRowSpeaker}
          onPreviewRow={previewRow}
          inheritVoice={inheritVoice}
        />
      </div>
    </>
  );
}
