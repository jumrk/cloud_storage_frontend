import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function FilePreviewModal({ file, fileUrl, onClose }) {
  const t = useTranslations();
  const ext = file.name.split(".").pop().toLowerCase();
  const isText = ["txt", "md", "js", "json", "log", "csv"].includes(ext);

  useEffect(() => {
    console.log(fileUrl);
    if (isText && fileUrl) {
      fetch(fileUrl)
        .then((res) => res.text())
        .then(setTextContent)
        .catch(() => setTextContent(t("file.preview.cannot_preview")));
    }
  }, [fileUrl, isText, t]);

  // Helper chuyển link Google Drive sang /preview nếu là /view
  function getEmbedUrl(url) {
    if (!url) return "";
    if (url.includes("drive.google.com") && url.includes("/view")) {
      return url.replace("/view", "/preview");
    }
    return url;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col relative">
        <button
          className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-gray-700 z-10"
          onClick={onClose}
          title={t("file.preview.close")}
        >
          ×
        </button>
        <div className="p-6 flex-1 flex flex-col h-full">
          <div className="mb-4 font-semibold text-lg text-center break-all">
            {file.name}
          </div>
          {fileUrl ? (
            <iframe
              src={getEmbedUrl(fileUrl)}
              title={file.name}
              width="100%"
              height="100%"
              allow="autoplay"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 mt-6">
              <div className="text-gray-500">
                {t("file.preview.cannot_preview")}
              </div>
              <a
                href={fileUrl}
                download={file.name}
                className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary/90 transition"
              >
                {t("file.action.download")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
