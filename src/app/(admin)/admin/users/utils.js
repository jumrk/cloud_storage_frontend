export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

export function formatStorage(bytes) {
  if (!bytes && bytes !== 0) return "0B";
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

export const ROLE_LABEL = {
  admin: "Quản trị viên",
  leader: "Trưởng nhóm",
  member: "Thành viên",
};

export const ROLE_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Quản trị viên", value: "admin" },
  { label: "Trưởng nhóm", value: "leader" },
  { label: "Thành viên", value: "member" },
];

