import { useEffect, useState } from "react";
import pricingService from "@/shared/services/pricingService";

/**
 * Hook để fetch plan dựa trên slug
 * @param {string} planSlug - Slug của plan
 * @returns {Object} { plan, loading }
 */
export function useCheckoutPlan(planSlug) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planSlug) {
      setPlan(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    pricingService
      .getPlan(planSlug)
      .then((res) => {
        if (active) {
          setPlan(res || null);
        }
      })
      .catch(() => {
        if (active) setPlan(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [planSlug]);

  return { plan, loading };
}

