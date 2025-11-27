import axiosClient from "@/shared/lib/axiosClient";
import { useMemo, useRef, useState } from "react";
import { Video, Image as ImageIcon, Music2, FileText } from "lucide-react";

export default function useMediaPanel({ idProject }) {
  const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024;
  const CONCURRENCY = 4;
  const ASSETS_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "";

  const TABS = [
    { key: "all", label: "All", icon: null },
    { key: "video", label: "Videos", icon: Video },
    { key: "audio", label: "Audio", icon: Music2 },
    { key: "image", label: "Images", icon: ImageIcon },
    { key: "subtitle", label: "Subtitles", icon: FileText },
  ];

  const VIDEO_EXT = ["mp4", "mov", "mkv", "webm"];
  const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "tiff"];
  const AUDIO_EXT = ["mp3", "wav", "aac", "m4a", "ogg", "flac"];
  const SUB_EXT = ["srt", "vtt", "ass", "ssa", "sbv", "sub", "ttml", "dfxp"];

  const [active, setActive] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  function toAssetUrl(key) {
    if (!key) return "";
    const base = ASSETS_BASE_URL
      ? ASSETS_BASE_URL.replace(/\/$/, "")
      : (typeof window !== "undefined" ? window.location.origin : "").replace(
          /\/$/,
          ""
        );
    return `${base}/${key}`;
  }

  function apiBase() {
    const base =
      (axiosClient.defaults && axiosClient.defaults.baseURL) ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return base ? base.replace(/\/$/, "") : "";
  }

  async function loadMedia(page = 1, limit = 60) {
    try {
      setLoading(true);
      const { data } = await axiosClient.get(
        `/api/video-processor/project/${idProject}/media`,
        { params: { page, limit, sort: "-createdAt", scope: "media" } }
      );
      const mapped = (data?.items || []).map(mapServerAssetToCardItem);
      setItems(mapped);
    } finally {
      setLoading(false);
    }
  }

  function mapServerAssetToCardItem(a) {
    const thumbFromMap =
      a?.thumbs?.["174x98"]?.url ||
      a?.thumbs?.["320x180"]?.url ||
      (a?.thumbs ? Object.values(a.thumbs).find((t) => t?.url)?.url : null);

    const thumb =
      a.type === "video"
        ? a.coverUrl || thumbFromMap || null
        : a.coverUrl || a.fileUrl || null;

    const src = a.type === "video" ? null : a.fileUrl || null;

    return {
      id: a.id,
      type: a.type,
      name: a.name,
      durationSec: a.durationSec || 0,
      thumb,
      src,
      status: "done",
      progress: 100,
      serverAsset: a,
    };
  }

  const filtered = useMemo(() => {
    if (active === "all") return items;
    return items.filter((i) => i.type === active);
  }, [active, items]);

  function openPicker() {
    inputRef.current?.click();
  }

  function updateItem(id, patch) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function handleFiles(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    const mapped = arr.map((f, idx) => {
      const ext = (f.name.split(".").pop() || "").toLowerCase();

      let type = "other";
      if (VIDEO_EXT.includes(ext)) type = "video";
      else if (IMAGE_EXT.includes(ext)) type = "image";
      else if (AUDIO_EXT.includes(ext)) type = "audio";
      else if (SUB_EXT.includes(ext)) type = "subtitle";

      const url = URL.createObjectURL(f);

      return {
        id: `${Date.now()}_${idx}`,
        type,
        name: f.name,
        thumb: type === "image" || type === "video" ? url : undefined,
        src: type === "image" || type === "audio" ? url : undefined,
        file: f,
        status: "queued",
        progress: 0,
      };
    });

    setItems((prev) => [...mapped, ...prev]);
    mapped.forEach((it) => startChunkUpload(it));
  }

  async function startChunkUpload(item) {
    updateItem(item.id, { status: "uploading", progress: 0 });
    try {
      if (!idProject) throw new Error("Thiếu idProject");

      const initRes = await axiosClient.post(
        "/api/video-processor/uploads/init",
        {
          projectId: idProject,
          name: item.name,
          size: item.file.size,
          mimeType: item.file.type,
        }
      );
      if (!initRes.data?.success)
        throw new Error(initRes.data?.message || "Init thất bại");

      const { uploadId, chunkSize } = initRes.data;
      const SIZE = Number(chunkSize) || DEFAULT_CHUNK_SIZE;

      const chunks = [];
      for (
        let offset = 0, partNumber = 1;
        offset < item.file.size;
        offset += SIZE, partNumber++
      ) {
        const blob = item.file.slice(offset, offset + SIZE);
        chunks.push({ partNumber, blob, size: blob.size });
      }

      let completedBytes = 0;
      const live = new Map();
      let cursor = 0;

      async function worker() {
        while (cursor < chunks.length) {
          const idx = cursor++;
          const { partNumber, blob, size } = chunks[idx];

          await axiosClient.post("/api/video-processor/uploads/url", {
            projectId: idProject,
            uploadId,
            partNumber,
          });

          const putUrl = `${apiBase()}/api/video-processor/uploads/part?uploadId=${encodeURIComponent(
            uploadId
          )}&partNumber=${encodeURIComponent(partNumber)}`;

          let lastLoaded = 0;
          await axiosClient.put(putUrl, blob, {
            headers: { "Content-Type": "application/octet-stream" },
            onUploadProgress: (e) => {
              lastLoaded = e.loaded;
              live.set(partNumber, e.loaded);
              let liveBytes = 0;
              for (const v of live.values()) liveBytes += v;
              const pct = Math.min(
                99,
                Math.floor(
                  ((completedBytes + liveBytes) / item.file.size) * 100
                )
              );
              updateItem(item.id, { progress: pct });
            },
            withCredentials:
              axiosClient.defaults && axiosClient.defaults.withCredentials,
          });

          live.delete(partNumber);
          completedBytes += size;
          const pctDone = Math.min(
            99,
            Math.floor((completedBytes / item.file.size) * 100)
          );
          updateItem(item.id, { progress: pctDone });
        }
      }

      const workers = Array.from(
        { length: Math.min(CONCURRENCY, chunks.length) },
        () => worker()
      );
      await Promise.all(workers);

      const doneRes = await axiosClient.post(
        "/api/video-processor/uploads/complete",
        {
          projectId: idProject,
          uploadId,
        }
      );
      if (!doneRes.data?.success)
        throw new Error(doneRes.data?.message || "Complete thất bại");

      const asset = doneRes.data.asset || {};
      const primaryThumbKey = doneRes.data.primaryThumbKey;
      const thumbsObj = doneRes.data.thumbs || {};
      const prefThumbKey =
        primaryThumbKey ||
        (thumbsObj && thumbsObj["174x98"]?.key) ||
        (thumbsObj && Object.values(thumbsObj)[0]?.key) ||
        null;

      const thumbUrl = prefThumbKey ? toAssetUrl(prefThumbKey) : item.thumb;

      updateItem(item.id, {
        status: "done",
        progress: 100,
        serverAsset: asset,
        thumb: thumbUrl,
        src: item.type === "video" ? null : item.src,
      });

      loadMedia();
    } catch {
      updateItem(item.id, { status: "error" });
    }
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }

  return {
    active,
    items,
    loading,
    inputRef,
    DEFAULT_CHUNK_SIZE,
    CONCURRENCY,
    ASSETS_BASE_URL,
    TABS,
    idProject,
    filtered,
    setActive,
    setItems,
    setLoading,
    toAssetUrl,
    apiBase,
    loadMedia,
    mapServerAssetToCardItem,
    openPicker,
    updateItem,
    handleFiles,
    startChunkUpload,
    onDrop,
  };
}
