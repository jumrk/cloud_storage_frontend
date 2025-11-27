import React from "react";
import PaymentMethodModal from "./PaymentMethodModal";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import Loader from "@/shared/ui/Loader";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import EmptyState from "@/shared/ui/EmptyState";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

export default function ConfigTab({
  paymentMethodsData = [],
  loading,
  onAdd,
  onEdit,
  onDelete,
  actionLoading,
  modalOpen,
  editingMethod,
  onCloseModal,
  onSubmitPaymentMethod,
  confirmOpen,
  onCloseConfirm,
  onConfirmDelete,
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Phương thức thanh toán</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold text-sm"
        >
          <FiPlus className="text-lg" /> Thêm phương thức
        </button>
      </div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 bg-white rounded shadow"
            >
              <Skeleton width={40} height={40} circle />
              <div className="flex-1">
                <Skeleton width={120} height={18} />
                <Skeleton width={80} height={14} className="mt-2" />
              </div>
              <Skeleton width={60} height={32} />
            </div>
          ))}
        </div>
      ) : paymentMethodsData.length === 0 ? (
        <div className="flex flex-col items-center justify-center w-full py-12">
          <EmptyState message="Chưa có phương thức thanh toán nào." height={180} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethodsData.map((method) => (
            <div
              key={method._id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{method.icon}</span>
                  <span className="font-semibold">{method.name}</span>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    method.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {method.isActive ? "Hoạt động" : "Tạm ngưng"}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>Số tài khoản: {method.accountNumber}</div>
                <div>Tên tài khoản: {method.accountName}</div>
                {method.bankName && <div>Ngân hàng: {method.bankName}</div>}
                <div>Loại: {method.type}</div>
                {method.description && (
                  <div className="text-xs text-gray-500 mt-2">
                    {method.description}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {formatDate(method.createdAt)}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => onEdit(method)}
                    className="p-1 text-gray-400 hover:text-yellow-600 rounded"
                    title="Chỉnh sửa"
                  >
                    <FiEdit2 className="text-sm" />
                  </button>
                  <button
                    onClick={() => onDelete(method._id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Xóa"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <PaymentMethodModal
        open={modalOpen}
        onClose={onCloseModal}
        method={editingMethod}
        onSubmit={onSubmitPaymentMethod}
        loading={actionLoading}
      />
      <ConfirmDialog
        open={confirmOpen}
        onClose={onCloseConfirm}
        onConfirm={onConfirmDelete}
        title="Xác nhận xoá"
        message="Bạn có chắc chắn muốn xoá phương thức thanh toán này?"
        confirmText="Xoá"
        cancelText="Hủy"
      />
      {actionLoading && <Loader />}
    </div>
  );
}


