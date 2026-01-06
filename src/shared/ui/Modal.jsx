"use client";

import { useEffect, useState } from "react";

export default function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  backdropClassName = "bg-black/50 backdrop-blur-sm",
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 150); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  if (!isVisible && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-150 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 ${backdropClassName}`} />

      {/* Modal Content */}
      <div
        className={`relative transform transition-all duration-150 ease-out ${
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
