"use client";

import { useEffect } from "react";
import ModeTabs from "./ModeTabs";
import MultiVoice from "./MultiVoice";
import UploadPanel from "./UploadPanel";
import ControlNav from "./ControlNav";
import SingleVoice from "./SingleVoice";
import useConvertText from "@/hooks/leader/tools/convert-text/useConvertText";

export default function Convert_Text_To_Voice() {
  const {
    mode,
    voices,
    loadingVoices,
    voiceSource,
    myVoices,
    loadingMyVoices,
    globalVoice,
    modelId,
    speed,
    stability,
    similarity,
    format,
    sampleRate,
    isGenerating,
    outputUrl,
    outputMime,
    genError,
    urlRef,
    sseRef,
    isProcessing,
    progress,
    singleStyle,
    singleText,
    multiStyle,
    multiSpeakers,
    effectiveVoiceOptions,
    inheritVoice,
    canRender,
    setMode,
    setVoiceSource,
    setGlobalVoice,
    setModelId,
    setSpeed,
    setStability,
    setSimilarity,
    setFormat,
    setSampleRate,
    setSingleStyle,
    setSingleText,
    setMultiStyle,
    setMultiSpeakers,
    refreshMyVoices,
    handleUploadSnapshot,
    resetAll,
    fetchDefaultVoice,
    handleGenerate,
  } = useConvertText();
  useEffect(() => {
    if (voiceSource === "cloned") refreshMyVoices();
  }, [voiceSource, refreshMyVoices]);

  useEffect(() => {
    fetchDefaultVoice();
  }, []);

  useEffect(() => {
    return () => {
      if (sseRef.current) sseRef.current.close();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  // flag disable toàn UI
  const disabledAll = isProcessing || isGenerating;

  return (
    <div className="relative px-6 py-6">
      {/* overlay khóa UI khi đang xử lý */}
      {disabledAll && (
        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-start justify-center">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <div className="font-medium text-slate-800 mb-2">
              {isProcessing ? "Đang xử lý" : "Đang tạo…"}
            </div>
            {isProcessing && (
              <div className="w-72">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-slate-600 text-right">
                  {progress}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Chuyển đổi văn bản
          </h1>
          <p className="text-sm text-slate-500">
            Chọn chế độ nhập liệu ở trên. Bên phải là thiết lập giọng.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 disabled:opacity-50"
            onClick={resetAll}
            disabled={disabledAll}
          >
            Làm mới
          </button>
          <button
            disabled={!canRender || disabledAll}
            className={`px-4 py-2 rounded-xl ${
              canRender && !disabledAll
                ? "bg-slate-800 hover:bg-slate-900 text-white"
                : "bg-slate-300 text-white"
            }`}
            onClick={handleGenerate}
          >
            {isProcessing
              ? `Đang phân tích… ${progress}%`
              : isGenerating
              ? "Đang tạo…"
              : "Tạo giọng"}
          </button>
        </div>
      </div>

      <ModeTabs mode={mode} setMode={setMode} />

      <div className="grid grid-cols-12 gap-6 mt-4">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {mode === "single" && (
            <SingleVoice
              stylePrompt={singleStyle}
              setStylePrompt={setSingleStyle}
              text={singleText}
              setText={setSingleText}
            />
          )}

          {mode === "multi" && (
            <MultiVoice
              stylePrompt={multiStyle}
              setStylePrompt={setMultiStyle}
              speakers={multiSpeakers}
              setSpeakers={setMultiSpeakers}
              voiceOptions={effectiveVoiceOptions}
              inheritVoice={inheritVoice}
              modelId={modelId}
              stability={stability}
              similarity={similarity}
            />
          )}

          {mode === "upload" && (
            <UploadPanel
              voiceOptions={effectiveVoiceOptions}
              inheritVoice={inheritVoice}
              onSnapshot={handleUploadSnapshot}
              modelId={modelId}
              stability={stability}
              similarity={similarity}
            />
          )}

          {outputUrl && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="font-medium text-slate-800 mb-3">Kết quả</h3>
              {genError && (
                <div className="text-sm text-red-600 mb-2">{genError}</div>
              )}
              <div className="space-y-3">
                <audio src={outputUrl} controls className="w-full" />
                <div className="flex items-center gap-3">
                  <a
                    href={outputUrl}
                    download={`tts-${mode}.${
                      outputMime.includes("mpeg") ? "mp3" : "wav"
                    }`}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
                  >
                    Tải xuống
                  </a>
                  <span className="text-xs text-slate-500">
                    Định dạng:{" "}
                    {outputMime ||
                      (format === "mp3" ? "audio/mpeg" : "audio/wav")}
                  </span>
                </div>
              </div>
            </div>
          )}
          {!outputUrl && genError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
              {genError}
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <ControlNav
            globalVoice={globalVoice}
            setGlobalVoice={setGlobalVoice}
            modelId={modelId}
            setModelId={setModelId}
            speed={speed}
            setSpeed={setSpeed}
            stability={stability}
            setStability={setStability}
            similarity={similarity}
            setSimilarity={setSimilarity}
            format={format}
            setFormat={setFormat}
            sampleRate={sampleRate}
            setSampleRate={setSampleRate}
            voiceOptions={voices}
            loadingVoices={loadingVoices}
            voiceSource={voiceSource}
            setVoiceSource={setVoiceSource}
            myVoices={myVoices}
            loadingMyVoices={loadingMyVoices}
            refreshMyVoices={refreshMyVoices}
            onReset={() => {
              setModelId("eleven_multilingual_v2");
              setSpeed(1);
              setStability(0.5);
              setSimilarity(0.75);
            }}
          />
        </div>
      </div>
    </div>
  );
}
