"use client";
import React, { useState, useEffect } from "react";
export default function DescriptionSlider({ t }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const descriptions = [t("hero.desc"), t("hero.desc_1"), t("hero.desc_2")];

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % descriptions.length);
      setIsTransitioning(false);
    }, 300);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isTransitioning]);

  return (
    <div className="relative">
      <div className="flex min-h-[300px] items-center border-l-2 bg-[var(--color-surface-50)] py-4 pl-6 text-[var(--color-text-muted)] md:min-h-[190px] border-[var(--color-border)]">
        <div
          className={`transition-opacity duration-300 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {descriptions[currentSlide]}
        </div>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {descriptions.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isTransitioning && index !== currentSlide) {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentSlide(index);
                  setIsTransitioning(false);
                }, 300);
              }
            }}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-6 bg-[var(--color-accent)]"
                : "bg-[var(--color-surface-soft)] hover:opacity-80"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
