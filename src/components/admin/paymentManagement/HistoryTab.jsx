import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const STATUS_LABEL = {
  paid: "Hoàn thành",
  cancelled: "Đã huỷ",
};

function formatPrice(price) {
  if (price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "₫";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN");
}

export default function HistoryTab({
  orders,
  loading,
  search,
  statusFilter,
  page,
  totalPages,
  onSearch,
  onStatusFilter,
  onPage,
}) {
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
          <option value="">Tất cả</option>
          <option value="paid">Hoàn thành</option>
          <option value="cancelled">Đã huỷ</option>
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
                <th className="px-4 py-3 text-center font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-bold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Array.from({ length: 8 }).map((_, idx) => (
                <tr key={idx}>
                  <td>
                    <Skeleton width={80} height={18} />
                  </td>
                  <td>
                    <Skeleton width={100} height={18} />
                  </td>
                  <td>
                    <Skeleton width={80} height={18} />
                  </td>
                  <td>
                    <Skeleton width={60} height={18} />
                  </td>
                  <td>
                    <Skeleton width={120} height={16} />
                  </td>
                  <td>
                    <Skeleton width={60} height={18} />
                  </td>
                  <td>
                    <Skeleton width={80} height={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          Không có đơn hàng nào.
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
                <th className="px-4 py-3 text-center font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-center font-bold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders
                .filter(
                  (order) =>
                    order.status === "paid" || order.status === "cancelled"
                )
                .map((order) => (
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
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm transition-all
                              ${
                                order.status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700 bg-red-50"
                              }
                              group-hover:scale-105
                            `}
                      >
                        {STATUS_LABEL[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Phân trang */}
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
    </>
  );
}
