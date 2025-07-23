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
 *
 * | Case                          | Điều kiện                | Cách tính                       | amount                        | extraDays                       | allowChange |
 * | ----------------------------- | ------------------------ | ------------------------------- | ----------------------------- | ------------------------------- | ----------- |
 * | **Downgrade**                 | hạ cấp khi còn ngày      | Không cho đổi                   | 0                             | 0                               | ❌ false     |
 * | **Renew / Upgrade cùng loại** | tháng→tháng hoặc năm→năm | Khấu trừ tiền còn lại           | newPrice - valueOldLeft       | 0                               | ✅ true      |
 * | **Upgrade Tháng→Năm**         | old=month, new=year      | Khấu trừ tiền còn lại           | newPriceYear - valueOldLeft   | 0                               | ✅ true      |
 * | **Downgrade Năm→Tháng**       | old=year, new=month      | Quy đổi tiền còn lại thành ngày | newPriceMonth                 | valueOldLeft / newPricePerDay   | ✅ true      |
 * | **Register mới**              | các trường hợp còn lại   | Trả đủ giá mới                  | newPrice                      | 0                               | ✅ true      |
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

  // Case 1: Downgrade khi còn ngày - Không cho đổi
  if (orderType === "downgrade" && daysLeft > 0) {
    return { amount: 0, extraDays: 0, allowChange: false };
  }
  // Case 2: Renew/Upgrade cùng loại (tháng->tháng hoặc năm->năm) - Khấu trừ tiền còn lại
  if (
    (orderType === "renew" || orderType === "upgrade") &&
    oldType === newType
  ) {
    const amount = Math.max(0, Math.round(newPrice - valueOldLeft));
    return { amount, extraDays: 0, allowChange: true };
  }
  // Case 3: Upgrade Tháng->Năm - Khấu trừ tiền còn lại
  if (oldType === "month" && newType === "year") {
    const amount = Math.max(0, Math.round(newPriceYear - valueOldLeft));
    return { amount, extraDays: 0, allowChange: true };
  }
  // Case 4: Downgrade Năm->Tháng - Quy đổi tiền còn lại thành ngày
  if (oldType === "year" && newType === "month") {
    const extraDays = Math.floor(valueOldLeft / newPricePerDay);
    return { amount: newPriceMonth, extraDays, allowChange: true };
  }
  // Case 5: Register mới hoặc các trường hợp còn lại - Trả đủ giá mới
  return { amount: newPrice, extraDays: 0, allowChange: true };
}

/**
 * Tính giá gói tùy chọn theo dung lượng (TB) và số user
 * @param {number} storageTB - Dung lượng TB
 * @param {number} users - Số user
 * @param {number} discount - Giảm giá năm (0.1 = 10%)
 * @returns {{month: number, year: number}}
 */
export function getCustomPlanPrice(storageTB, users, discount = 0) {
  const baseTB = 10;
  const basePrice = 240000; // 240k cho 10TB đầu
  const extraPricePerTB = 20000; // 20k/1TB thêm
  const userPrice = 10000; // 10k/user/tháng
  const minTB = 20;
  const minUsers = 20;
  const tb = Math.max(minTB, Math.floor(storageTB));
  const userCount = Math.max(minUsers, Math.floor(users));
  const extraTB = Math.max(0, tb - baseTB);
  const priceMonth =
    basePrice + extraTB * extraPricePerTB + userCount * userPrice;
  const priceYear = Math.round(priceMonth * 12 * (1 - discount));
  return { month: priceMonth, year: priceYear };
}

export { calcPlanChange };
