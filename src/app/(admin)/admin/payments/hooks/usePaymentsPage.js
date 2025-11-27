"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import paymentService from "../services/paymentService";
import paymentMethodService from "@/shared/services/paymentMethodService";

export default function usePaymentsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Payment methods
  const [paymentMethodsData, setPaymentMethodsData] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Orders tab
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersStats, setOrdersStats] = useState({});
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);

  // History tab
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  const fetchPaymentMethods = useCallback(async () => {
    setLoadingMethods(true);
    try {
      const res = await paymentMethodService.getPaymentMethods({
        page: 1,
        limit: 100,
      });
      if (res.success) {
        setPaymentMethodsData(res.data);
      } else {
        setPaymentMethodsData([]);
      }
    } catch (err) {
      setPaymentMethodsData([]);
    } finally {
      setLoadingMethods(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const params = {
        page: orderPage,
        limit: 12,
      };
      if (orderSearch) params.search = orderSearch;
      if (orderStatus) params.status = orderStatus;

      const data = await paymentService.getOrders(params);
      if (data.success) {
        setOrders(data.data);
        setOrdersStats(data.stats || {});
        setOrderTotalPages(data.pagination?.pages || 1);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [orderPage, orderSearch, orderStatus]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = {
        page: historyPage,
        limit: 12,
      };
      if (historySearch) params.search = historySearch;
      if (historyStatus) params.status = historyStatus;

      const data = await paymentService.getOrders(params);
      if (data.success) {
        setHistoryOrders(data.data);
        setHistoryTotalPages(data.pagination?.pages || 1);
      } else {
        setHistoryOrders([]);
      }
    } catch (err) {
      setHistoryOrders([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historySearch, historyStatus]);

  const fetchOverviewStats = useCallback(async () => {
    try {
      const data = await paymentService.getOrders({ page: 1, limit: 1 });
      if (data.success) {
        setOrdersStats(data.stats || {});
      }
    } catch (err) {
      setOrdersStats({});
    }
  }, []);

  // Effects
  useEffect(() => {
    if (activeTab === "config") {
      fetchPaymentMethods();
    }
  }, [activeTab, fetchPaymentMethods]);

  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  useEffect(() => {
    if (activeTab === "overview") {
      fetchOverviewStats();
    }
  }, [activeTab, fetchOverviewStats]);

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
      } else {
        toast.error("Có lỗi xảy ra khi xóa phương thức thanh toán!");
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

  return {
    activeTab,
    setActiveTab,
    // Overview
    ordersStats,
    // Orders tab
    orders,
    ordersLoading,
    orderSearch,
    setOrderSearch,
    orderStatus,
    setOrderStatus,
    orderPage,
    setOrderPage,
    orderTotalPages,
    refetchOrders: fetchOrders,
    // History tab
    historyOrders,
    historyLoading,
    historySearch,
    setHistorySearch,
    historyStatus,
    setHistoryStatus,
    historyPage,
    setHistoryPage,
    historyTotalPages,
    // Payment methods
    paymentMethodsData,
    loadingMethods,
    actionLoading,
    modalOpen,
    editingMethod,
    confirmOpen,
    setConfirmOpen,
    handleAddPaymentMethod,
    handleEditPaymentMethod,
    handleDeletePaymentMethod,
    handleCloseModal,
    handleSubmitPaymentMethod,
    handleConfirmDelete,
  };
}


