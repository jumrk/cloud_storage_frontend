"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/shared/lib/axiosClient";
import { getCustomPlanPrice } from "@/shared/utils/planUtils";

export default function usePlanList() {
  const t = useTranslations();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [custom, setCustom] = useState({
    storage: 20,
    users: 20,
    cycle: "month",
  });
  const [customError, setCustomError] = useState("");

  const fetchPlans = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleChoosePlan = useCallback(
    (plan) => {
      if (plan.isCustom) {
        // Validate custom input
        if (!Number.isInteger(Number(custom.storage)) || custom.storage < 20) {
          setCustomError(t("plans.custom_storage_error"));
          return;
        }
        if (!Number.isInteger(Number(custom.users)) || custom.users < 20) {
          setCustomError(t("plans.custom_users_error"));
          return;
        }
        setCustomError("");
        const customPlanPrice = getCustomPlanPrice(custom.storage);
        setSelectedPlan({
          ...plan,
          isCustom: true,
          customStorage: Number(custom.storage),
          customUsers: Number(custom.users),
          customPriceMonth: customPlanPrice.month,
          customPriceYear: customPlanPrice.year,
          priceMonth: customPlanPrice.month,
          priceYear: customPlanPrice.year,
          cycle: custom.cycle,
        });
        setModalOpen(true);
        return;
      }
      setSelectedPlan(plan);
      setModalOpen(true);
    },
    [custom, t]
  );

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setSelectedPlan(null);
  }, []);

  const handleSubmit = useCallback((info) => {
    alert(
      `Đăng ký gói: ${info.plan.name}\nHọ tên: ${info.fullName}\nEmail: ${info.email}\nSĐT: ${info.phone}`
    );
    setModalOpen(false);
    setSelectedPlan(null);
  }, []);

  const updateCustom = useCallback((field, value) => {
    setCustom((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    t,
    plans,
    loading,
    modalOpen,
    selectedPlan,
    custom,
    customError,
    setCustomError,
    handleChoosePlan,
    handleCloseModal,
    handleSubmit,
    updateCustom,
  };
}
