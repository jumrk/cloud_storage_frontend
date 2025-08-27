export function calcChunkSize(fileSize) {
  if (fileSize <= 100 * 1024 * 1024) return fileSize;
  const target = 100,
    MIN = 5 * 1024 * 1024,
    MAX = 64 * 1024 * 1024;
  return Math.min(Math.max(Math.ceil(fileSize / target), MIN), MAX);
}

export function sliceFileIntoChunks(file, overrideChunkSize) {
  const chunkSize = overrideChunkSize || calcChunkSize(file.size);
  const chunks = [];
  let offset = 0,
    index = 0;
  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size);
    chunks.push({ index, start: offset, end, blob: file.slice(offset, end) });
    offset = end;
    index++;
  }
  return { chunks, chunkSize };
}
