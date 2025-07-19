"use client";
import { useEffect, useState, useMemo } from "react";
import OverviewTab from "@/components/admin/paymentManagement/OverviewTab";
import OrderTab from "@/components/admin/paymentManagement/OrderTab";
import HistoryTab from "@/components/admin/paymentManagement/HistoryTab";
import ConfigTab from "@/components/admin/paymentManagement/ConfigTab";
import DiscountCodeTab from "@/components/admin/paymentManagement/DiscountCodeTab";
import paymentMethodService from "@/lib/paymentMethodService";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import axiosClient from "@/lib/axiosClient";

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  // Payment methods state
  const [paymentMethodsData, setPaymentMethodsData] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersStats, setOrdersStats] = useState({});
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);

  // History state (paid/cancelled)
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState(""); // Mặc định là tất cả
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  // Fetch payment methods
  useEffect(() => {
    if (activeTab !== "config") return;
    setLoadingMethods(true);
    paymentMethodService
      .getPaymentMethods({ page: 1, limit: 100 })
      .then((res) => {
        if (res.success) setPaymentMethodsData(res.data);
      })
      .catch(() => setPaymentMethodsData([]))
      .finally(() => {
        setLoadingMethods(false);
      });
  }, [activeTab]);

  // Fetch orders for OrderTab
  useEffect(() => {
    if (activeTab !== "orders") return;
    setOrdersLoading(true);
    const params = {
      page: orderPage,
      limit: 12,
    };
    if (orderSearch) params.search = orderSearch;
    if (orderStatus) params.status = orderStatus;
    axiosClient
      .get("/api/admin/orders", { params })
      .then((res) => {
        const data = res.data;
        if (data.success) {
          setOrders(data.data);
          setOrdersStats(data.stats);
          setOrderTotalPages(data.pagination.pages);
        }
      })
      .catch(() => setOrders([]))
      .finally(() => {
        setOrdersLoading(false);
      });
  }, [activeTab, orderSearch, orderStatus, orderPage]);

  // Fetch orders for HistoryTab
  useEffect(() => {
    if (activeTab !== "history") return;
    setHistoryLoading(true);
    const params = {
      page: historyPage,
      limit: 12,
    };
    if (historySearch) params.search = historySearch;
    if (historyStatus) params.status = historyStatus;
    axiosClient
      .get("/api/admin/orders", { params })
      .then((res) => {
        const data = res.data;
        if (data.success) {
          setHistoryOrders(data.data);
          setHistoryTotalPages(data.pagination.pages);
        }
      })
      .catch(() => setHistoryOrders([]))
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [activeTab, historySearch, historyStatus, historyPage]);

  // Fetch stats for OverviewTab
  useEffect(() => {
    if (activeTab !== "overview") return;
    axiosClient
      .get(`/api/admin/orders`, { params: { page: 1, limit: 1 } })
      .then((res) => {
        const data = res.data;
        if (data.success) setOrdersStats(data.stats);
      })
      .finally(() => {
        // setGlobalLoading(false); // Removed
      });
  }, [activeTab]);

  // Payment method handlers
  const handleAddPaymentMethod = () => {
    setEditingMethod(null);
    setModalOpen(true);
  };
  const handleEditPaymentMethod = (method) => {
    setEditingMethod(method);
    setModalOpen(true);
  };
  const handleDeletePaymentMethod = (id) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    setActionLoading(true);
    try {
      const response = await paymentMethodService.deletePaymentMethod(
        pendingDeleteId
      );
      if (response.success) {
        setPaymentMethodsData((prev) =>
          prev.filter((p) => p._id !== pendingDeleteId)
        );
        toast.success("Xóa phương thức thanh toán thành công!");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi xóa phương thức thanh toán!");
    } finally {
      setActionLoading(false);
      setPendingDeleteId(null);
    }
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingMethod(null);
  };
  const handleSubmitPaymentMethod = async (methodData) => {
    setActionLoading(true);
    try {
      if (methodData._id) {
        const response = await paymentMethodService.updatePaymentMethod(
          methodData._id,
          methodData
        );
        if (response.success) {
          setPaymentMethodsData((prev) =>
            prev.map((m) => (m._id === methodData._id ? response.data : m))
          );
          toast.success("Cập nhật phương thức thanh toán thành công!");
        }
      } else {
        const response = await paymentMethodService.createPaymentMethod(
          methodData
        );
        if (response.success) {
          setPaymentMethodsData((prev) => [...prev, response.data]);
          toast.success("Thêm phương thức thanh toán thành công!");
        }
      }
      setModalOpen(false);
      setEditingMethod(null);
    } catch (err) {
      toast.error("Có lỗi xảy ra khi lưu phương thức thanh toán!");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 py-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          Quản lý thanh toán
        </h1>
        <p className="text-gray-500 text-sm">
          Quản lý doanh thu, cấu hình thanh toán và theo dõi lịch sử giao dịch.
        </p>
      </div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "overview"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Tổng quan doanh thu
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "orders"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Đơn hàng
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "config"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Cấu hình thanh toán
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "history"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Lịch sử thanh toán
        </button>
        <button
          onClick={() => setActiveTab("discount")}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "discount"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Mã giảm giá
        </button>
      </div>
      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="gap-4 mb-8">
          {Object.keys(ordersStats).length === 0 ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg px-4 py-5 flex flex-col items-center rounded-xl"
              >
                <Skeleton width={60} height={28} />
                <Skeleton width={80} height={18} className="mt-2" />
              </div>
            ))
          ) : (
            <OverviewTab stats={ordersStats} />
          )}
        </div>
      )}
      {activeTab === "orders" && (
        <OrderTab
          orders={orders}
          loading={ordersLoading}
          search={orderSearch}
          statusFilter={orderStatus}
          page={orderPage}
          totalPages={orderTotalPages}
          onSearch={setOrderSearch}
          onStatusFilter={setOrderStatus}
          onPage={setOrderPage}
        />
      )}
      {activeTab === "config" && (
        <ConfigTab
          paymentMethodsData={paymentMethodsData}
          loading={loadingMethods}
          onAdd={handleAddPaymentMethod}
          onEdit={handleEditPaymentMethod}
          onDelete={handleDeletePaymentMethod}
          actionLoading={actionLoading}
          modalOpen={modalOpen}
          editingMethod={editingMethod}
          onCloseModal={handleCloseModal}
          onSubmitPaymentMethod={handleSubmitPaymentMethod}
          confirmOpen={confirmOpen}
          onCloseConfirm={() => setConfirmOpen(false)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
      {activeTab === "history" && (
        <HistoryTab
          orders={historyOrders}
          loading={historyLoading}
          search={historySearch}
          statusFilter={historyStatus}
          page={historyPage}
          totalPages={historyTotalPages}
          onSearch={setHistorySearch}
          onStatusFilter={setHistoryStatus}
          onPage={setHistoryPage}
        />
      )}
      {activeTab === "discount" && <DiscountCodeTab />}
    </div>
  );
}
