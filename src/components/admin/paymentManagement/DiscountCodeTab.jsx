import React, { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axiosClient from "@/lib/axiosClient";

export default function DiscountCodeTab() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addCode, setAddCode] = useState("");
  const [addPercent, setAddPercent] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch codes
  useEffect(() => {
    setLoading(true);
    axiosClient
      .get("/api/admin/discount-codes")
      .then((res) => {
        const data = res.data;
        if (data.success) setCodes(data.data);
        else setCodes([]);
      })
      .catch(() => setCodes([]))
      .finally(() => setLoading(false));
  }, []);

  // Thêm mã
  const handleAdd = async () => {
    setError("");
    if (!addCode.trim() || !addPercent) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (isNaN(addPercent) || addPercent < 1 || addPercent > 100) {
      setError("Phần trăm giảm phải từ 1 đến 100.");
      return;
    }
    setAddLoading(true);
    try {
      const res = await axiosClient.post("/api/admin/discount-codes", {
        code: addCode,
        percent: addPercent,
      });
      const data = res.data;
      if (data.success) {
        setCodes((prev) => [data.data, ...prev]);
        setShowAdd(false);
        setAddCode("");
        setAddPercent("");
      } else {
        setError(data.message || "Có lỗi xảy ra.");
      }
    } catch (e) {
      setError("Có lỗi xảy ra khi tạo mã.");
    } finally {
      setAddLoading(false);
    }
  };

  // Xóa mã
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa mã này?")) return;
    setLoading(true);
    try {
      const res = await axiosClient.delete(`/api/admin/discount-codes`, {
        params: { id },
      });
      const data = res.data;
      if (data.success) {
        setCodes((prev) => prev.filter((x) => x._id !== id));
      } else {
        alert(data.message || "Xóa thất bại");
      }
    } catch (e) {
      alert("Có lỗi khi xóa mã");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-1 text-gray-900">
            Quản lý mã giảm giá
          </h2>
          <p className="text-gray-500 text-sm">
            Tạo, cấp phát và theo dõi mã giảm giá cho người dùng. Mỗi mã chỉ
            dùng được 1 lần, giảm theo phần trăm, không có điều kiện.
          </p>
        </div>
        <button
          className="px-5 py-2 rounded-xl bg-primary text-white font-bold shadow hover:bg-primary/90 transition text-base"
          onClick={() => setShowAdd(true)}
        >
          + Thêm mã giảm giá
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border shadow-lg p-5 flex flex-col gap-2 bg-white"
            >
              <div className="flex items-center gap-2 mb-2">
                <Skeleton width={80} height={24} />
                <Skeleton width={40} height={20} />
              </div>
              <Skeleton width={100} height={16} />
              <div className="absolute top-3 right-3">
                <Skeleton circle width={24} height={24} />
              </div>
            </div>
          ))
        ) : codes.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-10">
            Chưa có mã giảm giá nào.
          </div>
        ) : (
          codes.map((c) => (
            <div
              key={c._id}
              className={`rounded-2xl border shadow-lg p-5 flex flex-col gap-2 relative bg-white ${
                c.used ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold tracking-widest text-primary">
                  {c.code}
                </span>
                <span className="ml-2 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
                  -{c.percent}%
                </span>
              </div>
              <div className="flex-1 text-sm text-gray-500">
                {c.used ? (
                  <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
                    Đã sử dụng
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                    Chưa sử dụng
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="12" r="5" fill="#3b82f6" />
                    </svg>
                  </span>
                )}
              </div>
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition"
                title="Xóa mã"
                onClick={() => handleDelete(c._id)}
                disabled={loading}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
      {/* Modal thêm mã giảm giá */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs flex flex-col gap-4">
            <div className="text-lg font-bold mb-2">Thêm mã giảm giá</div>
            <input
              className="border rounded px-3 py-2"
              placeholder="Nhập mã..."
              value={addCode}
              onChange={(e) => setAddCode(e.target.value)}
              disabled={addLoading}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Phần trăm giảm (%)"
              type="number"
              min={1}
              max={100}
              value={addPercent}
              onChange={(e) => setAddPercent(e.target.value)}
              disabled={addLoading}
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex gap-2 justify-end mt-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                onClick={() => {
                  setShowAdd(false);
                  setError("");
                }}
                disabled={addLoading}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded bg-primary text-white font-bold"
                onClick={handleAdd}
                disabled={addLoading}
              >
                {addLoading ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
