import React, { useState, useEffect } from "react";
import Modal from "../Modal";
import InputCustom from "../ui/input_custom";

const TYPE_OPTIONS = [
  { value: "bank", label: "Ngân hàng" },
  { value: "card", label: "Thẻ tín dụng" },
  { value: "ewallet", label: "Ví điện tử" },
  { value: "crypto", label: "Tiền điện tử" },
  { value: "other", label: "Khác" },
];

export default function PaymentMethodModal({
  open,
  onClose,
  method = null,
  onSubmit,
  loading = false,
}) {
  const [form, setForm] = useState({
    name: "",
    type: "bank",
    accountNumber: "",
    accountName: "",
    bankName: "",
    description: "",
    icon: "💳",
    sortOrder: 0,
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  const isEdit = !!method;

  useEffect(() => {
    if (method) {
      setForm({
        name: method.name || "",
        type: method.type || "bank",
        accountNumber: method.accountNumber || "",
        accountName: method.accountName || "",
        bankName: method.bankName || "",
        description: method.description || "",
        icon: method.icon || "💳",
        sortOrder: method.sortOrder || 0,
        isActive: method.isActive !== undefined ? method.isActive : true,
      });
    } else {
      setForm({
        name: "",
        type: "bank",
        accountNumber: "",
        accountName: "",
        bankName: "",
        description: "",
        icon: "💳",
        sortOrder: 0,
        isActive: true,
      });
    }
    setErrors({});
  }, [method, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
    setErrors({ ...errors, [name]: undefined });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Vui lòng nhập tên phương thức";
    if (!form.accountNumber.trim())
      newErrors.accountNumber = "Vui lòng nhập số tài khoản";
    if (!form.accountName.trim())
      newErrors.accountName = "Vui lòng nhập tên tài khoản";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || loading) return;

    const methodData = {
      ...form,
      _id: method?._id, // Sử dụng _id thay vì id
    };

    onSubmit && onSubmit(methodData);
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-6 w-full max-w-[95vw] sm:max-w-[420px] md:max-w-[540px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-center text-slate-800">
          {isEdit
            ? "Chỉnh sửa phương thức thanh toán"
            : "Thêm phương thức thanh toán"}
        </h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Tên phương thức */}
          <InputCustom
            id="name"
            label="Tên phương thức"
            name="name"
            type="text"
            placeholder="VD: Ngân hàng Vietcombank"
            value={form.name}
            handelChange={handleChange}
            errors={errors.name}
            disabled={loading}
          />

          {/* Loại phương thức */}
          <div className="grid mt-5">
            <label className="text-primary/60 text-sm lg:text-xl mb-2">
              Loại phương thức
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              disabled={loading}
              className="w-full placeholder:text-[#8897AD] p-3 border-1 focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Số tài khoản */}
          <InputCustom
            id="accountNumber"
            label="Số tài khoản"
            name="accountNumber"
            type="text"
            placeholder="Nhập số tài khoản"
            value={form.accountNumber}
            handelChange={handleChange}
            errors={errors.accountNumber}
            disabled={loading}
          />

          {/* Tên tài khoản */}
          <InputCustom
            id="accountName"
            label="Tên tài khoản"
            name="accountName"
            type="text"
            placeholder="Nhập tên tài khoản"
            value={form.accountName}
            handelChange={handleChange}
            errors={errors.accountName}
            disabled={loading}
          />

          {/* Tên ngân hàng */}
          {form.type === "bank" && (
            <InputCustom
              id="bankName"
              label="Tên ngân hàng"
              name="bankName"
              type="text"
              placeholder="VD: Vietcombank, BIDV..."
              value={form.bankName}
              handelChange={handleChange}
              disabled={loading}
            />
          )}

          {/* Icon */}
          <div className="grid mt-5">
            <label className="text-primary/60 text-sm lg:text-xl mb-2">
              Icon
            </label>
            <input
              name="icon"
              type="text"
              placeholder="💳"
              value={form.icon}
              onChange={handleChange}
              disabled={loading}
              className="w-full placeholder:text-[#8897AD] p-3 border-1 focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Mô tả */}
          <div className="grid mt-5">
            <label className="text-primary/60 text-sm lg:text-xl mb-2">
              Mô tả
            </label>
            <textarea
              name="description"
              placeholder="Mô tả thêm về phương thức thanh toán"
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full placeholder:text-[#8897AD] p-3 border-1 focus:outline-none border-[#D4D7E3] bg-[#F7FBFF] rounded-xl resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Trạng thái */}
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              disabled={loading}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Hoạt động
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end mt-6">
            <button
              type="button"
              disabled={loading}
              className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 transition-all text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-primary text-white shadow hover:bg-primary/90 transition-all text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isEdit ? "Cập nhật" : "Thêm phương thức"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
