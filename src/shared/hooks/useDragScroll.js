// useDragScroll.js
import { useEffect, useRef } from "react";

export default function useDragScroll(axis = "x", opts = {}) {
  const ref = useRef(null);
  const { disabled = false } = opts;
  const st = useRef({
    down: false,
    start: 0,
    startScroll: 0,
    lastPos: 0,
    lastT: 0,
    vx: 0,
    dragged: false,
    raf: null,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;
    const key = axis === "x" ? "clientX" : "clientY";
    const getPos = (e) => ("touches" in e ? e.touches[0][key] : e[key]);

    const onDown = (e) => {
      // bỏ qua nếu click vùng ignore
      const target = e.target;
      if (target && target.closest?.("[data-drag-ignore]")) return;

      st.current.down = true;
      st.current.dragged = false;
      el.classList.add("dragging");
      st.current.start = getPos(e);
      st.current.startScroll = axis === "x" ? el.scrollLeft : el.scrollTop;
      st.current.vx = 0;
      st.current.lastPos = st.current.start;
      st.current.lastT = performance.now();
    };

    const onMove = (e) => {
      if (!st.current.down) return;
      const pos = getPos(e);
      const delta = pos - st.current.start;

      // chỉ coi là drag khi vượt ngưỡng
      if (!st.current.dragged && Math.abs(delta) > 5) {
        st.current.dragged = true;
      }

      if (st.current.dragged) {
        // khi đã drag mới chặn default để không click
        e.preventDefault();
        if (axis === "x") el.scrollLeft = st.current.startScroll - delta;
        else el.scrollTop = st.current.startScroll - delta;

        const now = performance.now();
        const dt = Math.max(1, now - st.current.lastT);
        st.current.vx = (pos - st.current.lastPos) / dt;
        st.current.lastPos = pos;
        st.current.lastT = now;
      }
    };

    const onUp = () => {
      if (!st.current.down) return;
      st.current.down = false;
      el.classList.remove("dragging");

      // quán tính
      if (st.current.dragged) {
        let v = st.current.vx * 18;
        const friction = 0.92;
        const step = () => {
          if (Math.abs(v) < 0.2) return;
          if (axis === "x") el.scrollLeft -= v;
          else el.scrollTop -= v;
          v *= friction;
          st.current.raf = requestAnimationFrame(step);
        };
        cancelAnimationFrame(st.current.raf);
        st.current.raf = requestAnimationFrame(step);
      }
      st.current.dragged = false;
    };

    // mouse
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);

    // touch
    el.addEventListener("touchstart", onDown); // KHÔNG passive:false & KHÔNG preventDefault ở đây
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    window.addEventListener("touchcancel", onUp);

    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);

      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("touchcancel", onUp);

      cancelAnimationFrame(st.current.raf);
    };
  }, [axis, disabled]);

  return ref;
}
