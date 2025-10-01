import axiosClient from "@/lib/axiosClient";
import { useTranslations } from "next-intl";
import { useState } from "react";

const usePlanListUse = () => {
  const PLAN_COLORS = [
    "#4abad9",
    "#fbbf24",
    "#a78bfa",
    "#f87171",
    "#34d399",
    "#f472b6",
  ];

  const t = useTranslations();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/api/admin/plans", {
        params: { limit: 100 },
      });
      if (res.data && res.data.success) {
        setPlans(res.data.data);
      } else {
        setPlans([]);
      }
    } catch (e) {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };
  return {
    PLAN_COLORS,
    t,
    plans,
    setPlans,
    loading,
    setLoading,
    fetchPlans,
  };
};
export default usePlanListUse;
