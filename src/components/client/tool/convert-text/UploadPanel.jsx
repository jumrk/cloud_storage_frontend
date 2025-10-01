"use client";

import { useEffect } from "react";

import SegmentTable from "./SegmentTable";
import { useUploadPanel } from "@/hooks/leader/tools/convert-text/useUploadPanel";

const PlayIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
    <path d="M4 3.5v13l12-6.5-12-6.5z" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current">
    <path d="M5 4h4v12H5zM11 4h4v12h-4z" />
  </svg>
);
const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"
    ></path>
  </svg>
);

export default function UploadPanel({
  voiceOptions,
  inheritVoice,
  onSnapshot,
  modelId,
  stability,
  similarity,
}) {
  const {
    fileInfo,
    audioRef,
    urlRef,
    abortRef,
    onSnapshotRef,
    loadingId,
    prevSnapKeyRef,
    filteredSegments,
    playingId,
    fileType,
    segments,
    speakers,
    speakerMap,
    filterText,
    setFilterText,
    toSec,
    applyDefaultToEmpty,
    handleFile,
    previewSpeaker,
    previewRow,
    updateSpeakerMap,
    addSpeaker,
    removeSpeaker,
    renameSpeaker,
    setRowSpeaker,
  } = useUploadPanel(
    voiceOptions,
    inheritVoice,
    onSnapshot,
    modelId,
    stability,
    similarity
  );
  useEffect(() => {
    onSnapshotRef.current = onSnapshot;
  }, [onSnapshot]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    const segmentsWithVoice = segments.map((s) => ({
      ...s,
      voiceId: s.speaker ? speakerMap[s.speaker]?.voiceId || null : null,
      start: toSec(s.start),
      end: toSec(s.end),
    }));

    const fingerprint = JSON.stringify({
      t: fileType || "",
      seg: segmentsWithVoice.map((s) => [
        s.idx,
        s.speaker || "",
        s.voiceId || "",
        s.text || "",
      ]),
      sp: speakers.map((sp) => [sp.id, sp.label || "", sp.count || 0]),
      vm: Object.entries(speakerMap)
        .map(([id, m]) => [id, m.label || "", m.voiceId || ""])
        .sort(),
    });

    if (prevSnapKeyRef.current !== fingerprint) {
      prevSnapKeyRef.current = fingerprint;
      onSnapshotRef.current?.({
        type: fileType,
        segments: segmentsWithVoice,
        speakers,
        voiceMap: speakerMap,
      });
    }
  }, [segments, speakers, speakerMap, fileType]);
  return (
    <>
      {/* Chọn file */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-slate-800">Tải tệp phụ đề</h3>
            <p className="text-xs text-slate-500">
              Hỗ trợ .srt / .ass • Ưu tiên Name/Actor của .ass
            </p>
          </div>
          {fileInfo && (
            <div className="text-xs text-slate-500">
              {fileInfo.name} • {(fileInfo.size / 1024).toFixed(0)} KB
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-300 cursor-pointer hover:bg-slate-50 text-slate-700">
            <input
              type="file"
              accept=".srt,.ass"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            Chọn tệp…
          </label>

          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Tìm theo text/nhân vật…"
            className="px-3 py-2 text-sm rounded-xl border border-slate-300"
          />
        </div>
      </div>

      {/* Nhân vật & giọng */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-slate-800">Nhân vật & giọng</h3>
          <div className="text-xs text-slate-500">
            Giọng mặc định:{" "}
            {inheritVoice?.label ||
              inheritVoice?.name ||
              inheritVoice?.id ||
              "—"}
          </div>
        </div>

        {!speakers.length && (
          <div className="text-sm text-slate-600 mb-2">
            Chưa có nhân vật từ file — hãy thêm nhân vật để gán giọng cho các
            dòng.
          </div>
        )}

        <div className="grid grid-cols-1 overflow-auto max-h-[560px] gap-3">
          {speakers.map((sp) => {
            const cur = speakerMap[sp.id] || {};
            const chosenId = cur.voiceId || inheritVoice?.id;
            const isLoading = loadingId === sp.id;
            const isPlaying = playingId === sp.id;
            return (
              <div
                key={sp.id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={cur.label ?? sp.label}
                      onChange={(e) => {
                        renameSpeaker(sp.id, e.target.value);
                        updateSpeakerMap(sp.id, { label: e.target.value });
                      }}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                      placeholder={sp.id}
                    />
                    <span className="text-xs text-slate-500">
                      ({sp.count} dòng)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-80">
                    <select
                      value={cur.voiceId || ""}
                      onChange={(e) =>
                        updateSpeakerMap(sp.id, { voiceId: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    >
                      <option value="">— Kế thừa giọng mặc định —</option>
                      {voiceOptions.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label || v.name || v.id}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => previewSpeaker(sp.id, chosenId)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
                      title={isPlaying ? "Tạm dừng" : "Nghe thử"}
                    >
                      {isLoading ? (
                        <Spinner />
                      ) : isPlaying ? (
                        <PauseIcon />
                      ) : (
                        <PlayIcon />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSpeaker(sp.id)}
                      className="px-2 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-rose-50"
                      title="Xoá nhân vật"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={addSpeaker}
            className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            + Thêm nhân vật
          </button>

          {speakers.length > 0 && (
            <>
              <span className="text-sm text-slate-500">
                Gán cho dòng trống:
              </span>
              <select
                onChange={(e) => {
                  applyDefaultToEmpty(e.target.value);
                  e.target.value = "";
                }}
                defaultValue=""
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="" disabled>
                  Chọn nhân vật…
                </option>
                {speakers.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {speakerMap[sp.id]?.label ?? sp.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Bảng thoại */}
      <div className="rounded-2xl border border-slate-200 bg-white mt-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h3 className="font-medium text-slate-800">Bảng thoại</h3>
          <div className="text-xs text-slate-500">{segments.length} dòng</div>
        </div>

        <SegmentTable
          segments={filteredSegments}
          speakers={speakers}
          speakerMap={speakerMap}
          onChangeRowSpeaker={setRowSpeaker}
          onPreviewRow={previewRow}
          inheritVoice={inheritVoice}
        />
      </div>
    </>
  );
}
