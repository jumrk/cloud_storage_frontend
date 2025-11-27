export default class CanvasCompositor {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { 
      alpha: false, 
      desynchronized: true,
      willReadFrequently: false
    });
  }
  resize(w, h) {
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  drawVideo(videoEl, fit = "contain") {
    const cw = this.canvas.width,
      ch = this.canvas.height;
    const vw = videoEl.videoWidth || 1,
      vh = videoEl.videoHeight || 1;
    let dw = cw,
      dh = ch,
      dx = 0,
      dy = 0;
    if (fit === "contain") {
      const s = Math.min(cw / vw, ch / vh);
      dw = Math.round(vw * s);
      dh = Math.round(vh * s);
      dx = (cw - dw) >> 1;
      dy = (ch - dh) >> 1;
    }
    this.ctx.drawImage(videoEl, dx, dy, dw, dh);
  }
  drawImage(img, fit = "contain") {
    const cw = this.canvas.width,
      ch = this.canvas.height;
    const vw = img.naturalWidth || 1,
      vh = img.naturalHeight || 1;
    let dw = cw,
      dh = ch,
      dx = 0,
      dy = 0;
    if (fit === "contain") {
      const s = Math.min(cw / vw, ch / vh);
      dw = Math.round(vw * s);
      dh = Math.round(vh * s);
      dx = (cw - dw) >> 1;
      dy = (ch - dh) >> 1;
    }
    this.ctx.drawImage(img, dx, dy, dw, dh);
  }
}
