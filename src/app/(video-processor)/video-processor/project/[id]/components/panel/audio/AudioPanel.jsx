import React, { useMemo, useRef, useState, useEffect } from "react";
import { Play, Pause, RefreshCcw, Music2, Search } from "lucide-react";
import toast from "react-hot-toast";
import useMusicLibrary from "../../../hooks/useMusicLibrary";
import { useTimeline } from "../../../context/TimelineContext";
import { useTranslations } from "next-intl";

const AudioPanel = () => {
  const t = useTranslations();
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    query,
    setQuery,
    tracks,
    loading,
    error,
    refresh,
  } = useMusicLibrary();
  const { currentTime } = useTimeline() || {};

  const audioRef = useRef(null);
  const [previewingId, setPreviewingId] = useState(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const handleEnded = () => setPreviewingId(null);
    el.addEventListener("ended", handleEnded);
    return () => el.removeEventListener("ended", handleEnded);
  }, []);

  const handlePreview = (track) => {
    if (!track?.streamUrl) {
      toast.error(t("video_processor.inspector.panel.audio.no_preview_url"));
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    if (previewingId === track.id) {
      el.pause();
      setPreviewingId(null);
      return;
    }
    el.src = track.streamUrl;
    el.currentTime = 0;
    el.play()
      .then(() => setPreviewingId(track.id))
      .catch(() => {
        toast.error(t("video_processor.inspector.panel.audio.cannot_play_preview"));
        setPreviewingId(null);
      });
  };

  const rid = () => `music_${Math.random().toString(36).slice(2)}`;

  const formatDuration = (duration) => {
    if (!duration || Number.isNaN(duration)) return "00:00";
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleAddToTimeline = (track) => {
    const duration = track.duration || 60;
    const clip = {
      id: rid(),
      type: "audio",
      name: track.title || "Audio",
      label: track.title || "Audio",
      start: Number.isFinite(currentTime) ? currentTime : 0,
      duration,
      durationSec: duration,
      volume: 1,
      useAudio: true,
      assetId: null,
      streamUrl: track.streamUrl,
      url: track.streamUrl,
      cover: track.cover,
      artist: track.artist,
      source: track.source,
      speed: 1,
    };

    window.dispatchEvent(
      new CustomEvent("timeline.addClips", {
        detail: {
          lane: "audio",
          clips: [clip],
        },
      })
    );

    toast.success(t("video_processor.inspector.panel.audio.added_to_timeline"));
  };

  const placeholderCards = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, idx) => (
        <div
          key={`skeleton-${idx}`}
          className="rounded-xl border border-border/60 bg-surface-50 p-3 animate-pulse space-y-3"
        >
          <div className="h-32 rounded-lg bg-white/60" />
          <div className="h-4 rounded bg-white/80" />
          <div className="h-3 rounded bg-white/70 w-2/3" />
          <div className="flex gap-2">
            <div className="h-8 flex-1 rounded bg-white/70" />
            <div className="h-8 w-16 rounded bg-white/70" />
          </div>
        </div>
      )),
    []
  );

  const favoriteTracks = useMemo(() => tracks.slice(0, 2), [tracks]);
  const suggestedTracks = useMemo(() => tracks.slice(2, 8), [tracks]);

  const quickFilters = [
    "background music",
    "phonk",
    "happy",
    "lofi",
    "cinematic",
  ];

  const overlayTitles = {
    favorites: t("video_processor.inspector.panel.audio.favorites"),
    categories: t("video_processor.inspector.panel.audio.categories"),
    suggested: t("video_processor.inspector.panel.audio.suggested"),
  };

  const [activeOverlay, setActiveOverlay] = useState(null);
  const closeOverlay = () => setActiveOverlay(null);

  return (
    <aside className="relative w-full max-w-full shrink-0 h-full flex flex-col bg-white text-text-strong">
      <header className="h-16 border-b border-border px-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 grid place-items-center text-brand-600">
            <Music2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-semibold">{t("video_processor.inspector.panel.audio.title")}</div>
            <p className="text-xs text-text-muted">
              {t("video_processor.inspector.panel.audio.description")}
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-brand-600"
        >
          <RefreshCcw className="w-4 h-4" />
          {t("video_processor.inspector.panel.audio.refresh")}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-brand-200 scrollbar-track-transparent">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("video_processor.inspector.panel.audio.search_placeholder")}
              className="w-full rounded-2xl bg-surface-50 border border-border pl-11 pr-4 py-2.5 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand-600 text-xs uppercase tracking-wide">
              {t("video_processor.inspector.panel.audio.filter")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setQuery(filter)}
                className="px-3 py-1.5 rounded-full text-xs bg-surface-100 text-text-muted hover:bg-brand-50 hover:text-brand-600 transition border border-border/60"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <section className="space-y-3 bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("video_processor.inspector.panel.audio.favorites")}</h3>
            <button
              className="text-xs text-text-muted hover:text-brand-600"
              onClick={() => setActiveOverlay("favorites")}
            >
              {t("video_processor.inspector.panel.audio.view_all")}
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {(loading ? placeholderCards.slice(0, 2) : favoriteTracks).map(
              (track, idx) =>
                loading ? (
                  <div key={`fav-skeleton-${idx}`} className="w-56">
                    {track}
                  </div>
                ) : (
                  <div
                    key={track.id}
                    className="min-w-[14rem] bg-surface-50 rounded-2xl p-3 flex items-center gap-3 shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-100">
                      {track.cover ? (
                        <img
                          src={track.cover}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-text-muted">
                          <Music2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold line-clamp-1">
                        {track.title}
                      </div>
                      <div className="text-xs text-text-muted line-clamp-1">
                        {track.artist}
                      </div>
                      <span className="text-[11px] text-brand-600">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddToTimeline(track)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-400"
                    >
                      +
                    </button>
                  </div>
                )
            )}
          </div>
        </section>

        <section className="space-y-3 bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("video_processor.inspector.panel.audio.categories")}</h3>
            <button
              className="text-xs text-text-muted hover:text-brand-600"
              onClick={() => setActiveOverlay("categories")}
            >
              {t("video_processor.inspector.panel.audio.view_all")}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.slice(0, 6).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`h-24 rounded-2xl relative overflow-hidden transition ${
                  selectedCategory === category.id
                    ? "bg-brand-50 text-brand-700 shadow-sm"
                    : "bg-surface-50 text-text-muted hover:bg-white"
                }`}
              >
                <span className="relative z-10 text-sm font-semibold capitalize">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{t("video_processor.inspector.panel.audio.suggested")}</h3>
              <span className="text-xs text-text-muted">
                {t("video_processor.inspector.panel.audio.tracks_count", { count: tracks.length })}
              </span>
            </div>
            <button
              className="text-xs text-text-muted hover:text-brand-600"
              onClick={() => setActiveOverlay("suggested")}
            >
              {t("video_processor.inspector.panel.audio.view_all")}
            </button>
          </div>
          {error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {error}
            </div>
          ) : null}
          <div className="grid gap-3">
            {loading
              ? placeholderCards
              : (suggestedTracks.length ? suggestedTracks : tracks).map(
                  (track) => (
                    <div
                      key={track.id}
                      className="rounded-2xl bg-surface-50 p-3 flex items-center gap-3 shadow-sm"
                    >
                      <button
                        onClick={() => handlePreview(track)}
                        className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100 transition"
                      >
                        {previewingId === track.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold line-clamp-1">
                          {track.title}
                        </div>
                        <div className="text-xs text-text-muted line-clamp-1">
                          {track.artist}
                        </div>
                      </div>
                      <div className="text-xs text-text-muted tabular-nums">
                        {formatDuration(track.duration)}
                      </div>
                      <button
                        onClick={() => handleAddToTimeline(track)}
                        className="text-xs font-semibold px-4 py-1.5 rounded-full bg-brand-600 text-white hover:bg-brand-500"
                      >
                        {t("video_processor.inspector.panel.audio.add")}
                      </button>
                    </div>
                  )
                )}
          </div>
        </section>
      </div>

      <audio ref={audioRef} className="hidden" crossOrigin="anonymous" />

      {activeOverlay && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted mb-0.5">
                  {activeOverlay === "favorites"
                    ? t("video_processor.inspector.panel.audio.favorites_list")
                    : activeOverlay === "categories"
                    ? t("video_processor.inspector.panel.audio.categories_list")
                    : t("video_processor.inspector.panel.audio.suggested_tracks")}
                </p>
                <h3 className="text-lg font-semibold text-text-strong">
                  {overlayTitles[activeOverlay]}
                </h3>
              </div>
              <button
                onClick={closeOverlay}
                className="text-sm text-text-muted hover:text-brand-600"
              >
                {t("video_processor.inspector.panel.audio.close")}
              </button>
            </header>
            <div className="flex-1 overflow-auto p-5 space-y-4">
              {activeOverlay === "favorites" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {(favoriteTracks.length ? favoriteTracks : tracks).map(
                    (track) => (
                      <div
                        key={`overlay-fav-${track.id}`}
                        className="rounded-2xl bg-surface-50 p-4 flex items-center gap-4 shadow-sm"
                      >
                        <button
                          onClick={() => handlePreview(track)}
                          className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100 transition"
                        >
                          {previewingId === track.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold line-clamp-1">
                            {track.title}
                          </div>
                          <div className="text-xs text-text-muted line-clamp-1">
                            {track.artist}
                          </div>
                        </div>
                        <div className="text-xs text-text-muted tabular-nums">
                          {formatDuration(track.duration)}
                        </div>
                        <button
                          onClick={() => handleAddToTimeline(track)}
                          className="text-xs font-semibold px-4 py-1.5 rounded-full bg-brand-600 text-white hover:bg-brand-500"
                        >
                          {t("video_processor.inspector.panel.audio.add")}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              {activeOverlay === "categories" && (
                <div className="grid gap-3 sm:grid-cols-3">
                  {categories.map((category) => (
                    <button
                      key={`overlay-cat-${category.id}`}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        closeOverlay();
                      }}
                      className={`h-28 rounded-2xl flex flex-col items-center justify-center transition ${
                        selectedCategory === category.id
                          ? "bg-brand-50 text-brand-700 shadow"
                          : "bg-surface-50 text-text-muted hover:bg-white"
                      }`}
                    >
                      <span className="text-sm font-semibold">
                        {category.name}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {t("video_processor.inspector.panel.audio.click_to_view")}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {activeOverlay === "suggested" && (
                <div className="space-y-3">
                  {(tracks.length ? tracks : suggestedTracks).map((track) => (
                    <div
                      key={`overlay-suggest-${track.id}`}
                      className="rounded-2xl bg-surface-50 p-4 flex items-center gap-4 shadow-sm"
                    >
                      <button
                        onClick={() => handlePreview(track)}
                        className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-100 transition"
                      >
                        {previewingId === track.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold line-clamp-1">
                          {track.title}
                        </div>
                        <div className="text-xs text-text-muted line-clamp-1">
                          {track.artist}
                        </div>
                      </div>
                      <div className="text-xs text-text-muted tabular-nums">
                        {formatDuration(track.duration)}
                      </div>
                      <button
                        onClick={() => handleAddToTimeline(track)}
                        className="text-xs font-semibold px-4 py-1.5 rounded-full bg-brand-600 text-white hover:bg-brand-500"
                      >
                        {t("video_processor.inspector.panel.audio.add")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default AudioPanel;
