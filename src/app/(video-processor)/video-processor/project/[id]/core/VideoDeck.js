export class VideoDeck {
  constructor(aEl, bEl) {
    this.a = aEl;
    this.b = bEl;
    this.active = this.a;
    this.standby = this.b;
    this._token = 0;
  }

  _ensure(el) {
    if (!el) return;
    el.playsInline = true;
    el.setAttribute?.("playsinline", "");
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    el.autoplay = true;
    el.muted = false;
    el.volume = 1;
    el.disablePictureInPicture = true;
    el.controls = false;
    el.preservesPitch = true;
    el.webkitPreservesPitch = true;
  }

  attach() {
    this._ensure(this.a);
    this._ensure(this.b);
  }

  _whenReady(el) {
    if (el.readyState >= 2) return Promise.resolve();
    return new Promise((res) => {
      const h = () => res();
      el.addEventListener("loadeddata", h, { once: true });
      el.addEventListener("canplay", h, { once: true });
    });
  }

  _seekTo(el, t) {
    if (!Number.isFinite(t)) return Promise.resolve();
    const cur = el.currentTime || 0;
    if (Math.abs(cur - t) < 0.02) return Promise.resolve();
    return new Promise(async (res) => {
      const done = () => res();
      try {
        if (typeof el.fastSeek === "function") {
          el.fastSeek(Math.max(0, t));
        } else {
          el.currentTime = Math.max(0, t);
        }
      } catch {
        el.currentTime = Math.max(0, t);
      }
      if (el.readyState < 2) await this._whenReady(el);
      el.addEventListener("seeked", done, { once: true });
    });
  }

  async cue(src, atSec = 0) {
    const el = this.standby;
    const token = ++this._token;

    if (!src) {
      el.removeAttribute("src");
      el.load();
      return;
    }

    if (el.src !== src) {
      el.src = src;
      el.load();
      await this._whenReady(el);
      if (token !== this._token) return;
      try {
        const prevMuted = el.muted;
        el.muted = true;
        await el.play().catch(() => {});
        el.pause();
        el.muted = prevMuted;
      } catch {}
      el.playbackRate = 1;
      el.volume = 1;
      // Don't force unmute - let PreviewStage control muted state based on useAudio
      // this.active.muted = false;
      this.active.volume = 1;
    }

    await this._seekTo(el, Math.max(0, atSec));
    if (token !== this._token) return;
    el.playbackRate = 1;
    el.volume = 1;
  }

  swap() {
    const t = this.active;
    this.active = this.standby;
    this.standby = t;
    if (!this.standby.paused) this.standby.pause();
    this.standby.playbackRate = 1;
    this.standby.volume = 1;
  }
}
