"use client";
import React, { useState } from "react";
import { FiEye } from "react-icons/fi";
import toast from "react-hot-toast";
import Modal from "@/shared/ui/Modal";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axiosClient from "@/shared/lib/axiosClient";
import EmptyState from "@/shared/ui/EmptyState";
const STATUS_LABEL = {
  pending: "Chờ duyệt",
  paid: "Hoàn thành",
  cancelled: "Đã huỷ",
};
const ORDER_TYPE_LABEL = {
  register: "Đơn mới",
  renew: "Gia hạn",
  upgrade: "Nâng cấp",
  downgrade: "Hạ cấp",
};
function formatPrice(price) {
  if (!price) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "₫";
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN");
}
export default function OrderTab({
  orders,
  loading,
  search,
  statusFilter,
  page,
  totalPages,
  onSearch,
  onStatusFilter,
  onPage,
  reloadOrders,
}) {
  const [modalOrder, setModalOrder] = useState(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const handleOpenModal = (order) => {
    setModalOrder(order);
    setShowRejectReason(false);
    setRejectReason("");
  };
  const handleCloseModal = () => {
    setModalOrder(null);
    setShowRejectReason(false);
    setRejectReason("");
  };
  const handleApprove = async () => {
    if (!modalOrder) return;
    setApproving(true);
    try {
      // ✅ Cookie sent automatically
      const res = await axiosClient.patch(
        "/api/admin/orders",
        { orderId: modalOrder._id, action: "approve" }
      );
      if (res.data.success) {
        toast.success("Duyệt đơn thành công!");
        reloadOrders?.();
        handleCloseModal();
      } else {
        toast.error(res.data.error || "Có lỗi xảy ra khi duyệt đơn!");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi duyệt đơn!");
    } finally {
      setApproving(false);
    }
  };
  const handleReject = async () => {
    if (!modalOrder || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      // ✅ Cookie sent automatically
      const res = await axiosClient.patch(
        "/api/admin/orders",
        { orderId: modalOrder._id, action: "reject", reason: rejectReason }
      );
      if (res.data.success) {
        toast.success("Đã từ chối đơn hàng!");
        reloadOrders?.();
        handleCloseModal();
      } else {
        toast.error(res.data.error || "Có lỗi xảy ra khi từ chối đơn!");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi từ chối đơn!");
    } finally {
      setRejecting(false);
    }
  };
  const filteredOrders = Array.isArray(orders)
    ? orders.filter((order) => (typeFilter ? order.type === typeFilter : true))
    : [];
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
        <input
          className="w-full md:w-64 pl-3 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
          placeholder="Tìm kiếm theo tên, email, gói..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <select
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none"
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="paid">Hoàn thành</option>
          <option value="cancelled">Đã huỷ</option>
        </select>
        <select
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Tất cả loại đơn</option>
          <option value="register">Đơn mới</option>
          <option value="renew">Gia hạn</option>
          <option value="upgrade">Nâng cấp</option>
          <option value="downgrade">Hạ cấp</option>
        </select>
      </div>
      {loading ? (
        <div className="overflow-x-auto rounded-2xl shadow border border-gray-100 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-700 text-sm">
                <th className="px-4 py-3 text-left font-bold">Khách hàng</th>
                <th className="px-4 py-3 text-left font-bold">Email</th>
                <th className="px-4 py-3 text-left font-bold">Gói</th>
                <th className="px-4 py-3 text-right font-bold">Số tiền</th>
                <th className="px-4 py-3 text-left font-bold">Nội dung CK</th>
                <th className="px-4 py-3 text-center font-bold">Loại đơn</th>
                <th className="px-4 py-3 text-center font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-bold">Thời gian</th>
                <th className="px-4 py-3 text-center font-bold">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx}>
                  {Array.from({ length: 9 }).map((__, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      <Skeleton width={80} height={18} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full py-12">
          <EmptyState message="Không có đơn hàng nào." height={180} />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow border border-gray-100 bg-white">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-700 text-sm">
                <th className="px-4 py-3 text-left font-bold">Khách hàng</th>
                <th className="px-4 py-3 text-left font-bold">Email</th>
                <th className="px-4 py-3 text-left font-bold">Gói</th>
                <th className="px-4 py-3 text-right font-bold">Số tiền</th>
                <th className="px-4 py-3 text-left font-bold">Nội dung CK</th>
                <th className="px-4 py-3 text-center font-bold">Loại đơn</th>
                <th className="px-4 py-3 text-center font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-bold">Thời gian</th>
                <th className="px-4 py-3 text-center font-bold">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-blue-50/40 transition-all group"
                >
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                    {order.fullName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {order.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-blue-700 font-semibold">
                    {order.plan?.name}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-700">
                    {formatPrice(order.amount)}
                  </td>
                  <td
                    className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate"
                    title={order.transferContent}
                  >
                    {order.transferContent}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold shadow-sm transition-all bg-slate-100 text-slate-700">
                      {ORDER_TYPE_LABEL[order.type] || order.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${
                        order.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      } group-hover:scale-105`}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition"
                      onClick={() => handleOpenModal(order)}
                      title="Xem chi tiết"
                    >
                      <FiEye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition border border-transparent hover:bg-gray-100 ${
                  p === page ? "bg-gray-900 text-white" : "text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}
          </nav>
        </div>
      )}
      {modalOrder && (
        <Modal isOpen={!!modalOrder} onClose={handleCloseModal}>
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={handleCloseModal}
              title="Đóng"
            >
              ×
            </button>
            <div className="mb-4">
              <div className="text-lg font-bold mb-1">Chi tiết đơn hàng</div>
              <div className="text-sm text-gray-500 mb-2">
                Mã đơn:{""}
                <span className="font-mono text-xs">{modalOrder._id}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-semibold text-gray-700">Khách hàng:</div>
                <div>{modalOrder.fullName}</div>
                <div className="font-semibold text-gray-700">Email:</div>
                <div>{modalOrder.email}</div>
                <div className="font-semibold text-gray-700">
                  Số điện thoại:
                </div>
                <div>{modalOrder.phone}</div>
                <div className="font-semibold text-gray-700">Gói:</div>
                <div>{modalOrder.plan?.name}</div>
                <div className="font-semibold text-gray-700">Số tiền:</div>
                <div className="font-bold text-green-700">
                  {formatPrice(modalOrder.amount)}
                </div>
                <div className="font-semibold text-gray-700">Nội dung CK:</div>
                <div className="text-xs text-gray-600">
                  {modalOrder.transferContent}
                </div>
                <div className="font-semibold text-gray-700">Loại đơn:</div>
                <div>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold shadow-sm bg-slate-100 text-slate-700">
                    {ORDER_TYPE_LABEL[modalOrder.type] || modalOrder.type}
                  </span>
                </div>
                <div className="font-semibold text-gray-700">Trạng thái:</div>
                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm transition-all ${
                      modalOrder.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : modalOrder.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {STATUS_LABEL[modalOrder.status]}
                  </span>
                </div>
                <div className="font-semibold text-gray-700">Thời gian:</div>
                <div>{formatDate(modalOrder.createdAt)}</div>
              </div>
            </div>
            {modalOrder.status === "pending" && (
              <div className="mt-4">
                {!showRejectReason ? (
                  <div className="flex gap-2 justify-end">
                    <button
                      className="px-4 py-2 rounded bg-primary text-white font-semibold text-sm shadow hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={approving}
                      onClick={handleApprove}
                    >
                      {approving ? "Đang duyệt..." : "Duyệt đơn"}
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-red-500 text-white font-semibold text-sm shadow hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={rejecting}
                      onClick={() => setShowRejectReason(true)}
                    >
                      Không duyệt
                    </button>
                  </div>
                ) : (
                  <Modal
                    isOpen={showRejectReason}
                    onClose={() => setShowRejectReason(false)}
                  >
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs">
                      <div className="font-semibold text-lg mb-2 text-red-600">
                        Lý do không duyệt
                      </div>
                      <textarea
                        className="w-full border border-gray-200 rounded p-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                        rows={3}
                        placeholder="Nhập lý do không duyệt..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        disabled={rejecting}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
                          onClick={() => setShowRejectReason(false)}
                          disabled={rejecting}
                        >
                          Quay lại
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-red-500 text-white text-xs font-semibold shadow hover:bg-red-700 disabled:opacity-60"
                          onClick={handleReject}
                          disabled={rejecting || !rejectReason.trim()}
                        >
                          {rejecting ? "Đang gửi..." : "Xác nhận không duyệt"}
                        </button>
                      </div>
                    </div>
                  </Modal>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
