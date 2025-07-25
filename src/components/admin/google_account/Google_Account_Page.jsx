"use client";
import { useEffect, useState } from "react";
import TotalStorageBar from "@/components/admin/TotalStorageBar";
import DriveAccountCard from "@/components/admin/DriveAccountCard";
import Modal from "@/components/Modal";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axiosClient from "@/lib/axiosClient";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminGoogleAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [minUsed, setMinUsed] = useState("");
  const [maxUsed, setMaxUsed] = useState("");
  const [loading, setLoading] = useState(true);
  const [used, setUsed] = useState(0);
  const [total, setTotal] = useState(0);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    done: false,
    error: "",
  });

  // Fetch tổng dung lượng
  useEffect(() => {
    axiosClient
      .get("/api/admin/drive/storage")
      .then((r) => {
        setUsed(r.data.used || 0);
        setTotal(r.data.total || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch danh sách tài khoản
  const fetchAccounts = () => {
    setLoading(true);
    const params = {};
    if (search) params.email = search;
    if (minUsed) params.minUsed = minUsed;
    if (maxUsed) params.maxUsed = maxUsed;
    axiosClient
      .get("/api/admin/drive/list", { params })
      .then((r) => setAccounts(r.data.accounts || []))
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(fetchAccounts, [search, minUsed, maxUsed]);

  // Xử lý xóa: Luôn yêu cầu chọn tài khoản đích để chuyển file trước khi xóa
  const handleDelete = (acc) => {
    setDeletingAccount(acc);
    setTransferTarget(null);
    setTransferError("");
    setShowTransferModal(true);
  };
  const handleRelink = (acc) => {
    alert(`Liên kết lại tài khoản: ${acc.email}`);
  };

  const handleConfirmTransfer = async () => {
    if (!transferTarget) return;
    setTransferLoading(true);
    setTransferError("");
    try {
      const res = await axiosClient.post(
        "/api/admin/drive/delete-with-transfer",
        {
          accountId: deletingAccount._id,
          targetAccountId: transferTarget,
        }
      );
      if (res.data && res.data.success) {
        setAccounts((prev) =>
          prev.filter((a) => a._id !== deletingAccount._id)
        );
        setShowTransferModal(false);
        setDeletingAccount(null);
        setTransferTarget(null);
      } else {
        setTransferError(res.data.error || "Chuyển file thất bại");
      }
    } catch (err) {
      setTransferError("Chuyển file thất bại");
    }
    setTransferLoading(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-4">
      {/* Header + mô tả */}
      <div className="mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Quản lý tài khoản Google
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý các tài khoản Google Drive đã liên kết tại đây.
        </p>
      </div>
      {/* Tổng dung lượng */}
      <div className="mb-6 flex justify-center">
        <div className="w-full md:w-2/3">
          {loading ? (
            <Skeleton height={32} borderRadius={12} />
          ) : (
            <TotalStorageBar used={used || 0} total={total || 0} />
          )}
        </div>
      </div>
      {/* Tìm kiếm & lọc */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-6">
        <input
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-64"
          placeholder="Tìm kiếm email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-40"
          placeholder="Min used (MB)"
          type="number"
          value={minUsed}
          onChange={(e) => setMinUsed(e.target.value)}
        />
        <input
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-40"
          placeholder="Max used (MB)"
          type="number"
          value={maxUsed}
          onChange={(e) => setMaxUsed(e.target.value)}
        />
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-sm md:ml-2"
          onClick={fetchAccounts}
        >
          Lọc
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold text-sm md:ml-auto">
          <a href={`${process.env.NEXT_PUBLIC_API_BASE}/api/auth/oauth`}>
            + Liên kết tài khoản
          </a>
        </button>
      </div>
      {/* Danh sách tài khoản */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow p-6 flex flex-col items-center border border-gray-200"
            >
              <Skeleton circle width={48} height={48} className="mb-3" />
              <Skeleton width={120} height={18} />
              <Skeleton width={80} height={14} className="mt-2" />
              <Skeleton width={100} height={16} className="mt-2" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full py-12">
          <EmptyState message="Không có tài khoản nào." height={180} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((acc) => (
            <DriveAccountCard
              key={acc._id}
              account={acc}
              onDelete={handleDelete} // Chỉ còn 1 luồng xóa
              onRelink={handleRelink}
            />
          ))}
        </div>
      )}
      {/* Modal chọn tài khoản đích để chuyển file */}
      {showTransferModal && (
        <Modal onClose={() => setShowTransferModal(false)}>
          <div className="p-6 max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">
              Để xóa tài khoản, hãy chọn tài khoản đích để chuyển toàn bộ dữ
              liệu:
            </h2>
            <select
              className="w-full border rounded p-2 mb-4"
              value={transferTarget || ""}
              onChange={(e) => setTransferTarget(e.target.value)}
            >
              <option value="">-- Chọn tài khoản đích --</option>
              {accounts
                .filter((a) => a._id !== deletingAccount._id)
                .map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.email}
                  </option>
                ))}
            </select>
            {transferError && (
              <div className="text-red-500 mb-2">{transferError}</div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
                onClick={() => setShowTransferModal(false)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-300"
                disabled={!transferTarget || transferLoading}
                onClick={handleConfirmTransfer}
              >
                {transferLoading ? "Đang chuyển..." : "Chuyển và xóa"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* Modal progress khi xóa tài khoản */}
      {/* Đoạn này có thể bỏ nếu không còn dùng tiến trình xóa trực tiếp, hoặc giữ lại nếu muốn hiển thị tiến trình khi API trả về trạng thái */}
    </div>
  );
}
