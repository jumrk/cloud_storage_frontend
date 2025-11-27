export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function secToPx(sec, pxPerSec) {
  return Math.max(0, sec) * pxPerSec;
}
export function pxToSec(px, pxPerSec) {
  return Math.max(0, px) / pxPerSec;
}
export function framesToSec(frames, fps) {
  return frames / (fps || 30);
}
export function secToFrames(sec, fps) {
  return Math.round(sec * (fps || 30));
}
export function formatTimecode(sec = 0, fps = 30) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const ff = Math.floor((sec - Math.floor(sec)) * fps);
  const HH = h ? String(h).padStart(2, "0") + ":" : "";
  return `${HH}${String(m).padStart(2, "0")}:${String(r).padStart(
    2,
    "0"
  )}:${String(ff).padStart(2, "0")}`;
}
