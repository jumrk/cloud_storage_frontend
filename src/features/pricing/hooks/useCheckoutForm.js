import { useState, useEffect } from "react";
import { SLAST_REGEX } from "../utils/constants";

/**
 * Hook để quản lý form state và validation
 * @param {Object} initialForm - Form ban đầu
 * @param {Object} initialCustom - Custom fields ban đầu
 * @param {boolean} isAuthenticated - User đã đăng nhập chưa
 * @param {string} orderType - Loại order
 * @param {Object} currentUser - Thông tin user hiện tại
 * @param {string} planSlug - Slug của plan
 * @param {Object} plan - Plan object
 * @returns {Object} Form state và handlers
 */
export function useCheckoutForm(
  initialForm = {},
  initialCustom = {},
  isAuthenticated = false,
  orderType = "register",
  currentUser = null,
  planSlug = "",
  plan = null
) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    slast: "",
    discountCode: "",
    ...initialForm,
  });
  const [custom, setCustom] = useState({
    storage: 20,
    users: 20,
    credis: 0,
    ...initialCustom,
  });
  const [errors, setErrors] = useState({});

  // Tự động điền thông tin khi user đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setForm((prev) => ({
        ...prev,
        email: currentUser.email || "",
        fullName: currentUser.fullName || "",
        phone: currentUser.phone || "",
        slast: currentUser.slast || "",
      }));
    }
  }, [isAuthenticated, currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const handleCustomInput = (e, onCustomChange) => {
    const { name, value } = e.target;
    const numeric = value.replace(/[^0-9]/g, "");
    setCustom((prev) => ({ ...prev, [name]: numeric }));
    setErrors((prev) => ({ ...prev, custom: undefined }));
    if (onCustomChange) onCustomChange();
  };

  const validateForm = (slastExists = false) => {
    const nextErrors = {};
    if (!planSlug) nextErrors.plan = "Vui lòng chọn gói dịch vụ.";

    // Chỉ validate form khi chưa đăng nhập (register)
    if (!isAuthenticated || orderType === "register") {
      if (!form.fullName.trim()) nextErrors.fullName = "Họ và tên bắt buộc.";
      if (!form.email.trim()) nextErrors.email = "Email bắt buộc.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        nextErrors.email = "Email không hợp lệ.";
      if (!form.phone.trim()) nextErrors.phone = "Vui lòng nhập số điện thoại.";
      if (!form.slast.trim()) nextErrors.slast = "Vui lòng nhập định danh.";
      else if (!SLAST_REGEX.test(form.slast.trim()))
        nextErrors.slast = "Chỉ dùng chữ cái, số, -, _.";
      else if (slastExists) nextErrors.slast = "Định danh đã được sử dụng.";
    }

    if (plan?.isCustom) {
      if (!custom.storage || Number(custom.storage) < 20) {
        nextErrors.custom = "Dung lượng tối thiểu 20.";
      }
      if (!custom.users || Number(custom.users) < 20) {
        nextErrors.custom = "Số người dùng tối thiểu 20.";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (cycle, orderType, paymentOption) => {
    const payload = {
      planSlug,
      billingCycle: cycle,
      orderType,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      slast: form.slast.trim(),
      discountCode: form.discountCode.trim() || undefined,
      paymentOptionCode: paymentOption,
    };
    if (plan?.isCustom) {
      payload.customStorage = Number(custom.storage);
      payload.customUsers = Number(custom.users);
    }
    if (custom.credis && Number(custom.credis) > 0) {
      payload.credis = Number(custom.credis);
    }
    return payload;
  };

  return {
    form,
    setForm,
    custom,
    setCustom,
    errors,
    setErrors,
    handleInputChange,
    handleCustomInput,
    validateForm,
    buildPayload,
  };
}

