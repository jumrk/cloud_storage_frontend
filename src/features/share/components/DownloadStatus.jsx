"use client";
import React, { useEffect, useState, useRef } from "react";
import { FiCheck, FiX, FiDownload, FiClock } from "react-icons/fi";
import Image from "next/image";

function CircularProgress({ percent = 0, size = 24, stroke = 3 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} className="inline-block align-middle">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.3s" }}
      />
    </svg>
  );
}

export default function DownloadStatus({
  files = [],
  folderName,
  onComplete,
  onCancel,
}) {
  const [fileStates, setFileStates] = useState(() =>
    files.map((f) => ({
      ...f,
      status: f.status || "pending",
      progress: f.progress || 0,
      error: f.error || null,
    }))
  );
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [eta, setEta] = useState(null); // Estimated time of arrival in seconds
  const [speed, setSpeed] = useState(0); // Download speed in bytes per second
  const downloadSpeedRef = useRef({}); // Track download speed: { bytes: number, time: number }

  useEffect(() => {
    if (files && files.length > 0) {
      setFileStates(
        files.map((f) => ({
          ...f,
          status: f.status || "pending",
          progress: f.progress || 0,
          error: f.error || null,
        }))
      );
    }
  }, [files]);

  // Format ETA to human readable string
  const formatETA = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format speed to human readable string
  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond || bytesPerSecond <= 0) return "0 B/s";
    const kb = bytesPerSecond / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB/s`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB/s`;
    const gb = mb / 1024;
    return `${gb.toFixed(2)} GB/s`;
  };

  // Calculate ETA based on current speed and remaining progress
  const calculateETA = (currentProgress, currentSpeed, totalSize) => {
    if (currentSpeed <= 0 || currentProgress >= 100 || !totalSize) return null;
    const remainingProgress = 100 - currentProgress;
    const remainingBytes = (remainingProgress / 100) * totalSize;
    const estimatedSeconds = remainingBytes / currentSpeed;
    return estimatedSeconds > 0 ? Math.round(estimatedSeconds) : null;
  };

  useEffect(() => {
    const calculateProgress = () => {
      if (fileStates.length === 0) return 0;
      // Ensure completed files always count as 100%
      const sum = fileStates.reduce((acc, f) => {
        const fileProgress = f.status === "success" ? 100 : f.progress || 0;
        return acc + fileProgress;
      }, 0);
      return Math.round(sum / fileStates.length);
    };

    const overallProgress = calculateProgress();
    setProgress(overallProgress);

    // Calculate download speed and ETA
    const downloadingFile = fileStates.find((f) => f.status === "downloading");
    if (
      downloadingFile &&
      downloadingFile.size &&
      downloadingFile.progress > 0
    ) {
      const now = Date.now();
      const currentBytes =
        (downloadingFile.progress / 100) * downloadingFile.size;
      if (!downloadSpeedRef.current.bytes || !downloadSpeedRef.current.time) {
        downloadSpeedRef.current = { bytes: currentBytes, time: now };
      } else {
        const timeDiff = (now - downloadSpeedRef.current.time) / 1000; // seconds
        if (timeDiff > 0.5) {
          // Update speed every 0.5 seconds
          const bytesDiff = currentBytes - downloadSpeedRef.current.bytes;
          const currentSpeed = bytesDiff / timeDiff;
          setSpeed(currentSpeed);
          downloadSpeedRef.current = { bytes: currentBytes, time: now };

          // Calculate ETA
          const etaSeconds = calculateETA(
            overallProgress,
            currentSpeed,
            downloadingFile.size
          );
          setEta(etaSeconds);
        }
      }
    } else {
      setSpeed(0);
      setEta(null);
    }
  }, [fileStates]);

  useEffect(() => {
    const allDone = fileStates.every(
      (f) =>
        f.status === "success" ||
        f.status === "error" ||
        f.status === "cancelled"
    );
    if (allDone && fileStates.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fileStates, onComplete]);

  if (!isVisible || !files || files.length === 0) return null;

  const allDone = fileStates.every(
    (f) =>
      f.status === "success" || f.status === "error" || f.status === "cancelled"
  );
  const hasErrors = fileStates.some((f) => f.status === "error");
  const hasCancelled = fileStates.some((f) => f.status === "cancelled");

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-card p-5 flex flex-col gap-4 max-w-[450px] w-full border border-gray-200 z-[9999]">
      <div className="flex items-center gap-2 mb-2">
        {progress < 100 ? (
          <FiDownload className="text-brand animate-pulse" size={20} />
        ) : hasErrors ? (
          <FiX className="text-danger" size={20} />
        ) : (
          <FiCheck className="text-success" size={20} />
        )}
        <span className="font-semibold text-base text-gray-900 truncate">
          {progress < 100 && !hasCancelled
            ? `Đang tải xuống... ${progress}%`
            : hasCancelled
            ? "Đã hủy tải xuống"
            : hasErrors
            ? "Tải xuống hoàn tất (có lỗi)"
            : "Tải xuống hoàn tất"}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${
            allDone && !hasErrors
              ? "bg-success"
              : hasErrors
              ? "bg-danger"
              : "bg-brand"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Progress info: speed and ETA */}
      {progress < 100 && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{formatSpeed(speed)}</span>
          {eta && eta > 0 && <span>Còn lại: {formatETA(eta)}</span>}
        </div>
      )}
      {folderName && (
        <div className="flex items-center gap-2 text-xs">
          <Image
            src={"/images/icon/folder.png"}
            alt="icon"
            className="w-4 h-4 object-contain flex-shrink-0"
            width={16}
            height={16}
            placeholder="blur"
            blurDataURL="data:image/png;base64,..."
            priority
          />
          <span className="truncate flex-1 text-brand-700 font-semibold">
            {folderName}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {fileStates.map((f, idx) => (
          <div key={idx} className="flex flex-col gap-1 w-full">
            <div className="flex w-full items-center gap-2 text-sm">
              <Image
                src={"/images/icon/png.png"}
                alt="icon"
                className="w-4 h-4 object-contain flex-shrink-0"
                width={16}
                height={16}
                placeholder="blur"
                blurDataURL="data:image/png;base64,..."
                priority
              />
              <span
                className={
                  "flex-1 truncate overflow-hidden min-w-0 file-name-fixed-width" +
                  (f.status === "success"
                    ? " text-success-600"
                    : f.status === "error"
                    ? " text-danger-600"
                    : f.status === "cancelled"
                    ? " text-gray-600"
                    : f.status === "downloading"
                    ? " text-brand-600"
                    : " text-gray-600")
                }
                title={f.name}
              >
                {f.name}
              </span>
              <div className="flex-shrink-0 flex items-center gap-1">
                {f.status === "downloading" && (
                  <CircularProgress
                    percent={f.progress || 0}
                    size={18}
                    stroke={3}
                  />
                )}
                {f.status === "success" ? (
                  <FiCheck className="text-success" size={14} />
                ) : f.status === "error" ? (
                  <FiX className="text-danger" size={14} />
                ) : f.status === "cancelled" ? (
                  <FiX className="text-gray-600" size={14} />
                ) : f.status === "downloading" ? (
                  <FiDownload className="text-brand animate-pulse" size={14} />
                ) : (
                  <FiClock className="text-gray-600" size={14} />
                )}
                {f.status === "downloading" && onCancel && (
                  <button
                    onClick={() => onCancel(f.id || f.name)}
                    className="text-danger hover:opacity-90"
                    title="Hủy tải xuống"
                  >
                    <FiX size={12} />
                  </button>
                )}
              </div>
            </div>
            {f.status === "error" && f.error && (
              <div className="text-sm text-danger ml-6">{f.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
