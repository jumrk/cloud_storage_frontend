import React, { useState, useEffect, useMemo } from "react";
export default function TypingAnimation({ texts, speed = 100, delay = 3000 }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => setIsStarted(true), 500);
    return () => clearTimeout(startTimeout);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(
      () => setShowCursor((prev) => !prev),
      500
    );
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (!isStarted) return;
    const currentText = texts[currentTextIndex];

    if (!isDeleting) {
      if (currentCharIndex < currentText.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentText.slice(0, currentCharIndex + 1));
          setCurrentCharIndex((v) => v + 1);
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsDeleting(true), delay);
        return () => clearTimeout(timeout);
      }
    } else {
      if (currentCharIndex > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(currentText.slice(0, currentCharIndex - 1));
          setCurrentCharIndex((v) => v - 1);
        }, speed / 2);
        return () => clearTimeout(timeout);
      } else {
        setIsTransitioning(true);
        setTimeout(() => {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
          setIsTransitioning(false);
        }, 200);
      }
    }
  }, [
    currentTextIndex,
    currentCharIndex,
    isDeleting,
    texts,
    speed,
    delay,
    isStarted,
  ]);

  const memoizedDisplayText = useMemo(() => displayText, [displayText]);

  return (
    <span
      className={`text-[var(--color-accent)] typing-container typing-glow typing-fixed-height ${
        isTransitioning ? "opacity-50" : "opacity-100"
      }`}
    >
      <span className="typing-text">{memoizedDisplayText}</span>
      <span
        className={`transition-opacity duration-75 ${
          showCursor ? "opacity-100" : "opacity-0"
        }`}
      >
        |
      </span>
    </span>
  );
}
