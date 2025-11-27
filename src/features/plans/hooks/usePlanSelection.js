import { useRouter } from "next/navigation";
import { decodeTokenGetUser } from "@/shared/lib/jwt";

/**
 * Hook để xử lý logic chọn plan và điều hướng
 * @param {string} currentPlanSlug - Slug của plan hiện tại
 * @param {Function} onSelect - Callback khi select (optional)
 * @returns {Function} handleSelect function
 */
export function usePlanSelection(currentPlanSlug = "", onSelect = null) {
  const router = useRouter();

  const handleSelect = (plan, selectedBilling) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const user = token ? decodeTokenGetUser(token) : null;
    const isAuthenticated = !!user;
    if (user?.role === "member") {
      return;
    }

    // Không cho chọn free plan nếu đã có gói khác
    if (isAuthenticated) {
      const currentSlug = currentPlanSlug || user?.planSlug || "";
      if (
        plan.slug?.toLowerCase() === "free" &&
        currentSlug &&
        currentSlug.toLowerCase() !== "free"
      ) {
        // Không cho chọn free khi đã có gói khác
        return;
      }
    }

    if (!isAuthenticated && plan.slug !== "free" && plan.priceMonth > 0) {
      router.push("/login");
      return;
    }

    // Free plan không cần checkout
    if (plan.slug?.toLowerCase() === "free") {
      // Có thể hiển thị thông báo hoặc không làm gì
      return;
    }

    if (onSelect) {
      onSelect(plan, selectedBilling);
      return;
    }

    const cycle = selectedBilling === "annual" ? "year" : "month";

    let orderType = "register";
    if (isAuthenticated) {
      const currentSlug = currentPlanSlug || user?.planSlug || "";
      if (
        currentSlug &&
        currentSlug.toLowerCase() === plan.slug.toLowerCase()
      ) {
        orderType = "renew";
      } else if (currentSlug) {
        orderType = "upgrade";
      } else {
        orderType = "upgrade";
      }
    }

    const params = new URLSearchParams({
      plan: plan.slug,
      cycle,
      type: orderType,
    });
    router.push(`/pricing/checkout?${params.toString()}`);
  };

  return handleSelect;
}
