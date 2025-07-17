import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import InputCustom from "../ui/input_custom";

const ICON_OPTIONS = [
  { value: "🔒", label: "🔒 Khóa" },
  { value: "💼", label: "💼 Cơ bản" },
  { value: "🚀", label: "🚀 Chuyên nghiệp" },
  { value: "🏢", label: "🏢 Doanh nghiệp" },
  { value: "⭐", label: "⭐ Premium" },
  { value: "💎", label: "💎 VIP" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Tạm ngưng" },
  { value: "draft", label: "Nháp" },
];

const STORAGE_UNITS = [
  { value: "B", label: "B" },
  { value: "KB", label: "KB" },
  { value: "MB", label: "MB" },
  { value: "GB", label: "GB" },
  { value: "TB", label: "TB" },
];

function splitStorageBytes(bytes) {
  if (!bytes || isNaN(bytes)) return { value: "", unit: "GB" };
  if (bytes % 1024 ** 4 === 0) return { value: bytes / 1024 ** 4, unit: "TB" };
  if (bytes % 1024 ** 3 === 0) return { value: bytes / 1024 ** 3, unit: "GB" };
  if (bytes % 1024 ** 2 === 0) return { value: bytes / 1024 ** 2, unit: "MB" };
  if (bytes % 1024 === 0) return { value: bytes / 1024, unit: "KB" };
  return { value: bytes, unit: "B" };
}

export default function PlanModal({
  open,
  onClose,
  plan = null,
  onSubmit,
  loading,
}) {
  const [form, setForm] = useState({
    name: "",
    icon: "🔒",
    storageValue: "",
    storageUnit: "GB",
    users: 1,
    priceMonth: 0,
    priceYear: 0,
    sale: 0,
    features: [""],
    status: "active",
  });
  const [errors, setErrors] = useState({});

  const isEdit = !!plan;

  useEffect(() => {
    if (plan) {
      const { value, unit } = splitStorageBytes(plan.storage);
      setForm({
        name: plan.name || "",
        icon: plan.icon || "🔒",
        storageValue: value || "",
        storageUnit: unit || "GB",
        users: plan.users || 1,
        priceMonth: plan.priceMonth || 0,
        priceYear: plan.priceYear || 0,
        sale: plan.sale || 0,
        features: plan.features?.length ? [...plan.features] : [""],
        status: plan.status || "active",
      });
    } else {
      setForm({
        name: "",
        icon: "🔒",
        storageValue: "",
        storageUnit: "GB",
        users: 1,
        priceMonth: 0,
        priceYear: 0,
        sale: 0,
        features: [""],
        status: "active",
      });
    }
    setErrors({});
  }, [plan, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  };

  const handleStorageValueChange = (e) => {
    setForm({ ...form, storageValue: e.target.value });
    setErrors({ ...errors, storageValue: undefined });
  };
  const handleStorageUnitChange = (e) => {
    setForm({ ...form, storageUnit: e.target.value });
  };

  function storageToBytes(value, unit) {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return 0;
    switch (unit) {
      case "TB":
        return num * 1024 ** 4;
      case "GB":
        return num * 1024 ** 3;
      case "MB":
        return num * 1024 ** 2;
      case "KB":
        return num * 1024;
      default:
        return num;
    }
  }

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...form.features];
    newFeatures[index] = value;
    setForm({ ...form, features: newFeatures });
  };

  const addFeature = () => {
    setForm({ ...form, features: [...form.features, ""] });
  };

  const removeFeature = (index) => {
    if (form.features.length > 1) {
      const newFeatures = form.features.filter((_, i) => i !== index);
      setForm({ ...form, features: newFeatures });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Vui lòng nhập tên gói";
    if (
      !form.storageValue ||
      isNaN(form.storageValue) ||
      form.storageValue <= 0
    )
      newErrors.storageValue = "Vui lòng nhập dung lượng hợp lệ";
    if (form.users < 1) newErrors.users = "Số người dùng phải >= 1";
    if (form.priceMonth < 0) newErrors.priceMonth = "Giá tháng không được âm";
    if (form.priceYear < 0) newErrors.priceYear = "Giá năm không được âm";
    if (form.sale < 0 || form.sale > 100)
      newErrors.sale = "Phần trăm giảm giá phải từ 0-100";
    const validFeatures = form.features.filter((f) => f.trim());
    if (validFeatures.length === 0) {
      newErrors.features = "Vui lòng nhập ít nhất 1 tính năng";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const validFeatures = form.features.filter((f) => f.trim());
    const storage = storageToBytes(form.storageValue, form.storageUnit);
    const planData = {
      ...form,
      storage,
      features: validFeatures,
      _id: plan?._id,
    };
    onSubmit && onSubmit(planData);
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-center text-slate-800">
          {isEdit ? "Chỉnh sửa gói dịch vụ" : "Thêm gói dịch vụ mới"}
        </h2>
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          {/* Row 1: Tên gói và Icon */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InputCustom
              id="name"
              label="Tên gói dịch vụ"
              name="name"
              type="text"
              placeholder="Nhập tên gói dịch vụ"
              value={form.name}
              handelChange={handleChange}
              errors={errors.name}
              disabled={loading}
            />
            {/* Icon */}
            <div className="grid mt-5">
              <label className="text-primary/60 text-sm lg:text-xl mb-2">
                Icon gói
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {ICON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      handleChange({
                        target: { name: "icon", value: option.value },
                      })
                    }
                    className={`p-2 sm:p-3 border rounded-lg text-center transition ${
                      form.icon === option.value
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-lg sm:text-2xl mb-1">
                      {option.value}
                    </div>
                    <div className="text-xs text-gray-600 hidden sm:block">
                      {option.label.split(" ")[1]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Row 2: Dung lượng và Số người dùng */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="grid mt-5">
              <label className="text-primary/60 text-sm lg:text-xl mb-2">
                Dung lượng
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  name="storageValue"
                  value={form.storageValue}
                  onChange={handleStorageValueChange}
                  className="w-32 p-3 border-1 focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Nhập số"
                  disabled={loading}
                />
                <select
                  name="storageUnit"
                  value={form.storageUnit}
                  onChange={handleStorageUnitChange}
                  className="p-3 border-1 focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {STORAGE_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.storageValue && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.storageValue}
                </p>
              )}
            </div>
            <InputCustom
              id="users"
              label="Số người dùng tối đa"
              name="users"
              type="number"
              placeholder="Nhập số người dùng"
              value={form.users}
              handelChange={handleChange}
              errors={errors.users}
              disabled={loading}
            />
          </div>
          {/* Row 3: Giá tháng và Giá năm */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InputCustom
              id="priceMonth"
              label="Giá tháng (VNĐ)"
              name="priceMonth"
              type="number"
              placeholder="Nhập giá tháng"
              value={form.priceMonth}
              handelChange={handleChange}
              errors={errors.priceMonth}
              disabled={loading}
            />

            <InputCustom
              id="priceYear"
              label="Giá năm (VNĐ)"
              name="priceYear"
              type="number"
              placeholder="Nhập giá năm"
              value={form.priceYear}
              handelChange={handleChange}
              errors={errors.priceYear}
              disabled={loading}
            />
          </div>

          {/* Row 4: Phần trăm giảm giá và Trạng thái */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InputCustom
              id="sale"
              label="Phần trăm giảm giá năm (%)"
              name="sale"
              type="number"
              placeholder="VD: 17"
              value={form.sale}
              handelChange={handleChange}
              errors={errors.sale}
              disabled={loading}
            />

            {/* Trạng thái */}
            <div className="grid mt-5">
              <label className="text-primary/60 text-sm lg:text-xl mb-2">
                Trạng thái
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full placeholder:text-[#8897AD] p-3 border-1 focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tính năng - Full width */}
          <div className="grid mt-5">
            <label className="text-primary/60 text-sm lg:text-xl mb-2">
              Tính năng
            </label>
            <div className="space-y-2">
              {form.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="flex-1 placeholder:text-[#8897AD] p-3 border-1 focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={`Tính năng ${index + 1}`}
                    disabled={loading}
                  />
                  {form.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-xl border border-red-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="text-primary hover:text-primary/80 text-sm font-medium mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              + Thêm tính năng
            </button>
            {errors.features && (
              <p className="text-sm text-red-400 mt-1">{errors.features}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 transition-all text-base font-medium order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary text-white shadow hover:bg-primary/90 transition-all text-base font-medium order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {isEdit ? "Cập nhật" : "Thêm gói"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
