"use client";
import React, { useEffect, useState } from "react";
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

export default function DownloadStatus({ files = [], folderName, onComplete }) {
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

  useEffect(() => {
    const calculateProgress = () => {
      if (fileStates.length === 0) return 0;
      const sum = fileStates.reduce((acc, f) => acc + (f.progress || 0), 0);
      return Math.round(sum / fileStates.length);
    };
    setProgress(calculateProgress());
  }, [fileStates]);

  useEffect(() => {
    const allDone = fileStates.every(
      (f) => f.status === "success" || f.status === "error"
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
    (f) => f.status === "success" || f.status === "error"
  );
  const hasErrors = fileStates.some((f) => f.status === "error");

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-card p-4 flex flex-col gap-3 max-w-[340px] w-full border border-border z-[9999]">
      <div className="flex items-center gap-2 mb-2">
        {progress < 100 ? (
          <FiDownload className="text-brand animate-pulse" size={18} />
        ) : hasErrors ? (
          <FiX className="text-danger" size={18} />
        ) : (
          <FiCheck className="text-success" size={18} />
        )}
        <span className="font-semibold text-sm text-text-strong truncate">
          {progress < 100
            ? `Đang tải xuống... ${progress}%`
            : hasErrors
            ? "Tải xuống hoàn tất (có lỗi)"
            : "Tải xuống hoàn tất"}
        </span>
      </div>

      <div className="w-full bg-surface-soft rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            allDone && !hasErrors
              ? "bg-success"
              : hasErrors
              ? "bg-danger"
              : "bg-brand"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

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

      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {fileStates.map((f, idx) => (
          <div key={idx} className="flex flex-col gap-0.5 w-full">
            <div className="flex w-full items-center gap-2 text-xs">
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
                    : f.status === "downloading"
                    ? " text-brand-600"
                    : " text-text-muted")
                }
                title={f.name}
              >
                {f.name}
              </span>

              <div className="flex-shrink-0 flex items-center gap-1">
                {f.status === "downloading" && (
                  <CircularProgress percent={f.progress || 0} size={18} stroke={3} />
                )}
                {f.status === "success" ? (
                  <FiCheck className="text-success" size={14} />
                ) : f.status === "error" ? (
                  <FiX className="text-danger" size={14} />
                ) : f.status === "downloading" ? (
                  <FiDownload className="text-brand animate-pulse" size={14} />
                ) : (
                  <FiClock className="text-text-muted" size={14} />
                )}
              </div>
            </div>
            {f.status === "error" && f.error && (
              <div className="text-xs text-danger ml-6">{f.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

