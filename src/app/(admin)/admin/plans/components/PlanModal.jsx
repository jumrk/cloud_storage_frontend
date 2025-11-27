import React, { useState, useEffect, useRef } from "react";
import Modal from "@/shared/ui/Modal";
import Popover from "@/shared/ui/Popover";
import InputCustom from "./InputCustom";

const STATUS_OPTIONS = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Tạm ngưng" },
  { value: "draft", label: "Nháp" },
];

const STORAGE_UNITS = [
  { value: "GB", label: "GB" },
  { value: "TB", label: "TB" },
];

const PLAN_OPTIONS = [
  // Không có "free" vì free plan được tạo mặc định khi user đăng ký
  { slug: "basic", name: "Basic", order: 1 },
  { slug: "pro", name: "Pro", order: 2 },
  { slug: "premium", name: "Premium", order: 3 },
  { slug: "enterprise", name: "Doanh nghiệp", order: 4 },
  { slug: "custom", name: "Tùy chọn", order: 99 },
];

const defaultForm = {
  name: "",
  slug: "",
  storageValue: "",
  storageUnit: "GB",
  users: 1,
  priceMonth: 0,
  priceYear: 0,
  sale: 0,
  credis: 0,
  description: [],
  status: "active",
  featured: false,
};

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const splitStorage = (bytes) => {
  if (!bytes) return { value: "", unit: "GB" };
  const tb = 1024 ** 4;
  if (bytes % tb === 0) return { value: bytes / tb, unit: "TB" };
  return { value: bytes / 1024 ** 3, unit: "GB" };
};

const convertToBytes = (value, unit) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric <= 0) return 0;
  return unit === "TB" ? numeric * 1024 ** 4 : numeric * 1024 ** 3;
};

// Format số tiền Việt Nam với dấu chấm (VD: 300000 -> "300.000")
const formatVNCurrency = (value) => {
  if (!value && value !== 0) return "";
  const numStr = value.toString().replace(/\./g, "").trim();
  if (!numStr) return "";
  // Chỉ cho phép số
  if (!/^\d+$/.test(numStr)) return "";
  // Format với dấu chấm ngăn cách hàng nghìn
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Parse số tiền từ format Việt Nam về số nguyên (VD: "300.000" -> 300000)
const parseVNCurrency = (value) => {
  if (!value) return 0;
  const numStr = value.toString().replace(/\./g, "").trim();
  if (!numStr) return 0;
  const num = Number(numStr);
  return Number.isNaN(num) ? 0 : num;
};

export default function PlanModal({ open, onClose, plan, onSubmit, loading }) {
  const [form, setForm] = useState(defaultForm);
  const [isCustom, setIsCustom] = useState(false);
  const [errors, setErrors] = useState({});
  const [featureInput, setFeatureInput] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const isEdit = Boolean(plan);

  useEffect(() => {
    if (!open) return;
    if (plan) {
      const storage = splitStorage(plan.storage);
      setForm({
        name: plan.name || "",
        slug: plan.slug || "",
        storageValue: storage.value || "",
        storageUnit: storage.unit || "GB",
        users: plan.users || 1,
        priceMonth: formatVNCurrency(plan.priceMonth || 0),
        priceYear: formatVNCurrency(plan.priceYear || 0),
        sale: plan.sale || 0,
        credis:
          typeof plan.credis === "number" && plan.credis >= 0 ? plan.credis : 0,
        description: Array.isArray(plan.description) ? plan.description : [],
        status: plan.status || "active",
        featured: !!plan.featured,
      });
      setIsCustom(!!plan.isCustom);
    } else {
      setForm({
        ...defaultForm,
        priceMonth: "",
        priceYear: "",
      });
      setIsCustom(false);
    }
    setFeatureInput("");
    setErrors({});
    setSlugTouched(false);
  }, [plan, open]);

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      name: value,
    }));
    setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    // Chỉ cho phép nhập số và dấu chấm
    const cleaned = value.replace(/[^\d.]/g, "");
    // Format với dấu chấm
    const formatted = formatVNCurrency(cleaned);
    setForm((prev) => ({
      ...prev,
      [name]: formatted,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const addFeature = () => {
    const value = featureInput.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      description: [...(prev.description || []), value],
    }));
    setFeatureInput("");
    setErrors((prev) => ({ ...prev, description: undefined }));
  };

  const removeFeature = (index) => {
    setForm((prev) => ({
      ...prev,
      description: prev.description.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Vui lòng nhập tên gói";
    if (!form.slug.trim()) nextErrors.slug = "Slug không được bỏ trống";
    if (!isCustom) {
      if (!form.storageValue || Number(form.storageValue) <= 0) {
        nextErrors.storageValue = "Dung lượng phải lớn hơn 0";
      }
      if (!form.users || Number(form.users) < 1) {
        nextErrors.users = "Người dùng phải >= 1";
      }
      const priceMonthValue = parseVNCurrency(form.priceMonth);
      if (priceMonthValue < 0) {
        nextErrors.priceMonth = "Giá tháng không hợp lệ";
      }
      const priceYearValue = parseVNCurrency(form.priceYear);
      if (priceYearValue < 0) {
        nextErrors.priceYear = "Giá năm không hợp lệ";
      }
    }
    const saleValue = Number(form.sale || 0);
    if (saleValue < 0 || saleValue > 100) {
      nextErrors.sale = "Giảm giá nằm trong 0 - 100%";
    }
    if (!form.description || form.description.length === 0) {
      nextErrors.description = "Vui lòng thêm ít nhất 1 mô tả";
    }
    if (form.credis < 0) {
      nextErrors.credis = "Credis phải >= 0";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      slug: slugify(form.slug),
      isCustom,
      storage: isCustom
        ? undefined
        : convertToBytes(form.storageValue, form.storageUnit),
      users: isCustom ? undefined : Number(form.users),
      priceMonth: isCustom ? undefined : parseVNCurrency(form.priceMonth),
      priceYear: isCustom ? undefined : parseVNCurrency(form.priceYear),
      sale: Number(form.sale || 0),
      credis: Number(form.credis || 0),
      description: form.description.map((item) => item.trim()).filter(Boolean),
      _id: plan?._id,
    };
    onSubmit && onSubmit(payload);
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-4xl max-h-[90vh] scrollbar-hide overflow-y-auto p-6 bg-white rounded-3xl shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              {isEdit ? "Chỉnh sửa" : "Thêm mới"} gói dịch vụ
            </p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {isEdit ? plan?.name : "Gói dịch vụ mới"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <ToggleChip
              active={form.featured}
              onClick={() =>
                setForm((prev) => ({ ...prev, featured: !prev.featured }))
              }
              label="Gói nổi bật"
            />
            <ToggleChip
              active={isCustom}
              onClick={() => setIsCustom((prev) => !prev)}
              label="Custom"
            />
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">
              Thông tin hiển thị
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <DropdownField
                label="Loại gói"
                value={form.slug}
                options={PLAN_OPTIONS.map((p) => ({
                  value: p.slug,
                  label: `${p.name} (${p.slug})`,
                }))}
                disabled={loading}
                onChange={(val) => {
                  const selectedPlan = PLAN_OPTIONS.find((p) => p.slug === val);
                  setForm((prev) => ({
                    ...prev,
                    slug: val,
                    name: selectedPlan ? selectedPlan.name : prev.name,
                  }));
                  setIsCustom(val === "custom");
                  setErrors((prev) => ({
                    ...prev,
                    slug: undefined,
                    name: undefined,
                  }));
                }}
                errors={errors.slug}
              />
              <InputCustom
                id="name"
                label="Tên gói (tùy chỉnh)"
                name="name"
                type="text"
                placeholder="Tên hiển thị (tùy chọn)"
                value={form.name}
                handelChange={handleNameChange}
                errors={errors.name}
                disabled={loading}
                helper="Để trống sẽ dùng tên mặc định"
              />
              <DropdownField
                label="Trạng thái"
                value={form.status}
                options={STATUS_OPTIONS}
                disabled={loading}
                onChange={(val) => {
                  setForm((prev) => ({ ...prev, status: val }));
                  setErrors((prev) => ({ ...prev, status: undefined }));
                }}
              />
              <div className="grid md:grid-cols-2 gap-3">
                <InputCustom
                  id="sale"
                  label="Giảm giá năm (%)"
                  name="sale"
                  type="number"
                  placeholder="VD: 12"
                  value={form.sale}
                  handelChange={handleFieldChange}
                  errors={errors.sale}
                  disabled={loading}
                />
                <InputCustom
                  id="credis"
                  label="Credis tặng kèm"
                  name="credis"
                  type="number"
                  placeholder="VD: 2000"
                  value={form.credis}
                  handelChange={handleFieldChange}
                  errors={errors.credis}
                  disabled={loading}
                  helper="Tự động cộng vào tài khoản leader"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Cấu hình tài nguyên & giá
              </h3>
              {isCustom && (
                <span className="text-xs text-slate-500">
                  Khách hàng sẽ tự chọn thông số khi đăng ký
                </span>
              )}
            </div>
            {isCustom ? (
              <p className="text-sm text-slate-500 leading-relaxed">
                Đây là gói tùy chỉnh. Bạn chỉ cần mô tả các quyền lợi nổi bật,
                hệ thống sẽ tính giá động dựa trên cấu hình khách hàng nhập.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dung lượng
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={form.storageValue}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          storageValue: e.target.value,
                        }))
                      }
                      disabled={loading}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100"
                      placeholder="VD: 200"
                    />
                    <DropdownField
                      value={form.storageUnit}
                      options={STORAGE_UNITS}
                      disabled={loading}
                      className="w-32"
                      onChange={(val) =>
                        setForm((prev) => ({ ...prev, storageUnit: val }))
                      }
                    />
                  </div>
                  {errors.storageValue && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.storageValue}
                    </p>
                  )}
                </div>
                <InputCustom
                  id="users"
                  label="Số người dùng tối đa"
                  name="users"
                  type="number"
                  placeholder="VD: 30"
                  value={form.users}
                  handelChange={handleFieldChange}
                  errors={errors.users}
                  disabled={loading}
                />
                <InputCustom
                  id="priceMonth"
                  label="Giá tháng (VNĐ)"
                  name="priceMonth"
                  type="text"
                  placeholder="VD: 2.400.000"
                  value={form.priceMonth}
                  handelChange={handlePriceChange}
                  errors={errors.priceMonth}
                  disabled={loading}
                />
                <InputCustom
                  id="priceYear"
                  label="Giá năm (VNĐ)"
                  name="priceYear"
                  type="text"
                  placeholder="VD: 28.800.000"
                  value={form.priceYear}
                  handelChange={handlePriceChange}
                  errors={errors.priceYear}
                  disabled={loading}
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Điểm nổi bật
              </h3>
              <span className="text-xs text-slate-400">
                Dùng để hiển thị ở marketing & modal thanh toán
              </span>
            </div>
            {form.description?.length ? (
              <div className="flex flex-wrap gap-2">
                {form.description.map((item, idx) => (
                  <span
                    key={`${item}-${idx}`}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-sm text-slate-600"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="text-slate-400 hover:text-rose-500"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Chưa có mô tả nào, hãy thêm ít nhất một dòng.
              </p>
            )}
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="Ví dụ: Hỗ trợ 24/7, tích hợp POS..."
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="button"
                onClick={addFeature}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-60"
              >
                Thêm mô tả
              </button>
            </div>
            {errors.description && (
              <p className="text-xs text-rose-500">{errors.description}</p>
            )}
          </section>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-md hover:opacity-95 disabled:opacity-70"
            >
              {isEdit ? "Cập nhật gói" : "Tạo gói"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function ToggleChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition ${
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "border-slate-200 text-slate-500 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function DropdownField({
  label,
  value,
  options = [],
  onChange,
  disabled,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (val) => {
    if (disabled) return;
    onChange && onChange(val);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="mt-1 w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:opacity-50"
      >
        <span>{selected ? selected.label : "—"}</span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <Popover open={open} className="min-w-[180px] shadow-xl">
        <ul className="max-h-52 overflow-auto">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  opt.value === value
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      </Popover>
    </div>
  );
}
