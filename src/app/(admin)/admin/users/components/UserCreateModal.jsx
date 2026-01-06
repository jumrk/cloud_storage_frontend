"use client";
import { useEffect, useState, useRef } from "react";
import { FiX } from "react-icons/fi";
import userService from "../services/userService";
export default function UserCreateModal({ open, onClose, onCreated }) {
  const api = userService();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    planId: "",
    planType: "month",
    slast: "",
  });
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [slastChecking, setSlastChecking] = useState(false);
  const [slastExists, setSlastExists] = useState(false);
  let slastCheckTimeout = useRef();
  useEffect(() => {
    if (open) {
      setForm({
        fullName: "",
        email: "",
        phone: "",
        planId: "",
        planType: "month",
        slast: "",
      });
      setError("");
      setSuccess(false);
      api.getPlans().then((res) => setPlans(res?.data || []));
    }
  }, [open]);
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "slast") {
      const value = e.target.value.trim();
      setSlastExists(false);
      setSlastChecking(false);
      if (slastCheckTimeout.current) clearTimeout(slastCheckTimeout.current);
      if (!value || !/^[a-zA-Z0-9_-]+$/.test(value)) return;
      setSlastChecking(true);
      slastCheckTimeout.current = setTimeout(async () => {
        try {
          const res = await api.checkSlast(value);
          setSlastExists(res.exists);
        } catch (err) {
          setSlastExists(false);
        } finally {
          setSlastChecking(false);
        }
      }, 500);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.planId ||
      !form.slast.trim()
    ) {
      setError("Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(form.slast)) {
      setError("Định danh chỉ dùng chữ, số, dấu gạch ngang hoặc gạch dưới.");
      return;
    }
    if (slastExists) {
      setError("Định danh này đã được sử dụng, hãy chọn định danh khác.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.createUser(form);
      if (res.success) {
        setSuccess(true);
        onCreated && onCreated();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || "Tạo user thất bại");
      }
    } catch (e) {
      setError("Lỗi kết nối server");
    }
    setLoading(false);
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
          title="Đóng"
        >
          <FiX />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-center">
          Thêm người dùng mới
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Họ và tên *
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Số điện thoại
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Gói dịch vụ *
            </label>
            <select
              name="planId"
              value={form.planId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="">-- Chọn gói --</option>
              {plans.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({(p.priceMonth || 0).toLocaleString()}₫/tháng,{""}
                  {(p.priceYear || 0).toLocaleString()}₫/năm)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Loại gói *</label>
            <select
              name="planType"
              value={form.planType}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              <option value="month">Tháng</option>
              <option value="year">Năm</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Định danh cá nhân (slast) *
            </label>
            <input
              type="text"
              name="slast"
              value={form.slast}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
              autoComplete="off"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 mt-1">
              Định danh này sẽ xuất hiện trên đường dẫn truy cập cá nhân của
              user (ví dụ:{""}
              <b>
                cloudstorage.com/leader/<i>slast</i>/home
              </b>
              ). Mỗi người dùng phải có một định danh duy nhất, không trùng với
              người khác.
            </div>
            {slastChecking && (
              <div className="text-xs text-blue-500 mt-1">
                Đang kiểm tra định danh...
              </div>
            )}
            {slastExists && !slastChecking && (
              <div className="text-xs text-red-500 mt-1">
                Định danh này đã được sử dụng, hãy chọn định danh khác.
              </div>
            )}
          </div>
          {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
          {success && (
            <div className="text-green-600 text-sm mt-1">
              Tạo user thành công!
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-primary text-white font-semibold text-lg mt-2 hover:bg-primary/90 disabled:bg-gray-300"
            disabled={loading}
          >
            {loading ? "Đang tạo..." : "Tạo người dùng"}
          </button>
        </form>
      </div>
    </div>
  );
}
