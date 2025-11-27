"use client";
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { Plus } from "lucide-react";
import { useTimeline } from "../../../context/TimelineContext";
import { useVoiceover } from "../../../context/VoiceoverContext";
import { useTranslations } from "next-intl";

function VoiceoverSegment({
  segment,
  index,
  isActive,
  onEdit,
  onSplit,
  onDelete,
  onSelect,
  hasVerticalLine = false,
  isHighlighted = false,
  currentTime = 0,
  karaokeEnabled = false,
  voiceOptions = [],
  showVoiceIcons = true,
  isModified = false,
  t,
}) {
  const textRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const saveTimer = useRef(null);

  const displayText = useMemo(
    () => (segment.text ? String(segment.text).replace(/^\|/, "") : ""),
    [segment.text]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, []);

  // Luôn sync DOM với segment.text khi không focus / không đang gõ IME
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    if (isFocused || isComposing) return;

    const target = displayText || "";
    if (el.textContent !== target) {
      el.textContent = target;
    }
  }, [displayText, isFocused, isComposing]);

  const commitText = useCallback(
    (rawText) => {
      if (!segment || index < 0) return;
      const text = rawText ?? textRef.current?.textContent ?? "";
      onEdit?.(index, { ...segment, text });
    },
    [index, segment, onEdit]
  );

  const scheduleSave = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    const raw = el.textContent || "";

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      commitText(raw);
    }, 200);
  }, [commitText]);

  const isSegmentActiveForKaraoke = useMemo(() => {
    if (
      !karaokeEnabled ||
      !segment ||
      segment.start === undefined ||
      segment.duration === undefined
    ) {
      return false;
    }
    const segmentStart = segment.start || 0;
    const segmentDuration = segment.duration || 0;
    const segmentEnd = segmentStart + segmentDuration;
    return currentTime >= segmentStart && currentTime < segmentEnd;
  }, [karaokeEnabled, segment, currentTime]);

  const handleTextClick = useCallback(
    (e) => {
      e.stopPropagation();
      onSelect?.(index);
      if (textRef.current && document.activeElement !== textRef.current) {
        textRef.current.focus();
      }
    },
    [index, onSelect]
  );

  const handleInput = useCallback(
    (e) => {
      if (isComposing || e.nativeEvent?.isComposing) return;
      scheduleSave();
    },
    [isComposing, scheduleSave]
  );

  const handleKeyDown = useCallback(
    (e) => {
      // Enter để split
      if (e.key === "Enter" && !e.shiftKey && !isComposing) {
        e.preventDefault();

        const el = textRef.current;
        if (!el) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        if (!el.contains(range.commonAncestorContainer)) return;

        const cursorPos = range.startOffset;
        const textContent = el.textContent || "";

        if (cursorPos >= 0 && cursorPos <= textContent.length) {
          const beforeText = textContent.substring(0, cursorPos);
          const afterText = textContent.substring(cursorPos);

          if (beforeText.trim() && afterText.trim()) {
            const totalLength = textContent.length || 1;
            const beforeRatio = beforeText.length / totalLength;
            const afterRatio = afterText.length / totalLength;

            const beforeDuration =
              (segment.duration || 0) * beforeRatio || segment.duration || 0;
            const afterDuration =
              (segment.duration || 0) * afterRatio || segment.duration || 0;

            onSplit?.(
              index,
              cursorPos,
              beforeText.trim(),
              afterText.trim(),
              beforeDuration,
              afterDuration
            );
          }
        }
      }
      // Backspace/Delete để xóa segment nếu rỗng hoặc ở đầu/cuối
      else if (e.key === "Delete" || e.key === "Backspace") {
        const el = textRef.current;
        if (!el) return;

        if (e.target === el || el.contains(e.target)) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textContent = el.textContent || "";
            const isTextSelected = range.startOffset !== range.endOffset;
            const isAtStart = range.startOffset === 0 && range.endOffset === 0;
            const isAtEnd =
              range.startOffset === textContent.length &&
              range.endOffset === textContent.length;

            const isEmpty = !textContent.trim();

            if (
              !isComposing &&
              (isEmpty ||
                (!isTextSelected &&
                  ((e.key === "Backspace" && isAtStart) ||
                    (e.key === "Delete" && isAtEnd))))
            ) {
              e.preventDefault();
              e.stopPropagation();
              onDelete?.(index);
            }
          }
        }
      }
    },
    [index, segment, onSplit, onDelete, isComposing]
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    if (isComposing) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const finalText = textRef.current?.textContent || "";
    commitText(finalText);
  }, [commitText, isComposing]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionUpdate = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
    scheduleSave();
  }, [scheduleSave]);

  const voiceInfo = useMemo(() => {
    if (!segment.voiceId) return null;
    if (!voiceOptions || voiceOptions.length === 0) return null;

    const voice = voiceOptions.find((v) => {
      const vId = String(v.id || "");
      const segId = String(segment.voiceId || "");
      return vId === segId;
    });

    if (!voice) return null;

    const voiceIndex = voiceOptions.findIndex((v) => {
      const vId = String(v.id || "");
      const segId = String(segment.voiceId || "");
      return vId === segId;
    });

    const colorPatterns = [
      "from-green-300 via-emerald-400 to-green-600",
      "from-pink-300 via-rose-400 to-pink-600",
      "from-blue-300 via-cyan-400 to-blue-600",
      "from-purple-300 via-violet-400 to-purple-600",
      "from-orange-300 via-amber-400 to-orange-600",
      "from-teal-300 via-cyan-400 to-teal-600",
    ];
    const colorPattern = colorPatterns[voiceIndex % colorPatterns.length];

    const bgColors = [
      "bg-green-50/60",
      "bg-pink-50/60",
      "bg-blue-50/60",
      "bg-purple-50/60",
      "bg-orange-50/60",
      "bg-teal-50/60",
    ];
    const bgColor = bgColors[voiceIndex % bgColors.length];

    return {
      label: voice.label || voice.name || `Voice ${voiceIndex + 1}`,
      colorPattern,
      bgColor,
      voiceIndex: voiceIndex + 1,
    };
  }, [segment.voiceId, voiceOptions]);

  return (
    <div
      className={`relative ${
        hasVerticalLine ? "border-l-2 border-text-strong" : ""
      } ${
        voiceInfo
          ? voiceInfo.bgColor
          : isActive
          ? "bg-brand-100/70"
          : isHighlighted
          ? "bg-teal-50/50"
          : "hover:bg-surface-50"
      } pl-4 pr-3 py-3 transition-colors duration-300`}
      onClick={(e) => {
        if (
          e.target === e.currentTarget ||
          !textRef.current?.contains(e.target)
        ) {
          onSelect?.(index);
        }
      }}
    >
      {/* Modified indicator */}
      {isModified && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 shadow-sm z-10" title={t("video_processor.inspector.panel.subtitle.modified_indicator")} />
      )}
      <div className="flex items-start gap-3 relative">
        {showVoiceIcons && (
          <div className="shrink-0 mt-0.5">
            {voiceInfo ? (
              <div
                className={`w-6 h-6 rounded-full bg-gradient-to-br ${voiceInfo.colorPattern} flex items-center justify-center text-white font-bold text-[10px] shadow-sm`}
              >
                {voiceInfo.voiceIndex}
              </div>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0 relative">
          <div className="relative rounded-md overflow-hidden">
            <div
              className={`absolute inset-0 bg-brand-300/50 transition-all duration-400 ease-out ${
                isSegmentActiveForKaraoke
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-1"
              } pointer-events-none`}
              aria-hidden="true"
            />
            <div
              ref={textRef}
              contentEditable
              suppressContentEditableWarning
              inputMode="text"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onFocus={handleFocus}
              onCompositionStart={handleCompositionStart}
              onCompositionUpdate={handleCompositionUpdate}
              onCompositionEnd={handleCompositionEnd}
              lang="vi"
              onClick={handleTextClick}
              className={`text-sm leading-relaxed whitespace-pre-wrap break-words outline-none focus:outline-none min-h-[1.5em] cursor-text relative z-[1] transition-colors duration-300 ${
                isSegmentActiveForKaraoke
                  ? "text-text-strong font-medium"
                  : "text-text-strong"
              }`}
              style={{ caretColor: "#3b82f6" }}
            ></div>
          </div>
          {segment.start !== undefined && segment.duration !== undefined && (
            <div className="mt-1.5 text-xs text-text-muted">
              {formatTime(segment.start)} -{" "}
              {formatTime(segment.start + segment.duration)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function SegmentSkeleton({ index = 0 }) {
  const width1 = 60 + (index % 3) * 15;
  const width2 = 50 + (index % 2) * 20;

  return (
    <div className="relative pl-4 pr-3 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-2.5">
          <div
            className="h-4 bg-gradient-to-r from-surface-100 via-surface-50 to-surface-100 rounded animate-pulse"
            style={{ width: `${width1}%` }}
          ></div>
          <div
            className="h-4 bg-gradient-to-r from-surface-100 via-surface-50 to-surface-100 rounded animate-pulse"
            style={{ width: `${width2}%` }}
          ></div>
          <div className="mt-1.5 h-3 bg-gradient-to-r from-surface-50 via-surface-100 to-surface-50 rounded animate-pulse w-24"></div>
        </div>
      </div>
    </div>
  );
}

export default function VoiceoverTimeline({
  segments = [],
  onSegmentsChange,
  onSegmentSelect,
  selectedIndex = null,
  karaokeEnabled = false,
  isLoading = false,
  voiceOptions = [],
}) {
  const t = useTranslations();
  const { setCurrentTime, currentTime } = useTimeline();
  const voiceoverContext = useVoiceover();
  const showVoiceIcons = voiceoverContext?.showVoiceIcons ?? true;
  const modifiedSegments = voiceoverContext?.modifiedSegments ?? new Set();

  const handleEdit = useCallback(
    (index, updatedSegment) => {
      if (index < 0 || index >= segments.length || !segments[index]) return;

      const segment = segments[index];
      const newSegments = [...segments];
      newSegments[index] = {
        ...segment,
        ...updatedSegment,
      };

      onSegmentsChange?.(newSegments);

      // Dispatch event when text is edited (if text actually changed)
      if (updatedSegment.text !== undefined && updatedSegment.text !== segment.text) {
        const clipId = segment.id || newSegments[index].id;
        if (clipId) {
          window.dispatchEvent(
            new CustomEvent("voiceover.textEdited", {
              detail: { clipId, index },
            })
          );
        }
      }
    },
    [segments, onSegmentsChange]
  );

  const handleDelete = useCallback(
    (index) => {
      if (index < 0 || index >= segments.length || !segments[index]) return;

      const newSegments = segments.filter((_, i) => i !== index);
      onSegmentsChange?.(newSegments);

      if (selectedIndex !== null) {
        if (selectedIndex === index) {
          const nextIndex =
            newSegments.length > 0
              ? Math.min(selectedIndex, newSegments.length - 1)
              : null;
          onSegmentSelect?.(nextIndex);
        } else if (selectedIndex > index) {
          onSegmentSelect?.(selectedIndex - 1);
        }
      }
    },
    [segments, selectedIndex, onSegmentsChange, onSegmentSelect]
  );

  const handleSplit = useCallback(
    (
      index,
      cursorPos,
      beforeText,
      afterText,
      beforeDuration,
      afterDuration
    ) => {
      if (index < 0 || index >= segments.length) return;

      const segment = segments[index];
      if (
        !segment ||
        segment.start === undefined ||
        segment.duration === undefined
      )
        return;

      const newSegments = [...segments];

      newSegments[index] = {
        ...segment,
        text: beforeText,
        duration: beforeDuration,
        voiceId: segment.voiceId || null,
      };

      const newSegment = {
        ...segment,
        id: `${segment.id || `segment-${index}`}_split_${Date.now()}`,
        text: afterText,
        start: segment.start + beforeDuration,
        duration: afterDuration,
        voiceId: segment.voiceId || null,
        voiceModelId: segment.voiceModelId || null,
        voiceSpeed:
          segment.voiceSpeed !== undefined ? segment.voiceSpeed : null,
        voiceStability:
          segment.voiceStability !== undefined ? segment.voiceStability : null,
        voiceSimilarity:
          segment.voiceSimilarity !== undefined
            ? segment.voiceSimilarity
            : null,
        voiceStyleExaggeration:
          segment.voiceStyleExaggeration !== undefined
            ? segment.voiceStyleExaggeration
            : null,
        voiceSpeakerBoost:
          segment.voiceSpeakerBoost !== undefined
            ? segment.voiceSpeakerBoost
            : null,
      };

      newSegments.splice(index + 1, 0, newSegment);
      onSegmentsChange?.(newSegments);
      onSegmentSelect?.(index + 1);

      setCurrentTime(newSegment.start);
    },
    [segments, onSegmentsChange, onSegmentSelect, setCurrentTime]
  );

  const handleAdd = useCallback(() => {
    const newSegment = {
      id: `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: "",
      start:
        segments.length > 0
          ? segments[segments.length - 1].start +
            (segments[segments.length - 1].duration || 0)
          : 0,
      duration: 5,
    };
    const newSegments = [...segments, newSegment];
    onSegmentsChange?.(newSegments);
    onSegmentSelect?.(newSegments.length - 1);
  }, [segments, onSegmentsChange, onSegmentSelect]);

  const shouldShowVerticalLine = (segment, index) => {
    return segment.text?.trim().startsWith("|") || segment.hasMarker === true;
  };

  const shouldHighlight = (index) => {
    return index === 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <SegmentSkeleton key={`skeleton-${i}`} index={i} />
        ))}
      </div>
    );
  }

  if (!segments || segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <p className="text-sm text-text-muted mb-4">{t("video_processor.inspector.panel.subtitle.no_subtitle")}</p>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-surface-50 text-sm font-medium text-text-strong transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("video_processor.inspector.panel.subtitle.add_first_segment")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {segments.map((segment, index) => {
        if (!segment) return null;

        return (
          <VoiceoverSegment
            key={segment.id || `segment-${index}`}
            segment={segment}
            index={index}
            isActive={
              selectedIndex === index && selectedIndex < segments.length
            }
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelect={onSegmentSelect}
            onSplit={handleSplit}
            hasVerticalLine={shouldShowVerticalLine(segment, index)}
            isHighlighted={shouldHighlight(index)}
            currentTime={currentTime}
            karaokeEnabled={karaokeEnabled}
            voiceOptions={voiceOptions}
            showVoiceIcons={showVoiceIcons}
            isModified={modifiedSegments.has(String(segment.id))}
            t={t}
          />
        );
      })}
      <div className="px-4 py-3 border-l-2 border-transparent">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-brand-500 hover:bg-brand-50/50 text-sm font-medium text-text-muted hover:text-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("video_processor.inspector.panel.subtitle.add_first_segment")}
        </button>
      </div>
    </div>
  );
}
