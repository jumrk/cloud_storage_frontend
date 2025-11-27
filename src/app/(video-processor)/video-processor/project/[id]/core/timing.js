// core/timing.js
export function toFrameTime(t, fps) {
  if (!fps || fps <= 0) return Math.max(0, t || 0);
  const step = 1 / fps;
  return Math.max(0, Math.round((t || 0) / step) * step);
}

// Chuẩn hoá clip để tất cả nơi dùng cùng 1 “shape”
export function normalizeClip(raw = {}) {
  return {
    id:
      raw.id ??
      raw._id ??
      raw.assetId ??
      raw.url ??
      `c_${Math.random().toString(36).slice(2)}`,
    assetId: raw.assetId,
    url: raw.url,
    // thời gian trên timeline (giây)
    start: raw.start ?? raw.startSec ?? 0,
    duration: raw.duration ?? raw.durationSec ?? 0,
    // map qua media gốc
    srcIn:
      Number.isFinite(raw.srcInSec)
        ? raw.srcInSec
        : raw.srcIn ?? raw.trimIn ?? raw.in ?? raw.trimStartSec ?? raw.inSec ?? raw.offsetSec ?? 0,
    speed: raw.speed && raw.speed > 0 ? raw.speed : 1,
    reverse: !!raw.reverse,
    // audio
    volume: typeof raw.volume === "number" ? raw.volume : 1,
    fadeIn: raw.fadeIn ?? 0,
    fadeOut: raw.fadeOut ?? 0,
  };
}

export function mapTimelineToMedia(rawClip, T, fps) {
  const clip = normalizeClip(rawClip);
  const local = Math.max(0, toFrameTime((T || 0) - clip.start, fps));
  const dir = clip.reverse ? -1 : 1;
  return clip.srcIn + dir * (local / clip.speed);
}

export function inClip(rawClip, T) {
  const { start, duration } = normalizeClip(rawClip);
  return T >= start && T < start + duration;
}

export function pickActiveClip(videoClips = [], imageClips = [], T = 0) {
  const isIn = (c) => inClip(c, T);
  const v = (videoClips || []).find(isIn);
  if (v) return { ...normalizeClip(v), kind: "video" };
  const im = (imageClips || []).find(isIn);
  if (im) return { ...normalizeClip(im), kind: "image" };
  return null;
}
