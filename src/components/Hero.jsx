"use client";
import React, { useState, useEffect } from "react";
import ScrollReveal from "./ui/ScrollReveal";
import { useRouter } from "next/navigation";
import { FaLock, FaPlay, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Lottie from "lottie-react";
import metaverseAnimation from "@/assets/animation/metaverse.json";
import userAnimation from "@/assets/animation/user.json";
import folderAnimation from "@/assets/animation/folder.json";
import storageAnimation from "@/assets/animation/storage.json";
import { useTranslations } from "next-intl";

const TypingAnimation = ({ texts, speed = 100, delay = 3000 }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Start the animation after a short delay
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsStarted(true);
    }, 500);
    return () => clearTimeout(startTimeout);
  }, []);

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (!isStarted) return;

    const currentText = texts[currentTextIndex];

    if (!isDeleting) {
      // Typing effect
      if (currentCharIndex < currentText.length) {
        const timeout = setTimeout(() => {
          setDisplayText(currentText.slice(0, currentCharIndex + 1));
          setCurrentCharIndex(currentCharIndex + 1);
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        // Wait before starting to delete
        const timeout = setTimeout(() => {
          setIsDeleting(true);
        }, delay);
        return () => clearTimeout(timeout);
      }
    } else {
      // Deleting effect
      if (currentCharIndex > 0) {
        const timeout = setTimeout(() => {
          setDisplayText(currentText.slice(0, currentCharIndex - 1));
          setCurrentCharIndex(currentCharIndex - 1);
        }, speed / 2);
        return () => clearTimeout(timeout);
      } else {
        // Move to next text with fade transition
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

  // Memoize the display text to prevent unnecessary re-renders
  const memoizedDisplayText = React.useMemo(() => displayText, [displayText]);

  return (
    <span
      className={`text-[#1cadd9] text-transition typing-container typing-glow typing-fixed-height ${
        isTransitioning ? "opacity-50" : "opacity-100"
      }`}
    >
      <span className="typing-text">{memoizedDisplayText}</span>
      <span
        className={`typing-cursor transition-opacity duration-75 ${
          showCursor ? "opacity-100" : "opacity-0"
        }`}
      >
        |
      </span>
    </span>
  );
};

// Description Slider Component
const DescriptionSlider = ({ t }) => {
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

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isTransitioning]);

  return (
    <div className="relative">
      <div className="bg-white border-l-2 py-4 border-gray-300 pl-6 text-gray-700 text-base min-h-[300px] md:min-h-[190px] flex items-center">
        <div
          className={`transition-opacity duration-300 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {descriptions[currentSlide]}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center mt-4 gap-2">
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
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-[#1cadd9] w-6"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

function Hero() {
  const t = useTranslations();
  const router = useRouter();
  const handleGetStarted = () => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/home");
    } else {
      router.push("/Login");
    }
  };
  const handleScrollToPlan = () => {
    if (typeof window !== "undefined") {
      document
        .getElementById("plan-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fastTexts = [t("hero.fast1"), t("hero.fast2")];

  return (
    <div className="w-full min-h-[60vh] flex flex-col md:flex-row items-center justify-between md:px-14 gap-8">
      {/* Left: Text content */}
      <div className="flex-1 flex flex-col gap-6 max-w-2xl">
        <ScrollReveal direction="down">
          <h1 className="text-3xl md:text-5xl font-bold text-black leading-tight flex flex-col  gap-2">
            <div>
              <span className="inline-flex items-center bg-[#1cadd9] rounded-full px-2 py-1 mr-2">
                <FaLock className="text-white mr-1" />
              </span>
              <span className="relative">
                <span className="bg-[#1cadd9]/20 absolute inset-0 -z-10 rounded-md h-2/3 top-1/3 w-full"></span>
                <span className="text-[#1cadd9]">{t("hero.solution")}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <span className="ml-2">{t("hero.storage")}</span>
              <span className="relative">
                <span className="bg-[#1cadd9]/10 absolute inset-0 -z-10 rounded-md h-2/3 top-1/3 w-full"></span>
                <span className="text-[#1cadd9]">{t("hero.safe")}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <span className="ml-2">{t("hero.and")}</span>
              <span className="relative">
                <span className="bg-[#1cadd9]/20 absolute inset-0 -z-10 rounded-md h-2/3 top-1/3 w-full"></span>
                <TypingAnimation texts={fastTexts} speed={60} delay={3000} />
              </span>
            </div>
          </h1>
        </ScrollReveal>
        <ScrollReveal direction="left">
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleGetStarted}
              className="bg-[#1cadd9] cursor-pointer text-white px-6 py-3 rounded-md font-semibold shadow hover:bg-[#189bc2] transition"
            >
              {t("hero.get_started")}
            </button>
            <button
              className="flex items-center gap-2 px-4 py-3 border border-[#1cadd9] text-[#1cadd9] rounded-md font-medium hover:bg-[#1cadd9]/10 transition"
              onClick={handleScrollToPlan}
            >
              <FaPlay className="text-xs" /> {t("hero.view_pricing")}
            </button>
          </div>
        </ScrollReveal>
        <ScrollReveal direction="up">
          <div className="flex gap-12 mt-10">
            <div className="flex flex-col items-center">
              <Lottie
                animationData={userAnimation}
                loop={true}
                className="w-12 h-12 mb-1"
              />
              <span className="text-xl font-bold">20K+</span>
              <span className="text-gray-500 text-sm ">{t("hero.users")}</span>
            </div>
            <div className="flex flex-col items-center">
              <Lottie
                animationData={folderAnimation}
                loop={true}
                className="w-12 h-12 mb-1"
              />
              <span className="text-xl font-bold">1M+</span>
              <span className="text-gray-500 text-sm">{t("hero.files")}</span>
            </div>
            <div className="flex flex-col items-center">
              <Lottie
                animationData={storageAnimation}
                loop={true}
                className="w-12 h-12 mb-1"
              />
              <span className="text-xl font-bold">1 PB</span>
              <span className="text-gray-500 text-sm">
                {t("hero.capacity")}
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
      {/* Right: Illustration & description */}
      <ScrollReveal direction="right">
        <div className="flex-1 flex flex-col items-center gap-8 max-w-xl">
          <Lottie
            animationData={metaverseAnimation}
            loop={true}
            className="w-full max-w-xl drop-shadow-2xl"
          />
          <DescriptionSlider t={t} />
        </div>
      </ScrollReveal>
    </div>
  );
}

export default Hero;
