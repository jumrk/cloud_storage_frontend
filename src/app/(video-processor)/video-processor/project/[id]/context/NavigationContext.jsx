"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";

const Ctx = createContext(null);

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function NavigationProvider({ children }) {
  const [activeNav, setActiveNav] = useState("media");
  const [libWidth, setLibWidth] = useState("clamp(280px, 24vw, 396px)");
  const libRef = useRef(null);

  const onStartResizeLib = useCallback((e) => {
    e.preventDefault();
    const startX = e.clientX;
    const rect = libRef.current?.getBoundingClientRect();
    const startW = rect?.width ?? 320;
    const minW = 240;
    const maxW = Math.min(560, Math.round((window.innerWidth || 1200) * 0.42));
    const move = (ev) => {
      const dx = ev.clientX - startX;
      const w = clamp(Math.round(startW + dx), minW, maxW);
      setLibWidth(`${w}px`);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  }, []);

  const value = useMemo(
    () => ({
      activeNav,
      libWidth,
      libRef,
      setActiveNav,
      setLibWidth,
      onStartResizeLib,
    }),
    [activeNav, libWidth, onStartResizeLib]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNavigation() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNavigation must be used inside <NavigationProvider>");
  return v;
}

export function useNavigationMaybe() {
  return useContext(Ctx);
}

