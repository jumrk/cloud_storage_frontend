import { useEffect, useMemo, useRef, useState } from "react";
import { cancelUpload, getStatus, postChunk } from "@/lib/upload/uploadApi";

// ===== helpers =====
const calcChunkSize = (size) => {
  if (size < 1 * 1024 * 1024) return Math.max(1, Math.floor(size / 2));
  if (size < 10 * 1024 * 1024) return 2 * 1024 * 1024;
  if (size < 100 * 1024 * 1024) return 10 * 1024 * 1024;
  if (size < 1024 * 1024 * 1024) return 25 * 1024 * 1024;
  if (size < 10 * 1024 * 1024 * 1024) return 50 * 1024 * 1024;
  if (size < 50 * 1024 * 1024 * 1024) return 100 * 1024 * 1024;
  return 200 * 1024 * 1024;
};

const createChunks = (file) => {
  const size = file.size;
  const step = calcChunkSize(size);
  const chunks = [];
  let start = 0;
  while (start < size) {
    const end = Math.min(start + step, size);
    chunks.push({ start, end, size: end - start });
    start = end;
  }
  if (chunks.length === 1) {
    const half = Math.floor(size / 2);
    chunks[0] = { start: 0, end: half, size: half };
    chunks.push({ start: half, end: size, size: size - half });
  }
  return chunks;
};

const readChunk = (file, start, end) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.onerror = reject;
    r.readAsArrayBuffer(file.slice(start, end));
  });

// ===== hook chính =====
export function useUploadBatch(items, opts) {
  const { batchId, parentId, emptyFolders, onEachDone, onAllDone } = opts || {};

  const [files, setFiles] = useState(
    (items || []).map((it) => ({
      file: it.file,
      name: it.name,
      relativePath: it.relativePath,
      status: "pending", // pending | uploading | processing | success | error | cancelled
      progress: 0, // % theo assembledBytes
      chunks: createChunks(it.file),
      uploadId: undefined,
      error: null,
    }))
  );

  const statusPollersRef = useRef({});
  const cancelledRef = useRef({});
  const runningRef = useRef(false);
  const completedRef = useRef(false);

  const overallProgress = useMemo(() => {
    if (!files.length) return 0;
    const sum = files.reduce((a, f) => a + (Number(f.progress) || 0), 0);
    return Math.round(sum / files.length);
  }, [files]);

  const pollUntilDriveDone = (uploadId, idx, size) => {
    if (statusPollersRef.current[idx]) {
      clearInterval(statusPollersRef.current[idx]);
    }
    const tick = async () => {
      try {
        const st = await getStatus(uploadId);
        if (!st?.success) return;
        if (Number(st.nextDriveOffset) >= size || st.state === "COMPLETED") {
          clearInterval(statusPollersRef.current[idx]);
          delete statusPollersRef.current[idx];
          setFiles((prev) =>
            prev.map((f, i) =>
              i === idx ? { ...f, status: "success", progress: 100 } : f
            )
          );
          onEachDone &&
            onEachDone(idx, {
              ...files[idx],
              status: "success",
              progress: 100,
            });
        } else {
          setFiles((prev) =>
            prev.map((f, i) => (i === idx ? { ...f, status: "processing" } : f))
          );
        }
      } catch (e) {
        // ignore lỗi poll
      }
    };
    tick();
    statusPollersRef.current[idx] = setInterval(tick, 1500);
  };

  const sendChunk = async (uploadId, f, idx, chunkIdx) => {
    const ch = f.chunks[chunkIdx];
    const buf = await readChunk(f.file, ch.start, ch.end);
    const headers = {
      "Content-Type": "application/octet-stream",
      "X-Upload-Id": uploadId,
      "X-Chunk-Index": chunkIdx,
      "X-Total-Chunks": f.chunks.length,
      "X-File-Name": encodeURIComponent(f.name),
      "X-Mime-Type": encodeURIComponent(
        f.file.type || "application/octet-stream"
      ),
      "X-Parent-Id": encodeURIComponent(parentId || ""),
      "X-Is-First-Chunk": chunkIdx === 0 ? "1" : "0",
      "X-Is-Last-Chunk": chunkIdx === f.chunks.length - 1 ? "1" : "0",
      "X-File-Size": f.file.size,
      "X-Relative-Path": encodeURIComponent(f.relativePath || ""),
      "X-Batch-Id": encodeURIComponent(batchId || ""),
      "X-Chunk-Start": ch.start,
      "X-Chunk-End": ch.end,
    };
    if (emptyFolders && emptyFolders.length && idx === 0 && chunkIdx === 0) {
      headers["X-Empty-Folders"] = encodeURIComponent(
        JSON.stringify(emptyFolders)
      );
    }
    const data = await postChunk(buf, headers);
    return data; // { success, assembledBytes, ...}
  };

  const uploadOne = async (idx) => {
    if (cancelledRef.current[idx]) return;

    const thisUploadId = `${batchId}-${idx}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    setFiles((prev) =>
      prev.map((f, i) =>
        i === idx ? { ...f, uploadId: thisUploadId, status: "uploading" } : f
      )
    );

    const getCur = () => files[idx]; // snapshot getter (lưu ý: nếu muốn 100% tránh stale, có thể refactor sang reducer)

    for (let ci = 0; ci < getCur().chunks.length; ci++) {
      if (cancelledRef.current[idx]) {
        setFiles((prev) =>
          prev.map((ff, i) => (i === idx ? { ...ff, status: "cancelled" } : ff))
        );
        return;
      }
      try {
        const cur = getCur();
        const resp = await sendChunk(thisUploadId, cur, idx, ci);
        if (!resp?.success) throw new Error("Upload chunk thất bại");

        const pct = Math.max(
          0,
          Math.min(
            100,
            Math.round((Number(resp.assembledBytes || 0) / cur.file.size) * 100)
          )
        );
        const isLast = ci === cur.chunks.length - 1;

        setFiles((prev) =>
          prev.map((ff, i) =>
            i === idx
              ? {
                  ...ff,
                  progress: pct,
                  status: isLast ? "processing" : "uploading",
                }
              : ff
          )
        );

        if (isLast) {
          pollUntilDriveDone(thisUploadId, idx, cur.file.size);
        }
      } catch (e) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Upload chunk thất bại";
        setFiles((prev) =>
          prev.map((ff, i) =>
            i === idx ? { ...ff, status: "error", error: msg } : ff
          )
        );
        return;
      }
    }
  };

  const uploadAll = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    for (let i = 0; i < files.length; i++) {
      const cur = files[i];
      if (cur.status === "success" || cur.status === "cancelled") continue;
      await uploadOne(i);
      await new Promise((r) => setTimeout(r, 500)); // nghỉ nhẹ giữa file
    }
  };

  const cancel = async (idx) => {
    cancelledRef.current[idx] = true;
    const upId = files[idx]?.uploadId;
    if (statusPollersRef.current[idx]) {
      clearInterval(statusPollersRef.current[idx]);
      delete statusPollersRef.current[idx];
    }
    if (upId) {
      try {
        await cancelUpload(upId);
      } catch {}
    }
    setFiles((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, status: "cancelled" } : f))
    );
  };

  // Khi tất cả xong, gọi onAllDone
  useEffect(() => {
    const allDone =
      files.length > 0 &&
      files.every(
        (f) =>
          f.status === "success" ||
          f.status === "error" ||
          f.status === "cancelled"
      );
    if (allDone && !completedRef.current) {
      completedRef.current = true;
      const ok = files.filter((f) => f.status === "success").length;
      const hasErrors = files.some((f) => f.status === "error");
      onAllDone && onAllDone({ total: files.length, ok, hasErrors });
    }
  }, [files, onAllDone]);

  // Tự khởi chạy
  useEffect(() => {
    uploadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    files,
    overallProgress,
    cancel,
  };
}
