export function pickActiveVisual(videoClips = [], imageClips = [], t = 0) {
  const inRange = (c) =>
    t >= (c.start ?? 0) && t < (c.start ?? 0) + (c.duration ?? 0);
  const v = (videoClips || []).find(inRange);
  if (v) return { ...v, kind: "video", localTime: t - v.start };
  const im = (imageClips || []).find(inRange);
  if (im) return { ...im, kind: "image", localTime: t - im.start };
  return null;
}

export function sameURL(a, b) {
  if (!a || !b) return false;
  try {
    return (
      new URL(a, window.location.href).href ===
      new URL(b, window.location.href).href
    );
  } catch {
    return a === b;
  }
}

export function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

