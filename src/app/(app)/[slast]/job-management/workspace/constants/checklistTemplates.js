/**
 * Form công việc chuẩn – chọn form khi tạo thẻ mới (phim mới) để tự tạo đủ các khâu.
 * Chỉ cần điền tên phim vào tiêu đề thẻ, quy trình giữ nguyên.
 */
export const CHECKLIST_TEMPLATES = [
  {
    id: "thuyet_minh_viet",
    name: "Quy trình phim thuyết minh",
    title: "Form Công Việc Chuẩn",
    items: [
      { text: "TẢI_PHIM" },
      { text: "GHÉP_RAW_CÁC_PHIÊN_BẢN" },
      { text: "ORC_SUB_TRUNG" },
      { text: "CHECK_SUB_TRUNG" },
      { text: "VIETSUB_AI" },
      { text: "VIETSUB" },
      { text: "THUYẾT_MINH" },
      { text: "MIX" },
      { text: "THÀNH_PHẨM" },
    ],
  },
  {
    id: "phim_sub",
    name: "Quy trình phim phụ đề (không thuyết minh)",
    title: "Form Công Việc Chuẩn - Phụ đề",
    items: [
      { text: "TẢI_PHIM" },
      { text: "GHÉP_RAW_CÁC_PHIÊN_BẢN" },
      { text: "ORC_SUB_TRUNG" },
      { text: "CHECK_SUB_TRUNG" },
      { text: "VIETSUB_AI" },
      { text: "VIETSUB" },
      { text: "THÀNH_PHẨM" },
    ],
  },
];
