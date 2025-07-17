// Hàm tính toán số tiền cần thanh toán và số ngày cộng thêm khi đổi gói
// Dùng chung cho cả FE và BE

/**
 * @param {Object} params
 * @param {"month"|"year"} oldType - Loại gói cũ
 * @param {"month"|"year"} newType - Loại gói mới
 * @param {number} oldPriceMonth - Giá gói cũ theo tháng
 * @param {number} oldPriceYear - Giá gói cũ theo năm
 * @param {number} newPriceMonth - Giá gói mới theo tháng
 * @param {number} newPriceYear - Giá gói mới theo năm
 * @param {number} daysLeft - Số ngày còn lại của gói cũ
 * @param {"renew" | "upgrade" | "downgrade" | "register"} orderType - Loại đơn hàng
 * @returns {Object} { amount, extraDays, allowChange }
 */
function calcPlanChange({
  oldType,
  newType,
  oldPriceMonth,
  oldPriceYear,
  newPriceMonth,
  newPriceYear,
  daysLeft,
  orderType, // "renew" | "upgrade" | "downgrade" | "register"
}) {
  const oldPricePerDay =
    oldType === "year" ? oldPriceYear / 365 : oldPriceMonth / 30;
  const newPricePerDay =
    newType === "year" ? newPriceYear / 365 : newPriceMonth / 30;
  const newPrice = newType === "year" ? newPriceYear : newPriceMonth;
  const valueOldLeft = daysLeft * oldPricePerDay;

  // HẠ CẤP: Không cho đổi ngay, phải đợi hết hạn
  if (orderType === "downgrade" && daysLeft > 0) {
    return { amount: 0, extraDays: 0, allowChange: false };
  }

  // Gia hạn hoặc nâng cấp cùng loại (tháng->tháng, năm->năm): khấu trừ giá trị còn lại
  if (
    (orderType === "renew" || orderType === "upgrade") &&
    oldType === newType
  ) {
    const amount = Math.max(0, Math.round(newPrice - valueOldLeft));
    return { amount, extraDays: 0, allowChange: true };
  }

  // Tháng -> năm: khấu trừ giá trị còn lại của gói tháng vào giá gói năm
  if (oldType === "month" && newType === "year") {
    const amount = Math.max(0, Math.round(newPrice - valueOldLeft));
    return { amount, extraDays: 0, allowChange: true };
  }

  // Năm -> tháng: quy đổi số ngày còn lại thành ngày sử dụng gói tháng mới
  if (oldType === "year" && newType === "month") {
    const extraDays = Math.floor(valueOldLeft / newPricePerDay);
    return { amount: newPrice, extraDays, allowChange: true };
  }

  // Trường hợp khác (mua mới): trả đủ giá gói mới
  return { amount: newPrice, extraDays: 0, allowChange: true };
}

export { calcPlanChange };
