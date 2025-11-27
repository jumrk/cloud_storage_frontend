"use client";
import React, { useEffect, useMemo, useRef } from "react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}
export default function OTPInput({
  length = 6,
  value = [],
  onChange,
  disabled = false,
  error = false,
  className,
}) {
  const refs = useRef([...Array(length)].map(() => React.createRef()));

  useEffect(() => {
    const idx = value.findIndex((v) => !v);
    if (idx >= 0 && refs.current[idx]?.current) {
      refs.current[idx].current.focus();
    }
  }, []);

  const handleChange = (i, e) => {
    const char = e.target.value;
    if (char === "") {
      onChange?.(i, "");
      return;
    }

    if (!/^\d$/.test(char)) return;

    onChange?.(i, char);
    if (i < length - 1) {
      refs.current[i + 1]?.current?.focus();
    } else {
      e.target.blur();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      e.preventDefault();
      onChange?.(i - 1, "");
      refs.current[i - 1]?.current?.focus();
      return;
    }
    if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.current?.focus();
    }
    if (e.key === "ArrowRight" && i < length - 1) {
      e.preventDefault();
      refs.current[i + 1]?.current?.focus();
    }
  };

  const handlePaste = (i, e) => {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (!text) return;
    e.preventDefault();
    const chars = text
      .trim()
      .slice(0, length - i)
      .split("");
    chars.forEach((ch, idx) => {
      if (/^\d$/.test(ch)) {
        onChange?.(i + idx, ch);
      }
    });
    const last = Math.min(i + chars.length - 1, length - 1);
    refs.current[last]?.current?.focus();
  };

  const cellBase =
    "h-12 w-10 md:h-14 md:w-12 text-center text-lg md:text-xl font-semibold rounded-xl outline-none transition";
  const cellStyle = cx(
    "bg-white border border-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-accent-300)]",
    error &&
      "border-[var(--color-danger-400)] focus:ring-[var(--color-danger-300)]"
  );

  return (
    <div
      className={cx(
        "flex items-center justify-center gap-2 sm:gap-3",
        className
      )}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={refs.current[i]}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          className={cx(
            cellBase,
            cellStyle,
            disabled && "opacity-60 cursor-not-allowed"
          )}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
}
