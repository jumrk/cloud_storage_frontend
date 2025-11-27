import { formatSize } from "@/shared/utils/driveUtils";

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

export function formatPrice(price) {
  if (price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "₫";
}

export const PLAN_COLORS = [
  "#4abad9",
  "#fbbf24",
  "#a78bfa",
  "#f87171",
  "#34d399",
  "#f472b6",
];

export const STATUS_LABEL = {
  active: "Hoạt động",
  inactive: "Tạm ngưng",
  draft: "Nháp",
};

export const STATUS_FILTERS = [
  { label: "Tất cả", value: "all" },
  { label: "Hoạt động", value: "active" },
  { label: "Tạm ngưng", value: "inactive" },
  { label: "Nháp", value: "draft" },
];

export { formatSize };

