"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

const ITUNES_BASE = "https://itunes.apple.com/search";

const CATEGORY_PRESETS = [
  { id: "all", name: "Tất cả", term: "background music" },
  { id: "lofi", name: "Lo-Fi", term: "lofi chill" },
  { id: "ambient", name: "Ambient", term: "ambient" },
  { id: "pop", name: "Pop", term: "city pop" },
  { id: "jazz", name: "Jazz", term: "smooth jazz" },
  { id: "cinematic", name: "Cinematic", term: "epic cinematic" },
];

const FALLBACK_TRACKS = [
  {
    id: "fallback_lofi_1",
    title: "Late Night Sketching",
    artist: "Studio Lofi",
    cover:
      "https://images.unsplash.com/photo-1511376777868-611b54f68947?auto=format&fit=crop&w=400&q=60",
    duration: 152,
    tags: ["Lo-Fi", "Chill"],
    streamUrl:
      "https://cdn.pixabay.com/download/audio/2023/02/28/audio_c527969b38.mp3?filename=lofi-study-131680.mp3",
    category: "lofi",
    source: "Pixabay (Royalty-free)",
    __fallback: true,
  },
  {
    id: "fallback_ambient_1",
    title: "Foggy Morning",
    artist: "Cloud Harbor",
    cover:
      "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=400&q=60",
    duration: 188,
    tags: ["Ambient", "Calm"],
    streamUrl:
      "https://cdn.pixabay.com/download/audio/2021/12/24/audio_ae654d3d64.mp3?filename=ambient-piano-126271.mp3",
    category: "ambient",
    source: "Pixabay (Royalty-free)",
    __fallback: true,
  },
  {
    id: "fallback_pop_1",
    title: "City Lights",
    artist: "Neon Pulse",
    cover:
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=400&q=60",
    duration: 204,
    tags: ["Pop", "Uplifting"],
    streamUrl:
      "https://cdn.pixabay.com/download/audio/2023/03/20/audio_667ca86551.mp3?filename=city-pop-139253.mp3",
    category: "pop",
    source: "Pixabay (Royalty-free)",
    __fallback: true,
  },
];

function normalizeItunesTrack(track, categoryId = "all") {
  return {
    id: String(track.trackId || track.collectionId || track.artistId),
    title: track.trackName || track.collectionName || "Bài nhạc",
    artist: track.artistName || "Unknown",
    album: track.collectionName,
    cover: track.artworkUrl100
      ? track.artworkUrl100.replace("100x100", "400x400")
      : "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=60",
    duration: track.trackTimeMillis
      ? Math.round(track.trackTimeMillis / 1000)
      : 0,
    tags: [track.primaryGenreName].filter(Boolean),
    streamUrl: track.previewUrl,
    previewUrl: track.previewUrl,
    category: categoryId,
    source: "iTunes Preview",
  };
}

export default function useMusicLibrary() {
  const [categories] = useState(CATEGORY_PRESETS);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tracks, setTracks] = useState(FALLBACK_TRACKS);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const activeCategory =
        categories.find((c) => c.id === selectedCategory) || categories[0];
      const searchTerm = debouncedQuery || activeCategory?.term || "background";
      const params = new URLSearchParams({
        media: "music",
        entity: "song",
        limit: "24",
        term: searchTerm,
      });
      const res = await fetch(`${ITUNES_BASE}?${params.toString()}`);
      if (!res.ok) throw new Error("Unable to load tracks");
      const json = await res.json();
      const results = (json?.results || []).map((track) =>
        normalizeItunesTrack(track, selectedCategory)
      );
      if (!results.length) {
        setTracks(FALLBACK_TRACKS);
        setError("Không tìm thấy nhạc phù hợp, hiển thị dữ liệu mẫu.");
      } else {
        setTracks(results);
      }
    } catch (err) {
      console.error("Failed to load tracks:", err);
      setError("Không thể tải danh sách nhạc. Đang hiển thị dữ liệu mẫu.");
      setTracks(FALLBACK_TRACKS);
    } finally {
      setLoading(false);
    }
  }, [categories, selectedCategory, debouncedQuery]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, name: c.name })),
    [categories]
  );

  return {
    categories: categoryOptions,
    selectedCategory,
    setSelectedCategory: (id) => {
      setSelectedCategory(id);
      setDebouncedQuery("");
    },
    query,
    setQuery,
    debouncedQuery,
    tracks,
    loading,
    error,
    refresh: fetchTracks,
  };
}
