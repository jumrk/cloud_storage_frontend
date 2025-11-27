"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { useHardsubMaybe } from "../../context/HardsubContext";
import { useTimelineMaybe } from "../../context/TimelineContext";

const HANDLE_SIZE = 8;
const MIN_BOX_SIZE = 50;

export default function HardsubOverlay({ frameRef, frameSize }) {
  const hardsub = useHardsubMaybe();
  const timeline = useTimelineMaybe();
  const overlayRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState(null);
  const [frameRect, setFrameRect] = useState({ width: 0, height: 0 });

  // Update frameRect when frameRef changes
  useEffect(() => {
    if (!frameRef?.current) {
      setFrameRect({ width: 0, height: 0 });
      return;
    }

    const updateRect = () => {
      if (!frameRef?.current) {
        return;
      }
      const rect = frameRef.current.getBoundingClientRect();
      setFrameRect({ width: rect.width, height: rect.height });
    };

    updateRect();
    const resizeObserver = new ResizeObserver(updateRect);
    resizeObserver.observe(frameRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [frameRef]);

  // Initialize box if not exists
  useEffect(() => {
    if (
      hardsub?.isActive &&
      !hardsub?.boxRect &&
      frameRect.width > 0 &&
      frameRect.height > 0 &&
      hardsub?.updateBoxRect
    ) {
      const initialRect = {
        x: frameRect.width * 0.1,
        y: frameRect.height * 0.1,
        width: frameRect.width * 0.8,
        height: frameRect.height * 0.15,
        previewSize: { width: frameRect.width, height: frameRect.height },
      };
      hardsub.updateBoxRect(initialRect);
    }
  }, [hardsub?.isActive, hardsub?.boxRect, frameRect, hardsub?.updateBoxRect]);

  const getRelativeCoords = useCallback(
    (clientX, clientY) => {
      if (!frameRef?.current) return { x: 0, y: 0 };
      const rect = frameRef.current.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [frameRef]
  );

  const constrainRect = useCallback(
    (rect) => {
      return {
        x: Math.max(0, Math.min(rect.x, frameRect.width - rect.width)),
        y: Math.max(0, Math.min(rect.y, frameRect.height - rect.height)),
        width: Math.max(
          MIN_BOX_SIZE,
          Math.min(rect.width, frameRect.width - rect.x)
        ),
        height: Math.max(
          MIN_BOX_SIZE,
          Math.min(rect.height, frameRect.height - rect.y)
        ),
      };
    },
    [frameRect]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (!hardsub?.boxRect) return;

      const coords = getRelativeCoords(e.clientX, e.clientY);
      const { x, y, width, height } = hardsub.boxRect;

      // Check if clicking on resize handle
      const handles = [
        { name: "nw", x, y },
        { name: "ne", x: x + width, y },
        { name: "sw", x, y: y + height },
        { name: "se", x: x + width, y: y + height },
        { name: "n", x: x + width / 2, y },
        { name: "s", x: x + width / 2, y: y + height },
        { name: "w", x, y: y + height / 2 },
        { name: "e", x: x + width, y: y + height / 2 },
      ];

      const clickedHandle = handles.find((handle) => {
        const dist = Math.sqrt(
          Math.pow(coords.x - handle.x, 2) + Math.pow(coords.y - handle.y, 2)
        );
        return dist < HANDLE_SIZE * 2;
      });

      if (clickedHandle) {
        setIsResizing(true);
        setResizeHandle(clickedHandle.name);
        setDragStart(coords);
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Check if clicking inside box
      if (
        coords.x >= x &&
        coords.x <= x + width &&
        coords.y >= y &&
        coords.y <= y + height
      ) {
        setIsDragging(true);
        setDragStart({
          x: coords.x - x,
          y: coords.y - y,
        });
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [hardsub?.boxRect, getRelativeCoords]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!hardsub?.boxRect || !hardsub?.updateBoxRect) return;

      const coords = getRelativeCoords(e.clientX, e.clientY);

      if (isDragging) {
        const newRect = {
          ...hardsub.boxRect,
          x: coords.x - dragStart.x,
          y: coords.y - dragStart.y,
        };
        // Include preview size for backend scaling
        hardsub.updateBoxRect({
          ...constrainRect(newRect),
          previewSize: { width: frameRect.width, height: frameRect.height },
        });
      } else if (isResizing && resizeHandle) {
        const { x, y, width, height } = hardsub.boxRect;
        let newRect = { ...hardsub.boxRect };

        if (resizeHandle.includes("n")) {
          const deltaY = coords.y - y;
          newRect.y = Math.max(0, y + deltaY);
          newRect.height = Math.max(MIN_BOX_SIZE, height - deltaY);
        }
        if (resizeHandle.includes("s")) {
          newRect.height = Math.max(
            MIN_BOX_SIZE,
            coords.y - y
          );
        }
        if (resizeHandle.includes("w")) {
          const deltaX = coords.x - x;
          newRect.x = Math.max(0, x + deltaX);
          newRect.width = Math.max(MIN_BOX_SIZE, width - deltaX);
        }
        if (resizeHandle.includes("e")) {
          newRect.width = Math.max(MIN_BOX_SIZE, coords.x - x);
        }

        // Include preview size for backend scaling
        hardsub.updateBoxRect({
          ...constrainRect(newRect),
          previewSize: { width: frameRect.width, height: frameRect.height },
        });
      }
    },
    [
      hardsub?.boxRect,
      hardsub?.updateBoxRect,
      isDragging,
      isResizing,
      resizeHandle,
      dragStart,
      getRelativeCoords,
      constrainRect,
      frameRect,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Auto tracking logic (simplified - would need OCR integration)
  useEffect(() => {
    if (hardsub?.autoTrack && hardsub?.boxRect && frameRef?.current) {
      // This would integrate with OCR/text detection
      // For now, just a placeholder
      const interval = setInterval(() => {
        // Auto-adjust box position based on text detection
        // This would require backend OCR API calls
      }, 100);

      return () => clearInterval(interval);
    }
  }, [hardsub?.autoTrack, hardsub?.boxRect, frameRef]);

  // Early return check AFTER all hooks
  if (!hardsub || !hardsub.isActive || !frameRef?.current || !hardsub.boxRect) {
    return null;
  }

  const { boxRect, boxColor } = hardsub;
  const { x, y, width, height } = boxRect;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: frameRect.width,
        height: frameRect.height,
      }}
    >
      <div
        className="absolute border-2 pointer-events-auto cursor-move"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: `${width}px`,
          height: `${height}px`,
          borderColor: boxColor,
          backgroundColor: `${boxColor}20`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Resize handles */}
        {[
          { name: "nw", pos: { left: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 } },
          {
            name: "ne",
            pos: { right: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 },
          },
          {
            name: "sw",
            pos: { left: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 },
          },
          {
            name: "se",
            pos: { right: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 },
          },
          {
            name: "n",
            pos: { left: "50%", top: -HANDLE_SIZE / 2, transform: "translateX(-50%)" },
          },
          {
            name: "s",
            pos: {
              left: "50%",
              bottom: -HANDLE_SIZE / 2,
              transform: "translateX(-50%)",
            },
          },
          {
            name: "w",
            pos: {
              left: -HANDLE_SIZE / 2,
              top: "50%",
              transform: "translateY(-50%)",
            },
          },
          {
            name: "e",
            pos: {
              right: -HANDLE_SIZE / 2,
              top: "50%",
              transform: "translateY(-50%)",
            },
          },
        ].map((handle) => (
          <div
            key={handle.name}
            className="absolute bg-white border-2 rounded-full cursor-pointer"
            style={{
              width: `${HANDLE_SIZE}px`,
              height: `${HANDLE_SIZE}px`,
              borderColor: boxColor,
              ...handle.pos,
            }}
          />
        ))}
      </div>
    </div>
  );
}

