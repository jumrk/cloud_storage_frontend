/**
 * Format số tiền sang định dạng VND
 * @param {number|string} value - Giá trị cần format
 * @returns {string} Chuỗi đã format
 */
export function formatMoney(value) {
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  } catch {
    return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
  }
}

