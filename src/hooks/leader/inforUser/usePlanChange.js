import { useState } from "react";
import { useTranslations } from "next-intl";
import axiosClient from "@/lib/axiosClient";

const usePlanChange = () => {
  const bankIdMap = {
    MBbank: "mbbank",
    Vietcombank: "vietcombank",
    Techcombank: "techcombank",
    BIDV: "bidv",
    Agribank: "agribank",
    ACB: "acb",
    Sacombank: "sacombank",
    VPBank: "vpbank",
  };
  const t = useTranslations();
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [billingType, setBillingType] = useState("month");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [now, setNow] = useState(new Date());
  const [custom, setCustom] = useState({ storage: 20, users: 20 });
  const [customError, setCustomError] = useState("");
  const [formattedPlanEndDate, setFormattedPlanEndDate] = useState("");
  const [clientDaysLeft, setClientDaysLeft] = useState(null);

  const getPayment = ({ open }) => {
    if (open) {
      setPaymentLoading(true);
      setPaymentMethod(null);
      axiosClient
        .get("/api/admin/payment-methods", { params: { limit: 1 } })
        .then((res) => {
          if (res.data.success && res.data.data.length > 0) {
            setPaymentMethod(res.data.data[0]);
          }
        })
        .finally(() => setPaymentLoading(false));
    }
  };
  const validateCustom = () => {
    if (!Number.isInteger(Number(custom.storage)) || custom.storage < 20) {
      setCustomError(t("plan_change_summary.storage_min_error"));
      return false;
    }
    if (!Number.isInteger(Number(custom.users)) || custom.users < 20) {
      setCustomError(t("plan_change_summary.users_min_error"));
      return false;
    }
    setCustomError("");
    return true;
  };
  return {
    bankIdMap,
    t,
    discountCode,
    setDiscountCode,
    discountInfo,
    setDiscountInfo,
    discountLoading,
    setDiscountLoading,
    discountError,
    setDiscountError,
    billingType,
    setBillingType,
    paymentMethod,
    setPaymentMethod,
    paymentLoading,
    setPaymentLoading,
    submitLoading,
    setSubmitLoading,
    submitSuccess,
    setSubmitSuccess,
    submitError,
    setSubmitError,
    now,
    setNow,
    custom,
    setCustom,
    customError,
    setCustomError,
    formattedPlanEndDate,
    setFormattedPlanEndDate,
    clientDaysLeft,
    setClientDaysLeft,
    getPayment,
    validateCustom,
  };
};

export default usePlanChange;
