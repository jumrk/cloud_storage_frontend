function calcPlanChange({
  oldType,
  newType,
  oldPriceMonth,
  oldPriceYear,
  newPriceMonth,
  newPriceYear,
  daysLeft,
  orderType,
}) {
  const oldPricePerDay =
    oldType === "year" ? oldPriceYear / 365 : oldPriceMonth / 30;
  const newPricePerDay =
    newType === "year" ? newPriceYear / 365 : newPriceMonth / 30;
  const newPrice = newType === "year" ? newPriceYear : newPriceMonth;
  const valueOldLeft = daysLeft * oldPricePerDay;

  if (orderType === "downgrade" && daysLeft > 0) {
    return { amount: 0, extraDays: 0, allowChange: false };
  }
  if (
    (orderType === "renew" || orderType === "upgrade") &&
    oldType === newType
  ) {
    const amount = Math.max(0, Math.round(newPrice - valueOldLeft));
    return { amount, extraDays: 0, allowChange: true };
  }
  if (oldType === "month" && newType === "year") {
    const amount = Math.max(0, Math.round(newPriceYear - valueOldLeft));
    return { amount, extraDays: 0, allowChange: true };
  }
  if (oldType === "year" && newType === "month") {
    const extraDays = Math.floor(valueOldLeft / newPricePerDay);
    return { amount: newPriceMonth, extraDays, allowChange: true };
  }
  return { amount: newPrice, extraDays: 0, allowChange: true };
}
export function getCustomPlanPrice(storageTB, users, discount = 0) {
  const baseTB = 10;
  const basePrice = 240000;
  const extraPricePerTB = 20000;
  const userPrice = 10000;
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
