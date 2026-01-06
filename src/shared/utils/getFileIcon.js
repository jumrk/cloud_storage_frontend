import { extMap } from "./extMap";

export function getFileIcon({ type, name }) {
  if (type === "folder") return "/images/icon/folder.png";
  if (!name) return "/images/icon/word.png";
  const ext = name.split(".").pop().toLowerCase();

  return `/images/icon/${extMap[ext] || "word.png"}`;
}
