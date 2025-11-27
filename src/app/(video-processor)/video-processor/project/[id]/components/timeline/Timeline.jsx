"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import axiosClient from "@/shared/lib/axiosClient";
import { useTimeline } from "../../context/TimelineContext";
import { useProject, useStage, useSelection, useSubtitle } from "../../context";
import { useVoiceLoadingMaybe } from "../../context/VoiceLoadingContext";
import TransportBar from "./header/TransportBar";
import ZoomControls from "./header/ZoomControls";
import TrackLane from "./tracks/TrackLane";
import TracksViewport from "./viewport/TracksViewport";
import VideoClip from "./clips/VideoClip";
import ImageClip from "./clips/ImageClip";
import AudioClip from "./clips/AudioClip";
import TextClip from "./clips/TextClip";
import ToolsBar from "./header/ToolsBar";
import SpinnerSurface from "./ui/SpinnerSurface";
import { EmptyDropSurface } from "./ui/EmptyDropSurface";
import { DropWithTimeline } from "./ui/DropWithTimeline";

const MTrackLane = React.memo(TrackLane);
const MVideoClip = React.memo(VideoClip);
const MImageClip = React.memo(ImageClip);
const MAudioClip = React.memo(AudioClip);
const MTextClip = React.memo(TextClip);

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function rid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function packRows(clips) {
  const sorted = [...clips].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  const endTimes = [];
  const withRow = [];
  for (const c of sorted) {
    const s = Number(c.start) || 0;
    const e = s + (Number(c.duration) || 0);
    let row = 0;
    while (row < endTimes.length && s < endTimes[row] - 1e-6) row++;
    if (row === endTimes.length) endTimes.push(e);
    else endTimes[row] = e;
    withRow.push({ ...c, __row: row });
  }
  return { withRow, rowsCount: endTimes.length };
}
function packVideo(videoArr) {
  let run = 0;
  return videoArr.map((c) => {
    const out = { ...c, start: run };
    run += Number(c.duration) || 0;
    return out;
  });
}

const ToolsBarWithPlayhead = React.memo(function ToolsBarWithPlayhead({
  selected,
  selectedClips,
  clips,
  fps,
  onSplitAt,
  onDelete,
}) {
  const { currentTime } = useTimeline();
  const canSplit = useMemo(() => {
    if (!selected) return false;
    const lane = selected.lane;
    const list = lane === "video" ? clips.video : clips[lane] || [];
    const c = list.find((x) => x.id === selected.id);
    if (!c) return false;
    const s = Number(c.start) || 0;
    const e = s + (Number(c.duration) || 0);
    const eps = 1 / Math.max(1, fps);
    return currentTime > s + eps && currentTime < e - eps;
  }, [selected, clips, fps, currentTime]);

  const handleSplit = useCallback(() => {
    if (!selected) return;
    onSplitAt(selected.lane, selected.id, currentTime);
  }, [selected, onSplitAt, currentTime]);

  const hasSelection = selected || (selectedClips && selectedClips.size > 0);

  const handleDelete = useCallback(() => {
    if (hasSelection) {
      onDelete();
    }
  }, [hasSelection, onDelete]);

  return (
    <ToolsBar
      onSplit={handleSplit}
      onDelete={handleDelete}
      disabledSplit={!canSplit}
      disabledDelete={!hasSelection}
    />
  );
});
function sanitizeText(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export default function Timeline() {
  const project = useProject();
  const stage = useStage();
  const selection = useSelection();
  const subtitle = useSubtitle();
  const voiceLoading = useVoiceLoadingMaybe();

  const { updateDataProject } = project;

  const { projectId, fps: fpsProp = 30, lengthSec: lengthProp = 60 } = project;
  const { handleStageVisualsChange } = stage;
  const { setSelectedClip } = selection;
  const { subtitleStyle } = subtitle;

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

  const {
    duration: ctxDuration,
    setDuration: setCtxDuration,
    currentTime: ctxTime,
    setCurrentTime,
    playing,
  } = useTimeline();

  const [clips, setClips] = useState({ video: [], audio: [], text: [] });
  const clipsRef = useRef(clips);

  const [fps, setFps] = useState(fpsProp);
  const [lengthSec, setLengthSec] = useState(lengthProp);
  const [rev, setRev] = useState(0);
  const [loading, setLoading] = useState(true);
  const serverRevRef = useRef(0);
  useEffect(() => {
    serverRevRef.current = rev;
  }, [rev]);

  const [filmstripCache, setFilmstripCache] = useState({});
  const [audioWaveCache, setAudioWaveCache] = useState({});
  const externalAudioSrcRef = useRef(new Map());
  const decodeCtxRef = useRef(null);
  const pendingFetch = useRef(new Set());
  useEffect(() => {
    return () => {
      externalAudioSrcRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      externalAudioSrcRef.current.clear();
    };
  }, []);

  const saveTimer = useRef(null);
  const savingRef = useRef(false);

  const [selected, setSelected] = useState(null);
  const [selectedClips, setSelectedClips] = useState(new Set()); // Multiple selection support
  const [selectionBox, setSelectionBox] = useState(null); // { startX, startY, endX, endY }

  const frameUrlAtCache = useRef(new Map());
  const thumbUrlCache = useRef(new Map());

  const selectClip = useCallback(
    (lane, clip, addToSelection = false) => {
      if (addToSelection && selectedClips.size > 0) {
        // Add to existing selection
        const clipKey = `${lane}:${clip.id}`;
        const newSelected = new Set(selectedClips);
        if (newSelected.has(clipKey)) {
          newSelected.delete(clipKey);
        } else {
          newSelected.add(clipKey);
        }
        setSelectedClips(newSelected);
        
        // Update single selected for backward compatibility
        if (newSelected.size === 1) {
          const [laneId, clipId] = Array.from(newSelected)[0].split(':');
          const clipList = clips[laneId] || [];
          const foundClip = clipList.find(c => c.id === clipId);
          if (foundClip) {
            setSelected({ lane: laneId, id: clipId });
            setSelectedClip({ lane: laneId, clip: foundClip });
          }
        } else {
          setSelected(null);
          setSelectedClip(null);
        }
      } else {
        // Single selection
        setSelected({ lane, id: clip.id });
        setSelectedClip({ lane, clip });
        setSelectedClips(new Set([`${lane}:${clip.id}`]));
      }
    },
    [setSelectedClip, selectedClips, clips]
  );

  const getFrameUrlAtFn = useCallback(
    (assetId) => {
      if (!assetId) return null;
      const m = frameUrlAtCache.current;
      if (m.has(assetId)) return m.get(assetId);
      const fn = (t, h = 64) =>
        `${API_BASE}/api/video-processor/assets/${assetId}/frame?at=${encodeURIComponent(
          t
        )}&h=${encodeURIComponent(h)}`;
      m.set(assetId, fn);
      return fn;
    },
    [API_BASE]
  );

  const getThumbUrlFn = useCallback(
    (assetId) => {
      if (!assetId) return null;
      const m = thumbUrlCache.current;
      if (m.has(assetId)) return m.get(assetId);
      const fn = (h = 64) =>
        `${API_BASE}/api/video-processor/assets/${assetId}/thumb?h=${encodeURIComponent(
          h
        )}`;
      m.set(assetId, fn);
      return fn;
    },
    [API_BASE]
  );

  useEffect(() => {
    if (selected) {
      const list = clips[selected.lane] || [];
      if (!list.some((c) => c.id === selected.id)) {
        setSelected(null);
        setSelectedClip(null);
        setSelectedClips(new Set());
      }
    }
    
    // Clean up selectedClips if clips are deleted
    const validKeys = new Set();
    Object.keys(clips).forEach(lane => {
      (clips[lane] || []).forEach(clip => {
        validKeys.add(`${lane}:${clip.id}`);
      });
    });
    
    setSelectedClips(prev => {
      const filtered = new Set();
      prev.forEach(key => {
        if (validKeys.has(key)) {
          filtered.add(key);
        }
      });
      return filtered.size !== prev.size ? filtered : prev;
    });
  }, [clips, selected, setSelectedClip]);

  useEffect(() => {
    if (!projectId) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get(
          `/api/video-processor/project/${projectId}/timeline`
        );
        const tl = data?.timeline || {};
        const allClips = Array.isArray(tl.tracks)
          ? tl.tracks.flatMap((t) => (Array.isArray(t.clips) ? t.clips : []))
          : [];
        const next = { video: [], audio: [], text: [] };
        for (const c of allClips) {
          const v = Number.isFinite(Number(c.volume)) ? Number(c.volume) : 1;
          const base = {
            id: String(c.id || c._id || rid()),
            type: c.type || "video",
            name: c.label || c.name || "Clip",
            start: Number(c.start ?? c.startSec ?? 0),
            duration: Number(c.durationSec ?? 0),
            assetId: c.assetId || null,
            volume: clamp(v, 0, 1),
            useAudio: c.useAudio !== false,
            text: typeof c.text === "string" ? c.text : undefined,
            lang: c.lang,
            srcInSec:
              Number(
                c.srcInSec ??
                  c.trimStartSec ??
                  c.inSec ??
                  c.in ??
                  c.offsetSec ??
                  c.sourceStartSec ??
                  0
              ) || 0,
            streamUrl: typeof c.url === "string" ? c.url : null,
            url: typeof c.url === "string" ? c.url : null,
            cover: c.cover || null,
            artist: c.artist || null,
            source: c.source || null,
          };
          if (base.type === "audio") {
            next.audio.push({
              ...base,
              speed: Number.isFinite(Number(c.speed)) ? Number(c.speed) : 1,
              voiceSpeed:
                c.voiceSpeed !== undefined ? Number(c.voiceSpeed) : undefined,
              voiceStability:
                c.voiceStability !== undefined ? c.voiceStability : null,
              subtitleClipId: c.subtitleClipId ? String(c.subtitleClipId) : null,
            });
          } else if (base.type === "text" || base.type === "subtitle") {
            const clean = sanitizeText(c.text ?? c.label ?? c.name);
            next.text.push({
              ...base,
              type: "subtitle",
              text: clean,
              name: clean,
              voiceId: c.voiceId || null,
              voiceModelId: c.voiceModelId || null,
              voiceSpeed: c.voiceSpeed !== undefined ? c.voiceSpeed : null,
              voiceStability: c.voiceStability !== undefined ? c.voiceStability : null,
              voiceSimilarity: c.voiceSimilarity !== undefined ? c.voiceSimilarity : null,
              voiceStyleExaggeration: c.voiceStyleExaggeration !== undefined ? c.voiceStyleExaggeration : null,
              voiceSpeakerBoost: c.voiceSpeakerBoost !== undefined ? c.voiceSpeakerBoost : null,
            });
          } else next.video.push(base);
        }
        if (next.audio.length && next.text.length) {
          const enrichedAudio = next.audio.map((audioClip) => {
            if (audioClip.subtitleClipId) return audioClip;
            const match = next.text.find(
              (textClip) =>
                Math.abs((textClip.start || 0) - (audioClip.start || 0)) <
                  0.05 &&
                Math.abs((textClip.duration || 0) - (audioClip.duration || 0)) <
                  0.1
            );
            if (match) {
              return { ...audioClip, subtitleClipId: match.id };
            }
            return audioClip;
          });
          next.audio = enrichedAudio;
        }

        setClips(next);
        setFps(Number(tl.fps || data?.fps || fpsProp) || 30);
        const guessed = guessTotalDuration(next) || lengthProp;
        setLengthSec(Number(data?.durationSec) || guessed);
        const newRev = Number(tl.rev || data?.rev || 0);
        setRev(newRev);
        serverRevRef.current = newRev;
      } catch {
        setClips({ video: [], audio: [], text: [] });
        setFps(fpsProp);
        setLengthSec(lengthProp);
        setRev(0);
        serverRevRef.current = 0;
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, fpsProp, lengthProp]);

  useEffect(() => {
    const handleUpdateClips = (e) => {
      const {
        lane,
        clips: updatedClips,
        timeline: timelineData,
      } = e.detail || {};

      if (lane === "all" && timelineData) {
        const tl = timelineData;
        const allClips = Array.isArray(tl.tracks)
          ? tl.tracks.flatMap((t) => (Array.isArray(t.clips) ? t.clips : []))
          : [];
        const next = { video: [], audio: [], text: [] };
        for (const c of allClips) {
          const v = Number.isFinite(Number(c.volume)) ? Number(c.volume) : 1;
          const base = {
            id: String(c.id || c._id || rid()),
            type: c.type || "video",
            name: c.label || c.name || "Clip",
            start: Number(c.start ?? c.startSec ?? 0),
            duration: Number(c.durationSec ?? 0),
            assetId: c.assetId || null,
            volume: clamp(v, 0, 1),
            useAudio: c.useAudio !== false,
            text: typeof c.text === "string" ? c.text : undefined,
            lang: c.lang,
            srcInSec:
              Number(
                c.srcInSec ??
                  c.trimStartSec ??
                  c.inSec ??
                  c.in ??
                  c.offsetSec ??
                  c.sourceStartSec ??
                  0
              ) || 0,
          };
          if (base.type === "audio") {
            next.audio.push({
              ...base,
              speed: Number.isFinite(Number(c.speed)) ? Number(c.speed) : 1,
              voiceStability: c.voiceStability !== undefined ? c.voiceStability : null,
            });
          }
          else if (base.type === "text" || base.type === "subtitle") {
            const clean = sanitizeText(c.text ?? c.label ?? c.name);
            next.text.push({
              ...base,
              type: "subtitle",
              text: clean,
              name: clean,
              voiceId: c.voiceId || null,
              voiceModelId: c.voiceModelId || null,
              voiceSpeed: c.voiceSpeed !== undefined ? c.voiceSpeed : null,
              voiceStability: c.voiceStability !== undefined ? c.voiceStability : null,
              voiceSimilarity: c.voiceSimilarity !== undefined ? c.voiceSimilarity : null,
              voiceStyleExaggeration: c.voiceStyleExaggeration !== undefined ? c.voiceStyleExaggeration : null,
              voiceSpeakerBoost: c.voiceSpeakerBoost !== undefined ? c.voiceSpeakerBoost : null,
            });
          } else next.video.push(base);
        }
        if (next.audio.length && next.text.length) {
          const enrichedAudio = next.audio.map((audioClip) => {
            if (audioClip.subtitleClipId) return audioClip;
            const match = next.text.find(
              (textClip) =>
                Math.abs((textClip.start || 0) - (audioClip.start || 0)) <
                  0.05 &&
                Math.abs((textClip.duration || 0) - (audioClip.duration || 0)) <
                  0.1
            );
            if (match) {
              return { ...audioClip, subtitleClipId: match.id };
            }
            return audioClip;
          });
          next.audio = enrichedAudio;
        }

        setClips(next);
        setFps(Number(tl.fps || fpsProp) || 30);
        const guessed = guessTotalDuration(next) || lengthProp;
        setLengthSec(Number(tl.durationSec) || guessed);
        const newRev = Number(tl.rev || 0);
        setRev(newRev);
        serverRevRef.current = newRev;
        return;
      }

      if (!lane || !updatedClips || !Array.isArray(updatedClips)) return;

      setClips((prev) => {
        const currentLaneClips = prev[lane] || [];

        const newLaneClips = updatedClips.map((updatedClip) => {
          const existing = currentLaneClips.find(
            (c) => String(c.id) === String(updatedClip.id)
          );

          if (existing) {
            const cleanText = sanitizeText(updatedClip.text || "");
            return {
              ...existing,
              text: cleanText,
              name: cleanText,
              start: Number(updatedClip.start ?? existing.start ?? 0),
              duration: Number(
                updatedClip.duration ??
                  updatedClip.durationSec ??
                  existing.duration ??
                  0
              ),
              lang: updatedClip.lang ?? existing.lang,
              voiceId:
                updatedClip.voiceId !== undefined
                  ? updatedClip.voiceId
                  : existing.voiceId,
              voiceModelId: updatedClip.voiceModelId !== undefined ? updatedClip.voiceModelId : existing.voiceModelId,
              voiceSpeed: updatedClip.voiceSpeed !== undefined ? updatedClip.voiceSpeed : existing.voiceSpeed,
              voiceStability: updatedClip.voiceStability !== undefined ? updatedClip.voiceStability : existing.voiceStability,
              voiceSimilarity: updatedClip.voiceSimilarity !== undefined ? updatedClip.voiceSimilarity : existing.voiceSimilarity,
              voiceStyleExaggeration: updatedClip.voiceStyleExaggeration !== undefined ? updatedClip.voiceStyleExaggeration : existing.voiceStyleExaggeration,
              voiceSpeakerBoost: updatedClip.voiceSpeakerBoost !== undefined ? updatedClip.voiceSpeakerBoost : existing.voiceSpeakerBoost,
              streamUrl:
                updatedClip.streamUrl !== undefined
                  ? updatedClip.streamUrl
                  : existing.streamUrl,
              url:
                updatedClip.url !== undefined ? updatedClip.url : existing.url,
              cover:
                updatedClip.cover !== undefined
                  ? updatedClip.cover
                  : existing.cover,
              artist:
                updatedClip.artist !== undefined
                  ? updatedClip.artist
                  : existing.artist,
              source:
                updatedClip.source !== undefined
                  ? updatedClip.source
                  : existing.source,
            };
          } else {
            const cleanText = sanitizeText(updatedClip.text || "");
            return {
              id: String(updatedClip.id || rid()),
              type: updatedClip.type || lane === "text" ? "subtitle" : lane,
              name: cleanText || "Clip",
              start: Number(updatedClip.start ?? 0),
              duration: Number(
                updatedClip.duration ?? updatedClip.durationSec ?? 0
              ),
              assetId: updatedClip.assetId || null,
              volume: Number(updatedClip.volume ?? 1),
              useAudio: updatedClip.useAudio !== false,
              text: cleanText || undefined,
              lang: updatedClip.lang,
              srcInSec: Number(updatedClip.srcInSec ?? 0),
              voiceId: updatedClip.voiceId || null,
              voiceModelId: updatedClip.voiceModelId || null,
              voiceSpeed: updatedClip.voiceSpeed !== undefined ? updatedClip.voiceSpeed : null,
              voiceStability: updatedClip.voiceStability !== undefined ? updatedClip.voiceStability : null,
              voiceSimilarity: updatedClip.voiceSimilarity !== undefined ? updatedClip.voiceSimilarity : null,
              voiceStyleExaggeration: updatedClip.voiceStyleExaggeration !== undefined ? updatedClip.voiceStyleExaggeration : null,
              voiceSpeakerBoost: updatedClip.voiceSpeakerBoost !== undefined ? updatedClip.voiceSpeakerBoost : null,
              streamUrl: updatedClip.streamUrl || null,
              url: updatedClip.url || null,
              cover: updatedClip.cover || null,
              artist: updatedClip.artist || null,
              source: updatedClip.source || null,
            };
          }
        });

        const otherLanes = Object.keys(prev).filter((l) => l !== lane);
        const result = {
          ...prev,
          [lane]: newLaneClips.sort((a, b) => a.start - b.start),
        };

        const guessed = guessTotalDuration(result);
        if (guessed && guessed !== lengthSec) {
          setLengthSec(guessed);
        }

        return result;
      });
    };

    window.addEventListener("timeline.updateClips", handleUpdateClips);
    return () => {
      window.removeEventListener("timeline.updateClips", handleUpdateClips);
    };
  }, [lengthSec, fpsProp, lengthProp]);

  useEffect(() => {
    if (!Number.isFinite(lengthSec)) return;
    if (Math.abs((ctxDuration ?? 0) - lengthSec) > 1e-6) {
      setCtxDuration(lengthSec);
    }
    if (ctxTime > lengthSec - 1e-6) {
      setCurrentTime(Math.max(0, lengthSec - 1e-6));
    }
  }, [lengthSec, ctxDuration, ctxTime, setCtxDuration, setCurrentTime]);

  useEffect(() => {
    if (!playing) return;
    if (ctxTime >= (lengthSec || 0) - 1e-6) {
      setCurrentTime(0);
    }
  }, [playing, ctxTime, lengthSec, setCurrentTime]);

  // Delete function - defined early to avoid initialization error
  const deleteSelectedRef = useRef(null);
  
  useEffect(() => {
    const onKeyDown = (e) => {
      const el = e.target;
      const tag = (el?.tagName || "").toLowerCase();
      const typing =
        tag === "input" || tag === "textarea" || el?.isContentEditable === true;
      if (typing) return;
      const isDelete = e.key === "Delete" || e.key === "Backspace";
      const hasSelection = selected || (selectedClips && selectedClips.size > 0);
      if (isDelete && hasSelection && deleteSelectedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        deleteSelectedRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, selectedClips]);

  useEffect(() => {
    const needVideoIds = new Set(
      clips.video
        .filter((c) => c.type === "video")
        .map((c) => c.assetId)
        .filter((id) => id && !filmstripCache[id])
    );
    needVideoIds.forEach(async (id) => {
      const key = `fs:${id}`;
      if (pendingFetch.current.has(key)) return;
      pendingFetch.current.add(key);
      try {
        const { data } = await axiosClient.get(
          `/api/video-processor/assets/${id}/filmstrip?lod=low`
        );
        if (data?.success && data.sheetKey) {
          setFilmstripCache((prev) => ({
            ...prev,
            [id]: {
              assetId: data.assetId,
              lod: data.lod,
              sheetKey: data.sheetKey,
              sheetUrl: `${API_BASE}/${data.sheetKey}`,
              cols: data.cols,
              rows: data.rows,
              stepSec: data.stepSec,
              h: data.h,
              bytes: data.bytes,
              format: data.format,
            },
          }));
        }
      } catch {
      } finally {
        pendingFetch.current.delete(key);
      }
    });
  }, [clips.video, filmstripCache, API_BASE]);

  useEffect(() => {
    const parseWave = (obj) => {
      if (!obj || typeof obj !== "object") return null;
      const stepSec =
        Number(obj.stepSec || obj.step || obj.bucketSec || 0) || 0;
      if (Array.isArray(obj.peaks)) {
        const peaks = obj.peaks.map((v) => Number(v) || 0);
        return { peaks, stepSec };
      }
      if (Array.isArray(obj.buckets)) {
        const peaks = obj.buckets.map((v) => Math.max(0, Number(v) || 0));
        return { peaks, stepSec };
      }
      if (Array.isArray(obj.values)) {
        const peaks = obj.values.map((v) => Number(v) || 0);
        return { peaks, stepSec };
      }
      return null;
    };

    const fetchWaveformForAsset = async (assetId) => {
      const key = `wf:${assetId}`;
      if (pendingFetch.current.has(key)) return;
      pendingFetch.current.add(key);
      try {
        const { data } = await axiosClient.get(
          `/api/video-processor/assets/${assetId}/waveform?lod=med`
        );
        const payload = parseWave(data);
        if (payload && payload.peaks?.length) {
          setAudioWaveCache((prev) => ({ ...prev, [assetId]: payload }));
        }
      } catch {
      } finally {
        pendingFetch.current.delete(key);
      }
    };

    const generatePeaksFromBuffer = (audioBuffer) => {
      if (!audioBuffer) return null;
      const channelData = audioBuffer.getChannelData(0);
      const bucketCount = Math.max(64, Math.min(512, channelData.length / 4000));
      const samplesPerBucket = Math.max(
        1,
        Math.floor(channelData.length / bucketCount)
      );
      const peaks = [];
      for (let i = 0; i < channelData.length; i += samplesPerBucket) {
        let max = 0;
        for (
          let j = 0;
          j < samplesPerBucket && i + j < channelData.length;
          j++
        ) {
          max = Math.max(max, Math.abs(channelData[i + j]));
        }
        peaks.push(max);
      }
      const stepSec =
        peaks.length > 0 ? audioBuffer.duration / peaks.length : 0.1;
      return peaks.length ? { peaks, stepSec } : null;
    };

    const fetchWaveformFromUrl = async (clip) => {
      const targetUrl = clip.streamUrl || clip.url;
      if (!targetUrl) return;
      const key = `wf:${clip.id}`;
      if (pendingFetch.current.has(key)) return;
      pendingFetch.current.add(key);
      try {
        const response = await fetch(targetUrl, { mode: "cors" });
        const cloneForDecode = response.clone();
        const blob = await response.blob();
        const localUrl = URL.createObjectURL(blob);
        const prevUrl = externalAudioSrcRef.current.get(clip.id);
        if (prevUrl && prevUrl !== localUrl) {
          try {
            URL.revokeObjectURL(prevUrl);
          } catch {}
        }
        externalAudioSrcRef.current.set(clip.id, localUrl);
        setClips((prev) => ({
          ...prev,
          audio: prev.audio.map((a) =>
            a.id === clip.id ? { ...a, url: localUrl } : a
          ),
        }));

        const arrayBuffer = await cloneForDecode.arrayBuffer();
        const AudioCtx =
          typeof window !== "undefined"
            ? window.AudioContext || window.webkitAudioContext
            : null;
        if (!AudioCtx) return;
        if (!decodeCtxRef.current) {
          decodeCtxRef.current = new AudioCtx();
        }
        const audioBuffer = await decodeCtxRef.current.decodeAudioData(
          arrayBuffer.slice(0)
        );
        const payload = generatePeaksFromBuffer(audioBuffer);
        if (payload) {
          setAudioWaveCache((prev) => ({
            ...prev,
            [clip.id]: payload,
          }));
        }
      } catch {
      } finally {
        pendingFetch.current.delete(key);
      }
    };

    clips.audio.forEach((clip) => {
      const cacheKey = clip.assetId || clip.id;
      if (audioWaveCache[cacheKey]) return;
      if (clip.assetId) {
        fetchWaveformForAsset(clip.assetId);
      } else if (clip.streamUrl || clip.url) {
        fetchWaveformFromUrl(clip);
      }
    });
  }, [clips.audio, audioWaveCache, axiosClient]);

  const textLayers = useMemo(() => {
    if (!subtitleStyle) {
      return [];
    }

    const style = subtitleStyle;

    if (style.styleId === "none") {
      return [];
    }

    const styleScale = Number(style.scale) || 0.5;

    if (styleScale <= 0 || styleScale < 0.1) {
      return [];
    }

    const baseFontSize = 48;
    const fontSize = Math.round(baseFontSize * styleScale);

    if (fontSize <= 0 || fontSize < 5) {
      return [];
    }

    return clips.text
      .filter((c) => c.type === "subtitle" && c.text && String(c.text).trim())
      .map((c) => {
        const displayText = String(c.text || "");
        
        return {
          id: c.id,
          text: displayText,
          start: Number(c.start) || 0,
          duration: Number(c.duration) || 0,
          x: style.hPlace ?? 0.5,
          y: style.vPlace ?? 0.85,
          fontSize,
          fill: style.color || "#ffffff",
          stroke: style.bgEnabled && style.bgColor ? style.bgColor : "#000000",
          strokeWidth: style.bgEnabled ? 0 : 2,
          align: style.align || "center",
          fontFamily: style.font || "Inter, Arial",
          weight: Number(style.weight) || 700,
          style: style.style || "normal",
          scale: 1,
          rotate: 0,
          styleScale: styleScale,
          bgEnabled: style.bgEnabled || false,
          bgColor: style.bgColor || "#000000",
          bgOpacity: style.bgOpacity ?? 0.5,
          karaokeEnabled: style.styleId === "cinematic" || false,
          karaokeBg: style.karaokeBg || "#ffff00",
          karaokeOpacity: style.karaokeOpacity ?? 0.8,
          maxLines: style.maxLines ?? 2,
          autoBreak: style.autoBreak !== false,
        };
      });
  }, [clips.text, subtitleStyle]);

  const textLayersStructureKey = useMemo(() => {
    return (
      clips.text?.map((c) => `${c.id}:${c.start}:${c.duration}`).join("|") || ""
    );
  }, [clips.text]);

  const subtitleStyleKey = useMemo(() => {
    if (!subtitleStyle) return "none";
    if (subtitleStyle.styleId === "none") return "none";
    const styleScale = Number(subtitleStyle.scale) || 0.5;
    if (styleScale <= 0 || styleScale < 0.1) return "none";
    return `${subtitleStyle.styleId || "default"}:${styleScale}`;
  }, [subtitleStyle]);

  // Track previous subtitleStyleKey to detect style changes
  const prevSubtitleStyleKeyRef = useRef(subtitleStyleKey);

  useEffect(() => {
    const vids = clips.video
      .filter((c) => c.type !== "image" && c.assetId)
      .map((c) => ({
        id: c.id,
        assetId: c.assetId,
        label: c.name,
        start: Number(c.start) || 0,
        duration: Number(c.duration) || 0,
        volume: Math.max(0, Math.min(1, Number(c.volume ?? 1))),
        useAudio: c.useAudio !== false,
        srcInSec: Number(c.srcInSec || 0),
      }));
    const imgs = clips.video
      .filter((c) => c.type === "image" && c.assetId)
      .map((c) => ({
        id: c.id,
        assetId: c.assetId,
        label: c.name,
        start: Number(c.start) || 0,
        duration: Number(c.duration) || 0,
      }));
    const auds = clips.audio.map((c) => ({
      id: c.id,
      assetId: c.assetId,
      label: c.name,
      start: Number(c.start) || 0,
      duration: Number(c.duration) || 0,
      volume: Math.max(0, Math.min(1, Number(c.volume ?? 1))),
      srcInSec: Number(c.srcInSec || 0),
      speed: Number.isFinite(Number(c.speed)) ? Number(c.speed) : 1,
      voiceSpeed:
        c.voiceSpeed !== undefined ? Number(c.voiceSpeed) : undefined,
      voiceStability:
        c.voiceStability !== undefined ? c.voiceStability : null,
      subtitleClipId: c.subtitleClipId ? String(c.subtitleClipId) : null,
      url: c.url || c.streamUrl || null,
      streamUrl: c.streamUrl || null,
      cover: c.cover || null,
      artist: c.artist || null,
      source: c.source || null,
    }));
    
    // Always send video/image/audio clips to ensure video is not lost
    // Send textLayers even if style changed (to update text rendering)
    handleStageVisualsChange({
      videoClips: vids,
      imageClips: imgs,
      audioClips: auds,
      textLayers: textLayers || [],
    });
    
    prevSubtitleStyleKeyRef.current = subtitleStyleKey;
  }, [
    clips.video,
    clips.audio,
    textLayersStructureKey,
    subtitleStyleKey,
    handleStageVisualsChange,
    textLayers,
  ]);

  // Removed this useEffect - it was causing video to disappear when textLayers changed
  // The main useEffect above already handles all updates including textLayers changes

  function guessTotalDuration(state) {
    let maxEnd = 0;
    for (const laneKey of Object.keys(state)) {
      for (const c of state[laneKey]) {
        const end = Number(c.start || 0) + Number(c.duration || 0);
        if (end > maxEnd) maxEnd = end;
      }
    }
    return Math.round(maxEnd * 1000) / 1000;
  }

  function reorderVideoByStart(prevVideo, clipId, newStart) {
    const moving = prevVideo.find((c) => c.id === clipId);
    if (!moving) return prevVideo;
    const others = prevVideo.filter((c) => c.id !== clipId);
    let sum = 0;
    const boundaries = [0];
    for (const o of others) {
      sum += Number(o.duration) || 0;
      boundaries.push(sum);
    }
    const pos = Math.max(
      0,
      Math.min(newStart + (moving.duration || 0) / 2, sum)
    );
    let insertIdx = boundaries.findIndex((b) => pos <= b);
    if (insertIdx === -1) insertIdx = boundaries.length - 1;
    const ordered = [
      ...others.slice(0, insertIdx),
      moving,
      ...others.slice(insertIdx),
    ];
    return packVideo(ordered);
  }

  const handleCommit = useCallback(
    (laneKey, clipId, v) => {
      if (laneKey === "video") {
        setClips((prev) => {
          const updated = prev.video.map((c) =>
            c.id === clipId ? { ...c, duration: v.durationSec } : c
          );
          const newVideo = reorderVideoByStart(updated, clipId, v.startSec);
          const next = { ...prev, video: newVideo };
          const newLen = guessTotalDuration(next);
          setLengthSec(newLen);
          return next;
        });
        scheduleSave();
        return;
      }
      setClips((prev) => {
        const next = {
          ...prev,
          [laneKey]: prev[laneKey].map((c) =>
            c.id === clipId
              ? { ...c, start: v.startSec, duration: v.durationSec }
              : c
          ),
        };
        const newLen = guessTotalDuration(next);
        setLengthSec(newLen);
        return next;
      });
      scheduleSave();
    },
    [lengthSec]
  );

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);
  useEffect(() => {
    const activeIds = new Set(clips.audio.map((c) => c.id));
    externalAudioSrcRef.current.forEach((url, id) => {
      if (!activeIds.has(id)) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
        externalAudioSrcRef.current.delete(id);
      }
    });
  }, [clips.audio]);


  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  const buildPayload = useCallback(
    (state) => {
      const toServerClip = (c) => {
        const base = {
          id: c.id,
          type: c.type,
          label: c.name,
          text: c.text,
          lang: c.lang,
          start: clamp(Number(c.start) || 0, 0, 10_000_000),
          durationSec: clamp(Number(c.duration) || 0, 0, 10_000_000),
          assetId: c.assetId || undefined,
          volume: Math.max(0, Math.min(1, Number(c.volume ?? 1))),
          useAudio: c.useAudio !== false,
          srcInSec: Number(c.srcInSec || 0),
        };
        if (c.type === "subtitle") {
          if (c.voiceId !== undefined) {
            base.voiceId = c.voiceId;
          }
          if (c.voiceModelId !== undefined) {
            base.voiceModelId = c.voiceModelId;
          }
          if (c.voiceSpeed !== undefined) {
            base.voiceSpeed = c.voiceSpeed;
          }
          if (c.voiceStability !== undefined) {
            base.voiceStability = c.voiceStability;
          }
          if (c.voiceSimilarity !== undefined) {
            base.voiceSimilarity = c.voiceSimilarity;
          }
          if (c.voiceStyleExaggeration !== undefined) {
            base.voiceStyleExaggeration = c.voiceStyleExaggeration;
          }
          if (c.voiceSpeakerBoost !== undefined) {
            base.voiceSpeakerBoost = c.voiceSpeakerBoost;
          }
        } else if (c.type === "audio") {
          if (c.speed !== undefined) {
            base.speed = c.speed;
          }
          if (c.voiceSpeed !== undefined) {
            base.voiceSpeed = c.voiceSpeed;
          }
          if (c.voiceStability !== undefined) {
            base.voiceStability = c.voiceStability;
          }
          if (c.subtitleClipId) {
            base.subtitleClipId = c.subtitleClipId;
          }
          if (c.streamUrl || c.url) {
            base.url = c.streamUrl || c.url;
          }
          if (c.cover) {
            base.cover = c.cover;
          }
          if (c.artist) {
            base.artist = c.artist;
          }
          if (c.source) {
            base.source = c.source;
          }
        }
        return base;
      };
      return {
        tracks: [
          { kind: "video", clips: state.video.map(toServerClip) },
          { kind: "audio", clips: state.audio.map(toServerClip) },
          { kind: "subtitle", clips: state.text.map(toServerClip) },
        ],
        playhead: 0,
        fps,
      };
    },
    [fps]
  );

  const doSave = useCallback(async () => {
    if (!projectId) return;
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const cur = clipsRef.current;
      const payloadBase = buildPayload(cur);
      let tryRev = Number(serverRevRef.current) || 0;

      const putOnce = async (revToUse) => {
        const { data } = await axiosClient.put(
          `/api/video-processor/project/${projectId}/timeline`,
          { timeline: { ...payloadBase, rev: revToUse } }
        );
        return data;
      };

      try {
        const data = await putOnce(tryRev);
        if (data?.success) {
          const newServerRev = Number(data.timeline?.rev ?? tryRev + 1);
          setRev((old) => newServerRev || old);
          serverRevRef.current = newServerRev;
          if (Number.isFinite(Number(data.durationSec))) {
            setLengthSec(Number(data.durationSec));
          }

          if (updateDataProject && data.timeline) {
            updateDataProject((prev) =>
              prev
                ? {
                    ...prev,
                    timeline: {
                      ...prev.timeline,
                      ...data.timeline,
                      rev: newServerRev,
                    },
                  }
                : prev
            );
          }
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 409) {
          const latest = await axiosClient.get(
            `/api/video-processor/project/${projectId}/timeline`
          );
          const serverRev = Number(
            latest?.data?.timeline?.rev ?? latest?.data?.rev ?? 0
          );
          setRev(serverRev);
          serverRevRef.current = serverRev;
          const data2 = await putOnce(serverRev);
          if (data2?.success) {
            const newServerRev2 = Number(data2.timeline?.rev ?? serverRev + 1);
            setRev((old) => newServerRev2 || old);
            serverRevRef.current = newServerRev2;
            if (Number.isFinite(Number(data2.durationSec))) {
              setLengthSec(Number(data2.durationSec));
            }

            if (updateDataProject && data2.timeline) {
              updateDataProject((prev) =>
                prev
                  ? {
                      ...prev,
                      timeline: {
                        ...prev.timeline,
                        ...data2.timeline,
                        rev: newServerRev2,
                      },
                    }
                  : prev
              );
            }
          }
        } else {
          console.error("Timeline save failed:", err?.response?.data || err);
        }
      }
    } finally {
      savingRef.current = false;
    }
  }, [projectId, buildPayload]);

  const audioPacked = useMemo(() => packRows(clips.audio), [clips.audio]);
  const textPacked = useMemo(() => packRows(clips.text), [clips.text]);
  const AUDIO_ROW_H = 48;
  const TEXT_ROW_H = 36;

  const splitClip = useCallback(
    (lane, id, atSec, fpsLocal = fps) => {
      const eps = 1 / Math.max(1, fpsLocal);
      setClips((prev) => {
        if (lane === "video") {
          const list = prev.video;
          let acc = 0;
          const idx = list.findIndex((c) => {
            const s = acc;
            const e = s + c.duration;
            const hit = atSec > s + eps && atSec < e - eps;
            acc = e;
            return hit;
          });
          if (idx < 0) return prev;

          const prevDur = list
            .slice(0, idx)
            .reduce((a, c) => a + c.duration, 0);
          const relCut = Math.max(eps, atSec - prevDur);
          const leftDur = relCut;
          const rightDur = Math.max(eps, list[idx].duration - leftDur);

          const srcIn = Number(list[idx].srcInSec || 0);

          const a = {
            ...list[idx],
            id: rid(),
            duration: leftDur,
            srcInSec: srcIn,
          };
          const b = {
            ...list[idx],
            id: rid(),
            duration: rightDur,
            srcInSec: srcIn + leftDur,
          };

          const nextVideo = packVideo([
            ...list.slice(0, idx),
            a,
            b,
            ...list.slice(idx + 1),
          ]);
          const next = { ...prev, video: nextVideo };
          setLengthSec(guessTotalDuration(next));
          scheduleSave();
          return next;
        } else {
          const arr = prev[lane];
          const idx = arr.findIndex((c) => c.id === id);
          if (idx < 0) return prev;
          const c = arr[idx];
          const s = c.start;
          const e = s + c.duration;
          if (!(atSec > s + eps && atSec < e - eps)) return prev;

          const d1 = Math.max(eps, atSec - s);
          const d2 = Math.max(eps, e - atSec);
          const srcIn = Number(c.srcInSec || 0);

          if (lane === "text" && c.type === "subtitle" && c.text) {
            const fullText = String(c.text || "").trim();
            if (!fullText) {
              const a = {
                ...c,
                id: rid(),
                start: s,
                duration: d1,
                srcInSec: srcIn,
              };
              const b = {
                ...c,
                id: rid(),
                start: atSec,
                duration: d2,
                srcInSec: srcIn + d1,
              };
              const nextLane = [
                ...arr.slice(0, idx),
                a,
                b,
                ...arr.slice(idx + 1),
              ];
              const next = { ...prev, [lane]: nextLane };
              setLengthSec(guessTotalDuration(next));
              scheduleSave();
              return next;
            }

            const totalDuration = c.duration;
            const ratio = d1 / totalDuration;

            const words = fullText.split(/\s+/).filter((w) => w.length > 0);
            if (words.length === 0) {
              const a = {
                ...c,
                id: rid(),
                start: s,
                duration: d1,
                srcInSec: srcIn,
              };
              const b = {
                ...c,
                id: rid(),
                start: atSec,
                duration: d2,
                srcInSec: srcIn + d1,
              };
              const nextLane = [
                ...arr.slice(0, idx),
                a,
                b,
                ...arr.slice(idx + 1),
              ];
              const next = { ...prev, [lane]: nextLane };
              setLengthSec(guessTotalDuration(next));
              scheduleSave();
              return next;
            }

            let splitIndex = Math.round(words.length * ratio);
            if (splitIndex <= 0) splitIndex = 1;
            if (splitIndex >= words.length) splitIndex = words.length - 1;

            const text1 = words.slice(0, splitIndex).join(" ").trim();
            const text2 = words.slice(splitIndex).join(" ").trim();

            const a = {
              ...c,
              id: rid(),
              start: s,
              duration: d1,
              text: text1,
              name: text1,
              srcInSec: srcIn,
            };
            const b = {
              ...c,
              id: rid(),
              start: atSec,
              duration: d2,
              text: text2,
              name: text2,
              srcInSec: srcIn + d1,
            };

            const nextLane = [
              ...arr.slice(0, idx),
              a,
              b,
              ...arr.slice(idx + 1),
            ];
            const next = { ...prev, [lane]: nextLane };
            setLengthSec(guessTotalDuration(next));
            scheduleSave();
            return next;
          }

          const a = {
            ...c,
            id: rid(),
            start: s,
            duration: d1,
            srcInSec: srcIn,
          };
          const b = {
            ...c,
            id: rid(),
            start: atSec,
            duration: d2,
            srcInSec: srcIn + d1,
          };

          const nextLane = [...arr.slice(0, idx), a, b, ...arr.slice(idx + 1)];
          const next = { ...prev, [lane]: nextLane };
          setLengthSec(guessTotalDuration(next));
          scheduleSave();
          return next;
        }
      });
    },
    [fps, scheduleSave]
  );

  const deleteSelected = useCallback(() => {
    // Handle multiple selection - check selectedClips first
    if (selectedClips && selectedClips.size > 0) {
      setClips((prev) => {
        const clipsToDelete = Array.from(selectedClips).map(key => {
          const [lane, id] = key.split(':');
          return { lane, id };
        });
        
        // Group by lane
        const byLane = {};
        clipsToDelete.forEach(({ lane, id }) => {
          if (!byLane[lane]) byLane[lane] = [];
          byLane[lane].push(id);
        });
        
        let next = { ...prev };
        
        Object.keys(byLane).forEach(lane => {
          const idsToDelete = new Set(byLane[lane]);
          if (lane === "video") {
            const nextVideo = packVideo(prev.video.filter((c) => !idsToDelete.has(c.id)));
            next = { ...next, video: nextVideo };
          } else {
            next = { ...next, [lane]: (prev[lane] || []).filter((c) => !idsToDelete.has(c.id)) };
          }
        });
        
        const newLen = guessTotalDuration(next);
        setLengthSec(newLen);
        
        // Update text clips event if needed
        if (byLane.text && next.text) {
          const updatedTextClips = next.text.map((c) => ({
            id: c.id,
            text: c.text || "",
            start: c.start || 0,
            durationSec: c.duration || 0,
            duration: c.duration || 0,
            lang: c.lang,
            assetId: c.assetId,
            type: c.type || "subtitle",
            voiceId: c.voiceId || null,
          }));

          setTimeout(() => {
            const event = new CustomEvent("timeline.updateClips", {
              detail: {
                lane: "text",
                clips: updatedTextClips,
              },
            });
            window.dispatchEvent(event);
          }, 0);
        }
        
        return next;
      });
      
      setSelected(null);
      setSelectedClip(null);
      setSelectedClips(new Set());
      scheduleSave();
      return;
    }
    
    // Handle single selection (backward compatibility)
    if (!selected) return;
    const { lane, id } = selected;

    setClips((prev) => {
      if (lane === "video") {
        const nextVideo = packVideo(prev.video.filter((c) => c.id !== id));
        const next = { ...prev, video: nextVideo };
        const newLen = guessTotalDuration(next);
        setLengthSec(newLen);
        return next;
      }
      const next = { ...prev, [lane]: prev[lane].filter((c) => c.id !== id) };
      const newLen = guessTotalDuration(next);
      setLengthSec(newLen);

      if (lane === "text") {
        const updatedTextClips = next[lane].map((c) => ({
          id: c.id,
          text: c.text || "",
          start: c.start || 0,
          durationSec: c.duration || 0,
          duration: c.duration || 0,
          lang: c.lang,
          assetId: c.assetId,
          type: c.type || "subtitle",
          voiceId: c.voiceId || null,
        }));

        setTimeout(() => {
          const event = new CustomEvent("timeline.updateClips", {
            detail: {
              lane: "text",
              clips: updatedTextClips,
            },
          });
          window.dispatchEvent(event);
        }, 0);
      }

      return next;
    });

    setSelected(null);
    setSelectedClip(null);
    setSelectedClips(new Set());
    scheduleSave();
  }, [selected, selectedClips, lengthSec, scheduleSave, setSelectedClip]);

  // Update ref when deleteSelected changes
  useEffect(() => {
    deleteSelectedRef.current = deleteSelected;
  }, [deleteSelected]);

  const getDropTimeFromEvent = useCallback((e, toSecFn) => {
    const host = document.querySelector("[data-scroll-host]");
    if (!host) return 0;
    const rect = host.getBoundingClientRect();
    const x = e.clientX - rect.left + host.scrollLeft;
    return Math.max(0, toSecFn(x));
  }, []);

  const handleDropUniversal = useCallback(
    (toSecFn) => async (e) => {
      e.preventDefault();
      
      // Check if files are being dropped directly
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const subtitleFiles = Array.from(files).filter((f) => {
          const ext = (f.name.split(".").pop() || "").toLowerCase();
          return ["srt", "vtt", "ass", "ssa"].includes(ext);
        });
        
        if (subtitleFiles.length > 0) {
          const { parseSubtitleFile } = await import("../../utils/subtitleParser");
          const file = subtitleFiles[0];
          const dropStart = getDropTimeFromEvent(e, toSecFn);
          
          try {
            const cues = await parseSubtitleFile(file);
            
            if (cues.length > 0) {
              setClips((prev) => {
                const newClips = cues.map((cue) => ({
                  id: rid(),
                  type: "subtitle",
                  name: sanitizeText(cue.text),
                  text: sanitizeText(cue.text),
                  start: dropStart + cue.start,
                  duration: cue.end - cue.start,
                  assetId: null,
                  volume: 1,
                  srcInSec: 0,
                }));
                
                const next = { ...prev, text: [...prev.text, ...newClips] };
                const newLen = guessTotalDuration(next);
                setLengthSec(newLen);
                return next;
              });
              scheduleSave();
            }
          } catch (err) {
            console.error("Error parsing subtitle file:", err);
          }
          return;
        }
      }
      
      // Handle asset drop from MediaPanel
      let s = e.dataTransfer.getData("application/x-d2m-asset");
      if (!s) s = e.dataTransfer.getData("text/plain");
      let a = null;
      try {
        a = JSON.parse(s);
      } catch {}
      if (!a) return;

      const inferred =
        a.type === "audio"
          ? "audio"
          : a.type === "text" || a.type === "subtitle"
          ? "text"
          : a.type === "image"
          ? "image"
          : "video";

      const dur =
        Number(a.durationSec) > 0
          ? Number(a.durationSec)
          : inferred === "image"
          ? 3
          : 5;

      if (inferred === "video" || inferred === "image") {
        setClips((prev) => {
          const newClip = {
            id: rid(),
            type: inferred,
            name: a.name || "Clip",
            start: 0,
            duration: dur,
            assetId: a.assetId || a.id || null,
            volume: 1,
            useAudio: true,
            srcInSec: 0,
          };
          const packed = packVideo([...prev.video, newClip]);
          const next = { ...prev, video: packed };
          setLengthSec(guessTotalDuration(next));
          return next;
        });
        scheduleSave();
        return;
      }

      const dropStart = getDropTimeFromEvent(e, toSecFn);

      if (inferred === "text" || inferred === "subtitle") {
        // If it's a subtitle file from MediaPanel, try to read and parse it
        if (a.type === "subtitle" && a.fileUrl) {
          try {
            const { parseSubtitleFile } = await import("../../utils/subtitleParser");
            const response = await fetch(a.fileUrl);
            const blob = await response.blob();
            const file = new File([blob], a.name || "subtitle.srt", {
              type: blob.type || "text/plain",
            });
            
            const cues = await parseSubtitleFile(file);
            
            if (cues.length > 0) {
              setClips((prev) => {
                const newClips = cues.map((cue) => ({
                  id: rid(),
                  type: "subtitle",
                  name: sanitizeText(cue.text),
                  text: sanitizeText(cue.text),
                  start: dropStart + cue.start,
                  duration: cue.end - cue.start,
                  assetId: a.assetId || a.id || null,
                  volume: 1,
                  srcInSec: 0,
                }));
                
                const next = { ...prev, text: [...prev.text, ...newClips] };
                const newLen = guessTotalDuration(next);
                setLengthSec(newLen);
                return next;
              });
              scheduleSave();
              return;
            }
          } catch (err) {
            console.error("Error parsing subtitle file from asset:", err);
            // Fall through to default text handling
          }
        }
        
        // Default text/subtitle handling
        const textRaw = String(a.text || a.name || "Clip");
        const label = textRaw
          .replace(/<[^>]+>/g, " ")
          .replace(/[\r\n]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const newClip = {
          id: rid(),
          type: "subtitle",
          name: label,
          text: label,
          start: dropStart,
          duration: dur,
          assetId: a.assetId || a.id || null,
          volume: 1,
          srcInSec: 0,
        };
        setClips((prev) => {
          const next = { ...prev, text: [...prev.text, newClip] };
          const newLen = guessTotalDuration(next);
          setLengthSec(newLen);
          return next;
        });
        scheduleSave();
        return;
      }

      const newClip = {
        id: rid(),
        type: "audio",
        name: a.name || "Audio",
        start: dropStart,
        duration: dur,
        assetId: a.assetId || a.id || null,
        volume: 1,
        useAudio: true,
        speed: 1,
        voiceStability: null,
      };
      setClips((prev) => {
        const next = { ...prev, audio: [...prev.audio, newClip] };
        const newLen = guessTotalDuration(next);
        setLengthSec(newLen);
        return next;
      });
      scheduleSave();
    },
    [getDropTimeFromEvent, lengthSec, scheduleSave]
  );

  useEffect(() => {
    const handler = (e) => {
      const { lane, id, patch } = e.detail || {};
      if (!lane || !id || !patch) return;
      setClips((prev) => {
        const nextLaneArr = (prev[lane] || []).map((c) =>
          c.id === id ? { ...c, ...patch } : c
        );
        return { ...prev, [lane]: nextLaneArr };
      });
      scheduleSave();
    };
    window.addEventListener("timeline.patchClip", handler);
    return () => window.removeEventListener("timeline.patchClip", handler);
  }, [scheduleSave]);

  useEffect(() => {
    const handler = (e) => {
      const { lane, clips: newClips } = e.detail || {};
      if (!lane || !Array.isArray(newClips) || newClips.length === 0) return;
      
      setClips((prev) => {
        const next = { ...prev, [lane]: [...(prev[lane] || []), ...newClips] };
        const newLen = guessTotalDuration(next);
        setLengthSec(newLen);
        return next;
      });
      scheduleSave();
    };
    window.addEventListener("timeline.addClips", handler);
    return () => window.removeEventListener("timeline.addClips", handler);
  }, [scheduleSave]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="border-b border-border">
        <div className="relative h-10 border-b border-border px-2">
          <div className="absolute inset-y-0 left-2 flex items-center">
            <ToolsBarWithPlayhead
              selected={selected}
              selectedClips={selectedClips}
              clips={clips}
              fps={fps}
              onSplitAt={splitClip}
              onDelete={deleteSelected}
            />
          </div>
          <div className="absolute inset-y-0 right-2 flex items-center">
            <ZoomControls />
          </div>
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center">
            <TransportBar />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative w-full">
        {loading ? (
          <SpinnerSurface />
        ) : (
          <TracksViewport
            data-scroll-host
            onSplitAtPlayhead={(lane, id, at) => splitClip(lane, id, at)}
            onUniversalDrop={handleDropUniversal}
            selectionBox={selectionBox}
            onSelectionBoxChange={setSelectionBox}
            clips={clips}
            selectedClips={selectedClips}
            onSelectedClipsChange={setSelectedClips}
            onSelectClip={selectClip}
          >
            {!(
              clips.video.length + clips.audio.length + clips.text.length >
              0
            ) ? (
              <EmptyDropSurface onDropUniversal={handleDropUniversal} />
            ) : (
              <>
                {textPacked.rowsCount > 0 && (
                  <DropWithTimeline handleDropUniversal={handleDropUniversal}>
                    <MTrackLane
                      kind="text"
                      height={Math.max(1, textPacked.rowsCount) * TEXT_ROW_H}
                      rowHeight={TEXT_ROW_H}
                      rows={Math.max(1, textPacked.rowsCount)}
                    >
                      {textPacked.withRow.map((c) => {
                        const clipKey = `text:${c.id}`;
                        const isSelected = selected?.lane === "text" && selected?.id === c.id;
                        const isInSelection = selectedClips.has(clipKey);
                        return (
                          <MTextClip
                            key={c.id}
                            id={c.id}
                            lane="text"
                            label={c.text || c.name}
                            startSec={c.start}
                            durationSec={c.duration}
                            rowIndex={c.__row}
                            rowHeight={TEXT_ROW_H}
                            selected={isSelected || isInSelection}
                            isLoading={voiceLoading?.isClipLoading(c.id) || false}
                            loadingProgress={voiceLoading?.getClipProgress(c.id) || 0}
                            onSelect={(e) => {
                              selectClip("text", c, e?.ctrlKey || e?.metaKey);
                            }}
                            onCommit={(v) => handleCommit("text", c.id, v)}
                          />
                        );
                      })}
                    </MTrackLane>
                  </DropWithTimeline>
                )}

                <DropWithTimeline handleDropUniversal={handleDropUniversal}>
                  <MTrackLane kind="video" height={48} rows={1} rowHeight={48}>
                    {clips.video.map((c) => {
                      const clipKey = `video:${c.id}`;
                      const isSelected = selected?.lane === "video" && selected?.id === c.id;
                      const isInSelection = selectedClips.has(clipKey);
                      return c.type === "image" ? (
                        <MImageClip
                          key={c.id}
                          id={c.id}
                          lane="video"
                          label={c.name}
                          startSec={c.start}
                          durationSec={c.duration}
                          rowIndex={0}
                          rowHeight={48}
                          selected={isSelected || isInSelection}
                          onSelect={(e) => {
                            selectClip("video", c, e?.ctrlKey || e?.metaKey);
                          }}
                          thumbUrl={
                            c.assetId
                              ? getThumbUrlFn(c.assetId)?.(96)
                              : undefined
                          }
                          onCommit={(v) => handleCommit("video", c.id, v)}
                        />
                      ) : (
                        <MVideoClip
                          key={c.id}
                          id={c.id}
                          lane="video"
                          label={c.name}
                          startSec={c.start}
                          durationSec={c.duration}
                          rowIndex={0}
                          rowHeight={48}
                          selected={isSelected || isInSelection}
                          onSelect={(e) => selectClip("video", c, e?.ctrlKey || e?.metaKey)}
                          assetId={c.assetId}
                          filmstrip={
                            c.assetId ? filmstripCache[c.assetId] : null
                          }
                          frameUrlAt={
                            c.assetId
                              ? (t, h) =>
                                  getFrameUrlAtFn(c.assetId)(
                                    Number(c.srcInSec || 0) + t,
                                    h
                                  )
                              : undefined
                          }
                          onCommit={(v) => handleCommit("video", c.id, v)}
                        />
                      );
                    })}
                  </MTrackLane>
                </DropWithTimeline>

                {audioPacked.rowsCount > 0 && (
                  <DropWithTimeline handleDropUniversal={handleDropUniversal}>
                    <MTrackLane
                      kind="audio"
                      height={Math.max(1, audioPacked.rowsCount) * AUDIO_ROW_H}
                      rowHeight={AUDIO_ROW_H}
                      rows={Math.max(1, audioPacked.rowsCount)}
                    >
                      {audioPacked.withRow.map((c) => {
                        const clipKey = `audio:${c.id}`;
                        const isSelected = selected?.lane === "audio" && selected?.id === c.id;
                        const isInSelection = selectedClips.has(clipKey);
                        const waveKey = c.assetId || c.id;
                        return (
                          <MAudioClip
                            key={c.id}
                            id={c.id}
                            lane="audio"
                            label={c.name}
                            startSec={c.start}
                            durationSec={c.duration}
                            rowIndex={c.__row}
                            rowHeight={AUDIO_ROW_H}
                            selected={isSelected || isInSelection}
                            onSelect={(e) => {
                              selectClip("audio", c, e?.ctrlKey || e?.metaKey);
                            }}
                            onCommit={(v) => handleCommit("audio", c.id, v)}
                            waveform={audioWaveCache[waveKey] || null}
                          />
                        );
                      })}
                    </MTrackLane>
                  </DropWithTimeline>
                )}
              </>
            )}
          </TracksViewport>
        )}
      </div>
    </div>
  );
}

