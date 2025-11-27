import React, { useEffect, useRef } from "react";

export default function Modal({
  children,
  onClose,
  disableOverlayClose = false,
}) {
  const ref = useRef();
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose && onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  useEffect(() => {
    if (disableOverlayClose) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose && onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, disableOverlayClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={ref}
        className="bg-white rounded-xl shadow-2xl min-w-[320px] max-w-full"
      >
        {children}
      </div>
    </div>
  );
}
