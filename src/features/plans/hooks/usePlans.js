import { useEffect, useState } from "react";
import pricingService from "@/shared/services/pricingService";

/**
 * Hook để fetch và quản lý danh sách plans
 * @param {Array} initialPlans - Plans ban đầu (optional)
 * @returns {Object} { plans, loading, error }
 */
export function usePlans(initialPlans = null) {
  const [plans, setPlans] = useState(initialPlans || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await pricingService.getPlans();
        if (isActive) {
          if (result?.length) {
            setPlans(result);
          } else {
            setPlans([]);
          }
        }
      } catch (err) {
        if (isActive) {
          setPlans([]);
          setError(err);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    fetchPlans();
    return () => {
      isActive = false;
    };
  }, []);

  return { plans, loading, error };
}
