// splitFileName: tách tên và đuôi file
export function splitFileName(name) {
  const lastDot = name.lastIndexOf(".");
  if (lastDot === -1) return { base: name, ext: "" };
  return { base: name.slice(0, lastDot), ext: name.slice(lastDot) };
}

// checkFileType: trả về loại file
export function checkFileType(name) {
  if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(name)) return "image";
  if (/\.(mp4|webm|ogg)$/i.test(name)) return "video";
  if (/\.(mp3|wav|ogg)$/i.test(name)) return "audio";
  if (/\.(pdf)$/i.test(name)) return "pdf";
  return "other";
}

// Định dạng dung lượng file (bytes -> B, KB, MB, GB, TB)
export function formatSize(bytes) {
  if (bytes === 0 || bytes === undefined) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
