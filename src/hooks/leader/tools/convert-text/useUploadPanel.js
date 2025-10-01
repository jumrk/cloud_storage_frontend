import axiosClient from "@/lib/axiosClient";
import { parseSRT, parseASS } from "@/utils/subtitle";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
export function useUploadPanel(
  voiceOptions,
  inheritVoice,
  onSnapshot,
  modelId,
  stability,
  similarity
) {
  const [fileInfo, setFileInfo] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [segments, setSegments] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [speakerMap, setSpeakerMap] = useState({});
  const [filterText, setFilterText] = useState("");
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const abortRef = useRef(null);
  const [loadingId, setLoadingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const onSnapshotRef = useRef(onSnapshot);

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

  const filteredSegments = useMemo(() => {
    if (!filterText) return segments;
    const q = filterText.toLowerCase();
    return segments.filter(
      (s) =>
        (s.text || "").toLowerCase().includes(q) ||
        (s.speaker || "").toLowerCase().includes(q)
    );
  }, [segments, filterText]);

  return {
    fileInfo,
    audioRef,
    urlRef,
    abortRef,
    onSnapshotRef,
    loadingId,
    prevSnapKeyRef,
    filteredSegments,
    playingId,
    fileType,
    segments,
    speakers,
    speakerMap,
    filterText,
    setFilterText,
    toSec,
    applyDefaultToEmpty,
    handleFile,
    previewSpeaker,
    previewRow,
    updateSpeakerMap,
    addSpeaker,
    removeSpeaker,
    renameSpeaker,
    setRowSpeaker,
  };
}
