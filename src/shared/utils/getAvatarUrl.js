const apiBase =
  process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE_URL || "";
const normalizedApiBase = apiBase.replace(/\/$/, "");

export default function getAvatarUrl(path) {
  if (!path) return "/images/avatar_empty.png";
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!normalizedApiBase) return normalizedPath;
  return `${normalizedApiBase}${normalizedPath}`;
}

