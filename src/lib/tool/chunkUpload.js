// Bộ điều khiển upload + progress + hủy
import axiosClient from "@/lib/axiosClient";
import { sliceFileIntoChunks } from "./chunkTools";

export function uploadInChunks({
  file,
  initUrl,
  chunkUrl,
  completeUrl,
  extraInitPayload = {},
  concurrency = 4,
  onProgress, // ({ sent, totalBytes, percent })
  onStageChange, // ("init"|"upload"|"complete")
}) {
  const mainCtrl = new AbortController();
  const chunkCtrls = [];
  const perChunkLoaded = new Map();
  let canceled = false;

  function cancel() {
    canceled = true;
    try {
      mainCtrl.abort();
    } catch {}
    for (const c of chunkCtrls) {
      try {
        c.abort();
      } catch {}
    }
  }

  async function start() {
    onStageChange?.("init");
    const { data: initJson } = await axiosClient.post(
      initUrl,
      {
        filename: file.name,
        size: file.size,
        mime: file.type,
        ...extraInitPayload,
      },
      { signal: mainCtrl.signal }
    );
    const uploadId = initJson?.uploadId;
    if (!uploadId) throw new Error("Không nhận được uploadId");

    const { chunks } = sliceFileIntoChunks(
      file,
      initJson?.recommendedChunkSize
    );
    const total = chunks.length;
    const pool = Math.min(Math.max(1, concurrency), total);

    onStageChange?.("upload");

    let q = 0;
    const update = (i, loaded) => {
      perChunkLoaded.set(i, loaded);
      if (onProgress) {
        let sent = 0;
        perChunkLoaded.forEach((v) => (sent += v));
        onProgress({
          sent,
          totalBytes: file.size,
          percent: (sent / file.size) * 100,
        });
      }
    };

    async function worker() {
      while (!canceled) {
        const i = q++;
        if (i >= total) break;
        const part = chunks[i];

        const form = new FormData();
        form.append("uploadId", uploadId);
        form.append("index", String(part.index));
        form.append("total", String(total));
        form.append("chunk", part.blob, `${file.name}.part-${part.index}`);

        const c = new AbortController();
        chunkCtrls.push(c);

        await axiosClient.post(chunkUrl, form, {
          signal: c.signal,
          onUploadProgress: (e) => {
            if (typeof e.loaded === "number") update(i, e.loaded);
          },
          headers: { "Content-Type": "multipart/form-data" },
        });

        update(i, part.blob.size);
      }
    }

    await Promise.all(new Array(pool).fill(0).map(worker));
    if (canceled) throw new Error("canceled");

    onStageChange?.("complete");
    const { data: outJson } = await axiosClient.post(
      completeUrl,
      { uploadId, ...extraInitPayload },
      { signal: mainCtrl.signal }
    );
    return outJson;
  }

  return { start, cancel };
}
