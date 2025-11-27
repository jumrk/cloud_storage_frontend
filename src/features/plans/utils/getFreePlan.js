/**
 * Tạo Free plan object (không lưu trong DB)
 * Dựa trên default values từ User model
 */
export function getFreePlan() {
  return {
    id: "free-plan",
    _id: "free-plan",
    slug: "free",
    name: "Free",
    order: 0,
    storage: 1073741824, // 1 GB (default từ User model)
    users: 1, // default từ User model
    priceMonth: 0,
    priceYear: 0,
    sale: 0,
    credis: 200, // default từ User model
    status: "active",
    isCustom: false,
    featured: false,
    description: [
      "Gói miễn phí cho người dùng mới",
      "Dung lượng 1 GB",
      "1 người dùng",
      "200 Credis miễn phí",
      "Phù hợp để dùng thử",
    ],
  };
}

