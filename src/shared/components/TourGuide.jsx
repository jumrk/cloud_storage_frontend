"use client";
import React, { useEffect, useState, useRef } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function TourGuide({ steps, onComplete, onSkip, storageKey }) {
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef(null);
  const tooltipRef = useRef(null);

  // Check if tour has been completed
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const completed = localStorage.getItem(`tour_${storageKey}_completed`);
      if (completed === "true") {
        setIsVisible(false);
        return;
      }
    }
    setIsVisible(true);
  }, [storageKey]);

  useEffect(() => {
    if (!isVisible || steps.length === 0) return;
    const current = steps[currentStep];
    if (!current) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(current.target);
      if (!targetElement) return;

      // Calculate position
      const rect = targetElement.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      if (tooltipRef.current) {
        const tooltip = tooltipRef.current;

        // Force reflow to get accurate dimensions
        tooltip.style.visibility = "hidden";
        tooltip.style.display = "block";
        const tooltipRect = tooltip.getBoundingClientRect();
        tooltip.style.visibility = "visible";

        // Position tooltip
        let top = rect.bottom + scrollY + 12;
        let left = rect.left + scrollX + rect.width / 2;

        // Adjust position based on placement
        switch (current.placement || "bottom") {
          case "top":
            top = rect.top + scrollY - tooltipRect.height - 12;
            left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + scrollY + 12;
            left = rect.left + scrollX + rect.width / 2 - tooltipRect.width / 2;
            break;
          case "left":
            top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
            left = rect.left + scrollX - tooltipRect.width - 12;
            break;
          case "right":
            top = rect.top + scrollY + rect.height / 2 - tooltipRect.height / 2;
            left = rect.right + scrollX + 12;
            break;
        }

        // Keep tooltip within viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        if (left < 12) left = 12;
        if (left + tooltipRect.width > viewportWidth - 12) {
          left = viewportWidth - tooltipRect.width - 12;
        }
        if (top < 12) top = 12;
        if (top + tooltipRect.height > viewportHeight - 12) {
          top = viewportHeight - tooltipRect.height - 12;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
      }

      // Scroll element into view
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      // Remove existing highlight
      const existing = document.querySelector(".tour-highlight");
      if (existing) existing.remove();

      // Highlight target element
      const highlight = document.createElement("div");
      highlight.style.position = "absolute";
      highlight.style.top = `${rect.top + scrollY}px`;
      highlight.style.left = `${rect.left + scrollX}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      highlight.style.border = "2px solid #3b82f6";
      highlight.style.borderRadius = "8px";
      highlight.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.5)";
      highlight.style.pointerEvents = "none";
      highlight.style.zIndex = "9998";
      highlight.className = "tour-highlight";
      document.body.appendChild(highlight);
    };

    // Initial position
    const timer = setTimeout(updatePosition, 100);

    // Update on resize/scroll
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      const existing = document.querySelector(".tour-highlight");
      if (existing) existing.remove();
    };
  }, [currentStep, isVisible, steps]);

  if (!isVisible || steps.length === 0 || currentStep >= steps.length) {
    return null;
  }

  const current = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(`tour_${storageKey}_completed`, "true");
    }
    if (onSkip) onSkip();
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (storageKey && typeof window !== "undefined") {
      localStorage.setItem(`tour_${storageKey}_completed`, "true");
    }
    if (onComplete) onComplete();
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9997] pointer-events-auto"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={handleSkip}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] bg-white rounded-xl shadow-2xl p-5 max-w-sm pointer-events-auto"
        style={{ minWidth: "320px" }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="text-xs font-semibold text-brand-600 mb-1">
              {t("tour.step", {
                current: currentStep + 1,
                total: steps.length,
              })}
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              {current.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {current.description}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="ml-3 p-1 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 transition"
            aria-label={t("tour.skip")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={isFirst}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isFirst
                ? "text-gray-600 opacity-50 cursor-not-allowed"
                : "text-gray-900 hover:bg-white"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            {t("tour.previous")}
          </button>

          <div className="flex items-center gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition ${
                  index === currentStep ? "bg-brand-600 w-6" : "bg-border"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition"
          >
            {isLast ? t("tour.finish") : t("tour.next")}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
